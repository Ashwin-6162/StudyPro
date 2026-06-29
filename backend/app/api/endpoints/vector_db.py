from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict, Any
from app.database.connection import get_db
from app.models.document import UploadedDocument
from app.schemas.vector_db import SearchRequest, SearchResponse, SearchResultItem
from app.services.vector_db.indexer import index_document_task
from app.services.vector_db.retriever import hybrid_search
from app.services.vector_db.faiss_manager import faiss_manager

router = APIRouter()

@router.post("/vector/index/{document_id}")
async def start_indexing(document_id: UUID, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    document = db.query(UploadedDocument).filter(UploadedDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if document.processing_status == "READY_FOR_RETRIEVAL":
        return {"message": "Document is already indexed and ready for retrieval", "status": document.processing_status}
        
    background_tasks.add_task(index_document_task, document_id)
    return {"message": "Indexing started", "status": "INDEXING"}

@router.post("/vector/search", response_model=SearchResponse)
def search_vectors(request: SearchRequest, db: Session = Depends(get_db)):
    """
    Perform a semantic search against the FAISS index.
    """
    try:
        results_data = hybrid_search(request.query, request.top_k, request.index_name, db)
        
        results = []
        for res in results_data:
            results.append(SearchResultItem(
                faiss_id=res["faiss_id"],
                embedding_id=res["embedding_id"],
                document_id=res["document_id"],
                score=res["score"],
                metadata=res["metadata"]
            ))
            
        return SearchResponse(query=request.query, results=results)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/vector/status")
def get_vector_status():
    """
    Returns the health and vector counts of the multi-index FAISS architecture.
    """
    return {
        "chunk_index_total": faiss_manager.chunk_index.ntotal,
        "diagram_index_total": faiss_manager.diagram_index.ntotal,
        "dimension": 384,
        "status": "healthy"
    }

@router.post("/vector/rebuild")
def rebuild_indexes():
    """
    (Placeholder) Drops current FAISS indices from disk and memory, 
    and reconstructs them completely from Postgres.
    """
    return {"message": "Rebuild triggered (Not implemented fully in MVP)"}
