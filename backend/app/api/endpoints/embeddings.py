from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict, Any
from app.database.connection import get_db
from app.models.document import UploadedDocument
from app.models.embedding import DocumentEmbedding, DiagramEmbedding
from app.schemas.embedding import DocumentEmbeddingSchema, DiagramEmbeddingSchema, EmbeddingWithVectorSchema
from app.services.embedding_engine.pipeline import process_document_embeddings_task
from app.models.vector_db import VectorIndexMapping
from app.services.vector_db.faiss_manager import faiss_manager
import numpy as np
router = APIRouter()

@router.post("/embeddings/process/{document_id}")
async def start_embedding_generation(document_id: UUID, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    document = db.query(UploadedDocument).filter(UploadedDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if document.processing_status in ["EMBEDDING_GENERATING", "READY_FOR_INDEXING"]:
        return {"message": f"Embedding generation already {document.processing_status.lower()}", "status": document.processing_status}
        
    background_tasks.add_task(process_document_embeddings_task, document_id)
    return {"message": "Embedding generation started", "status": "EMBEDDING_GENERATING"}

@router.get("/embeddings/{document_id}")
def get_document_embeddings(document_id: UUID, db: Session = Depends(get_db)):
    """
    Returns metadata for all embeddings without the heavy vector arrays.
    """
    chunks = db.query(DocumentEmbedding).filter(DocumentEmbedding.document_id == document_id).all()
    diagrams = db.query(DiagramEmbedding).filter(DiagramEmbedding.document_id == document_id).all()
    
    return {
        "document_embeddings": [DocumentEmbeddingSchema.model_validate(c) for c in chunks],
        "diagram_embeddings": [DiagramEmbeddingSchema.model_validate(d) for d in diagrams]
    }

@router.get("/embedding/{embedding_id}", response_model=EmbeddingWithVectorSchema)
def get_embedding(embedding_id: UUID, db: Session = Depends(get_db)):
    """
    Returns a specific embedding including the raw vector data.
    """
    emb = db.query(DocumentEmbedding).filter(DocumentEmbedding.id == embedding_id).first()
    if not emb:
        raise HTTPException(status_code=404, detail="Embedding not found")
    
    return emb

@router.delete("/embedding/{embedding_id}")
def delete_embedding(embedding_id: UUID, db: Session = Depends(get_db)):
    emb = db.query(DocumentEmbedding).filter(DocumentEmbedding.id == embedding_id).first()
    if not emb:
        # Check diagram embeddings
        emb = db.query(DiagramEmbedding).filter(DiagramEmbedding.id == embedding_id).first()
        if not emb:
            raise HTTPException(status_code=404, detail="Embedding not found")
            
    # Retrieve FAISS mapping and remove from vector DB
    mapping = db.query(VectorIndexMapping).filter(VectorIndexMapping.embedding_id == embedding_id).first()
    if mapping:
        index = faiss_manager.get_index(mapping.index_name)
        index.remove_ids(np.array([mapping.faiss_id], dtype=np.int64))
        faiss_manager.save_indices()
        db.delete(mapping)
            
    db.delete(emb)
    db.commit()
    return {"message": "Embedding deleted successfully"}
