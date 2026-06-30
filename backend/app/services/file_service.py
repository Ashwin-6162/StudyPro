import os
import uuid
import shutil
import logging
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.models.document import UploadedDocument
from app.models.vector_db import VectorIndexMapping
from app.schemas.document import DocumentResponse
import numpy as np

os.makedirs("logs", exist_ok=True)
os.makedirs("uploads", exist_ok=True)

# Configure logging — log to BOTH a file and stdout so errors are visible
# in Render's (or any host's) log viewer.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("logs/upload.log"),
        logging.StreamHandler(),
    ],
)

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {"pdf", "pptx", "docx", "txt"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

# Ensure directories exist
for ext in ALLOWED_EXTENSIONS:
    os.makedirs(os.path.join(UPLOAD_DIR, ext), exist_ok=True)

def validate_file(file: UploadFile) -> str:
    ext = file.filename.split(".")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        logging.warning(f"Upload failed: Unsupported file format {ext}")
        raise HTTPException(status_code=400, detail="Unsupported file format")
    return ext

async def save_upload_file(upload_file: UploadFile, db: Session) -> DocumentResponse:
    ext = validate_file(upload_file)
    file_id = uuid.uuid4()

    # Sanitize and create stored filename
    original_filename = upload_file.filename
    safe_filename = os.path.basename(original_filename)
    stored_filename = f"{file_id.hex[:8]}_{safe_filename}"
    file_path = os.path.join(UPLOAD_DIR, ext, stored_filename)

    file_size = 0
    try:
        with open(file_path, "wb") as buffer:
            while chunk := await upload_file.read(1024 * 1024):  # 1MB chunks
                file_size += len(chunk)
                if file_size > MAX_FILE_SIZE:
                    # Clean up partial file before raising
                    buffer.close()
                    os.remove(file_path)
                    logging.warning(f"Upload rejected: {original_filename} exceeds 50MB")
                    raise HTTPException(status_code=400, detail="File size exceeds 50MB limit")
                buffer.write(chunk)
    except HTTPException:
        # Re-raise HTTP exceptions (validation errors) without wrapping them
        raise
    except Exception as e:
        # Only wrap genuine I/O or unexpected errors as 500
        logging.error(f"Error saving file {original_filename}: {str(e)}")
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        raise HTTPException(status_code=500, detail="Could not save file")

    db_document = UploadedDocument(
        id=file_id,
        original_filename=safe_filename,
        stored_filename=stored_filename,
        file_type=ext,
        file_size=file_size,
        file_path=file_path,
        processing_status="UPLOADED"
    )

    db.add(db_document)
    db.commit()
    db.refresh(db_document)

    logging.info(f"Successfully uploaded {safe_filename} with ID {file_id}")
    return DocumentResponse.model_validate(db_document)

def get_all_files(db: Session):
    return db.query(UploadedDocument).all()

def get_file_by_id(db: Session, file_id: uuid.UUID):
    return db.query(UploadedDocument).filter(UploadedDocument.id == file_id).first()

from sqlalchemy import text

def delete_file(db: Session, file_id: uuid.UUID) -> bool:
    document = get_file_by_id(db, file_id)
    if not document:
        return False

    # Attempt physical file deletion first; abort if it fails to avoid orphaned DB records
    if os.path.exists(document.file_path):
        try:
            os.remove(document.file_path)
        except Exception as e:
            logging.error(f"Cannot delete file {document.file_path}: {str(e)}. Aborting DB delete to prevent orphan.")
            raise HTTPException(status_code=500, detail="Could not delete file from disk. Please try again.")

    # Remove vectors from FAISS
    try:
        from app.services.vector_db.faiss_manager import faiss_manager

        mappings = db.query(VectorIndexMapping).filter(VectorIndexMapping.document_id == file_id).all()
        chunk_faiss_ids = [m.faiss_id for m in mappings if m.index_name == "chunk_index"]
        diagram_faiss_ids = [m.faiss_id for m in mappings if m.index_name == "diagram_index"]

        if chunk_faiss_ids:
            faiss_manager.chunk_index.remove_ids(np.array(chunk_faiss_ids, dtype=np.int64))
        if diagram_faiss_ids:
            faiss_manager.diagram_index.remove_ids(np.array(diagram_faiss_ids, dtype=np.int64))

        if chunk_faiss_ids or diagram_faiss_ids:
            faiss_manager.save_indices()
    except Exception as e:
        logging.error(f"Error removing vectors from FAISS for {file_id}: {str(e)}")
        # Non-fatal: FAISS state is recoverable via rebuild; continue with DB cleanup

    # Cascade delete all related DB rows
    try:
        params = {"id": file_id}
        db.execute(text("DELETE FROM vector_index_mapping WHERE document_id = :id"), params)
        db.execute(text("DELETE FROM document_embeddings WHERE document_id = :id"), params)
        db.execute(text("DELETE FROM diagram_embeddings WHERE document_id = :id"), params)
        db.execute(text("DELETE FROM document_chunks WHERE document_id = :id"), params)
        db.execute(text("DELETE FROM document_pages WHERE document_id = :id"), params)
        db.execute(text("DELETE FROM document_images WHERE document_id = :id"), params)
        db.execute(text("DELETE FROM document_diagrams WHERE document_id = :id"), params)
        db.execute(text("DELETE FROM document_tables WHERE document_id = :id"), params)
        db.execute(text("DELETE FROM document_headings WHERE document_id = :id"), params)
        db.execute(text("DELETE FROM ocr_results WHERE document_id = :id"), params)
        db.execute(text("""
            DELETE FROM citation_mappings 
            WHERE citation_id IN (SELECT citation_id FROM source_citations WHERE document_id = :id)
        """), params)
        db.execute(text("DELETE FROM source_citations WHERE document_id = :id"), params)
        db.execute(text("DELETE FROM reconstructed_diagrams WHERE document_id = :id"), params)
    except Exception as e:
        logging.error(f"Error during cascade delete for {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fully delete document records.")

    db.delete(document)
    db.commit()
    logging.info(f"Deleted file {document.original_filename} with ID {file_id}")
    return True
