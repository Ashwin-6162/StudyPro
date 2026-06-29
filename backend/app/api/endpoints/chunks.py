from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.database.connection import get_db
from app.models.document import UploadedDocument
from app.models.chunking import DocumentChunk
from app.schemas.chunk import ChunkSchema
from app.services.chunking_engine.pipeline import process_document_chunks_task

router = APIRouter()

@router.post("/chunk/process/{document_id}")
async def start_chunking(document_id: UUID, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    document = db.query(UploadedDocument).filter(UploadedDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if document.processing_status in ["CHUNKING", "READY_FOR_EMBEDDING"]:
        return {"message": f"Chunking already {document.processing_status.lower()}", "status": document.processing_status}
        
    background_tasks.add_task(process_document_chunks_task, document_id)
    return {"message": "Chunking started", "status": "CHUNKING"}

@router.get("/chunks/{document_id}", response_model=List[ChunkSchema])
def get_document_chunks(document_id: UUID, db: Session = Depends(get_db)):
    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).order_by(DocumentChunk.chunk_index).all()
    return chunks

@router.get("/chunk/{chunk_id}", response_model=ChunkSchema)
def get_chunk(chunk_id: UUID, db: Session = Depends(get_db)):
    chunk = db.query(DocumentChunk).filter(DocumentChunk.id == chunk_id).first()
    if not chunk:
        raise HTTPException(status_code=404, detail="Chunk not found")
    return chunk

@router.delete("/chunk/{chunk_id}")
def delete_chunk(chunk_id: UUID, db: Session = Depends(get_db)):
    chunk = db.query(DocumentChunk).filter(DocumentChunk.id == chunk_id).first()
    if not chunk:
        raise HTTPException(status_code=404, detail="Chunk not found")
        
    db.delete(chunk)
    db.commit()
    return {"message": "Chunk deleted successfully"}
