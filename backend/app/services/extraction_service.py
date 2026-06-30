import os
import uuid
import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.models.document import UploadedDocument
from app.models.extraction import (
    DocumentPage, DocumentImage, DocumentDiagram,
    DocumentTable, DocumentHeading, OcrResult
)
from app.schemas.extraction import ExtractionResultSchema

from app.services.extractors.pdf import extract_pdf
from app.services.extractors.docx import extract_docx
from app.services.extractors.pptx import extract_pptx
from app.services.extractors.txt import extract_txt
from app.services.extractors.diagram import classify_diagram
from app.services.extractors.ocr import perform_ocr_on_image

# Configure logging — log to BOTH a file and stdout so errors are visible
# in Render's (or any host's) log viewer, not just buried in a local file
# that the deployed container may not even persist.
os.makedirs("logs", exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("logs/extraction.log"),
        logging.StreamHandler(),  # <-- this is what makes it show up in Render logs
    ],
)
logger = logging.getLogger(__name__)

DIAGRAMS_DIR = os.path.join("uploads", "diagrams")
IMAGES_DIR = os.path.join("uploads", "images")
os.makedirs(DIAGRAMS_DIR, exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)


def _sanitize_text(value):
    """
    Postgres TEXT/VARCHAR columns cannot store NUL (0x00) bytes — psycopg2
    raises 'A string literal cannot contain NUL (0x00) characters.' if any
    slip through. Some PDFs (corrupted fonts, certain OCR engines, embedded
    binary artifacts) produce text containing stray NUL bytes, so every
    piece of extracted text must be scrubbed before it reaches the DB.
    """
    if value is None:
        return value
    if isinstance(value, str):
        return value.replace("\x00", "")
    if isinstance(value, list):
        return [_sanitize_text(v) for v in value]
    if isinstance(value, dict):
        return {k: _sanitize_text(v) for k, v in value.items()}
    return value

def process_document_task(document_id: uuid.UUID):
    """
    Background task to orchestrate extraction.
    """
    logging.info(f"Extraction Start: {document_id}")
    db: Session = SessionLocal()
    
    try:
        document = db.query(UploadedDocument).filter(UploadedDocument.id == document_id).first()
        if not document:
            logging.error(f"Document {document_id} not found.")
            return

        document.processing_status = "EXTRACTING"
        db.commit()
        
        file_path = document.file_path
        file_type = document.file_type.lower()
        
        extracted_data = None
        
        if file_type == "pdf":
            extracted_data = extract_pdf(file_path, str(document_id), IMAGES_DIR)
        elif file_type == "docx":
            extracted_data = extract_docx(file_path, str(document_id), IMAGES_DIR)
        elif file_type == "pptx":
            extracted_data = extract_pptx(file_path, str(document_id), IMAGES_DIR)
        elif file_type == "txt":
            extracted_data = extract_txt(file_path, str(document_id))
        else:
            raise ValueError(f"Unsupported file format: {file_type}")

        # Store Extracted Pages
        page_lengths = {}
        for page in extracted_data.get("pages", []):
            clean_text = _sanitize_text(page["text_content"])
            page_lengths[page["page_number"]] = len(clean_text.strip())
            db.add(DocumentPage(
                document_id=document.id,
                page_number=page["page_number"],
                text_content=clean_text
            ))

        # Store Headings
        for heading in extracted_data.get("headings", []):
            db.add(DocumentHeading(
                document_id=document.id,
                page_number=heading["page_number"],
                level=heading["level"],
                text=_sanitize_text(heading["text"])
            ))

        # Store Tables
        for table in extracted_data.get("tables", []):
            db.add(DocumentTable(
                document_id=document.id,
                page_number=table["page_number"],
                headers=_sanitize_text(table["headers"]),
                rows=_sanitize_text(table["rows"])
            ))

        # Process and Store Images / Diagrams
        for img in extracted_data.get("images", []):
            # Classify if diagram
            diagram_type = classify_diagram(img["image_path"], "")
            
            if diagram_type != "UNKNOWN":
                logging.info(f"Diagram Detection Event: Found {diagram_type} on page {img['page_number']}")
                db.add(DocumentDiagram(
                    document_id=document.id,
                    page_number=img["page_number"],
                    diagram_type=diagram_type,
                    title=f"Diagram {diagram_type}",
                    image_path=img["image_path"]
                ))
            else:
                db.add(DocumentImage(
                    document_id=document.id,
                    page_number=img["page_number"],
                    image_path=img["image_path"]
                ))

            # Run OCR fallback if image has text and page lacks text
            # Only run if page has less than 50 characters of native text to prevent massive OCR delays
            page_text_len = page_lengths.get(img["page_number"], 0)
            if page_text_len < 50:
                ocr_result = perform_ocr_on_image(img["image_path"])
                if ocr_result["text"]:
                    logging.info(f"OCR Usage: Extracted text from image on page {img['page_number']}")
                    db.add(OcrResult(
                        document_id=document.id,
                        page_number=img["page_number"],
                        text=_sanitize_text(ocr_result["text"]),
                        ocr_confidence=ocr_result["confidence"]
                    ))

        document.processing_status = "EXTRACTED" # Changed status
        db.commit()
        logging.info(f"Extraction Success: {document_id}")
        
    except Exception as e:
        db.rollback()
        logging.error(f"Extraction Failure: {document_id} - Error: {str(e)}")
        if document:
            document.processing_status = "FAILED"
            db.commit()
    finally:
        db.close()


def get_extraction_results(db: Session, document_id: uuid.UUID) -> dict:
    """
    Constructs the massively nested JSON extraction result.
    """
    document = db.query(UploadedDocument).filter(UploadedDocument.id == document_id).first()
    if not document:
        return None
        
    pages = db.query(DocumentPage).filter(DocumentPage.document_id == document_id).all()
    images = db.query(DocumentImage).filter(DocumentImage.document_id == document_id).all()
    diagrams = db.query(DocumentDiagram).filter(DocumentDiagram.document_id == document_id).all()
    tables = db.query(DocumentTable).filter(DocumentTable.document_id == document_id).all()
    headings = db.query(DocumentHeading).filter(DocumentHeading.document_id == document_id).all()

    return {
        "document_id": document.id,
        "metadata": {
            "document_id": document.id,
            "file_name": document.original_filename,
            "total_pages": len(pages),
            "total_images": len(images),
            "total_diagrams": len(diagrams),
            "total_tables": len(tables),
        },
        "pages": pages,
        "images": images,
        "diagrams": diagrams,
        "tables": tables,
        "headings": headings
    }
