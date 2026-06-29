from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.database.connection import get_db
from app.models.document import UploadedDocument
from app.models.extraction import DocumentDiagram
from app.schemas.diagram import DiagramSchema, DiagramSearchResponse
from app.services.diagram_engine.pipeline import process_document_diagrams_task
from app.services.diagram_engine.embeddings import generate_embedding, index_manager

router = APIRouter()

@router.post("/diagrams/process/{document_id}")
async def start_diagram_processing(document_id: UUID, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    document = db.query(UploadedDocument).filter(UploadedDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if document.processing_status in ["DIAGRAM_ANALYZING", "DIAGRAM_INDEXED"]:
        return {"message": f"Diagram processing already {document.processing_status.lower()}", "status": document.processing_status}
        
    background_tasks.add_task(process_document_diagrams_task, document_id)
    return {"message": "Diagram processing started", "status": "DIAGRAM_ANALYZING"}

@router.get("/diagrams/{document_id}", response_model=List[DiagramSchema])
def get_document_diagrams(document_id: UUID, db: Session = Depends(get_db)):
    diagrams = db.query(DocumentDiagram).filter(DocumentDiagram.document_id == document_id).all()
    # Map to schema
    result = []
    for d in diagrams:
        result.append(DiagramSchema(
            diagram_id=d.id,
            document_id=d.document_id,
            title=d.title,
            topic=d.topic,
            diagram_type=d.diagram_type,
            page_number=d.page_number,
            keywords=d.keywords,
            ocr_text=d.ocr_text,
            file_path=d.image_path,
            embedding_created=d.embedding_created,
            ready_for_retrieval=d.ready_for_retrieval,
            retrieval_score=d.retrieval_score
        ))
    return result

@router.get("/diagram/{diagram_id}", response_model=DiagramSchema)
def get_diagram(diagram_id: UUID, db: Session = Depends(get_db)):
    d = db.query(DocumentDiagram).filter(DocumentDiagram.id == diagram_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Diagram not found")
        
    return DiagramSchema(
        diagram_id=d.id,
        document_id=d.document_id,
        title=d.title,
        topic=d.topic,
        diagram_type=d.diagram_type,
        page_number=d.page_number,
        keywords=d.keywords,
        ocr_text=d.ocr_text,
        file_path=d.image_path,
        embedding_created=d.embedding_created,
        ready_for_retrieval=d.ready_for_retrieval,
        retrieval_score=d.retrieval_score
    )

@router.delete("/diagram/{diagram_id}")
def delete_diagram(diagram_id: UUID, db: Session = Depends(get_db)):
    d = db.query(DocumentDiagram).filter(DocumentDiagram.id == diagram_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Diagram not found")
        
    # Would normally delete from FAISS as well, but faiss-cpu doesn't support 
    # easy row deletion without IDMap2 which requires more setup.
    # For MVP, just delete from DB.
    db.delete(d)
    db.commit()
    
    return {"message": "Diagram deleted successfully"}

@router.get("/diagram/search", response_model=DiagramSearchResponse)
def search_diagrams(query: str, db: Session = Depends(get_db)):
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter is required")
        
    query_emb = generate_embedding(query)
    search_results = index_manager.search(query_emb, k=5)
    
    if not search_results:
        return DiagramSearchResponse(results=[])
        
    # Fetch from DB based on FAISS IDs
    diagram_ids = [res["diagram_id"] for res in search_results]
    diagrams = db.query(DocumentDiagram).filter(DocumentDiagram.id.in_(diagram_ids)).all()
    
    # Map distances to the diagrams
    score_map = {res["diagram_id"]: res["score"] for res in search_results}
    
    results = []
    for d in diagrams:
        results.append(DiagramSchema(
            diagram_id=d.id,
            document_id=d.document_id,
            title=d.title,
            topic=d.topic,
            diagram_type=d.diagram_type,
            page_number=d.page_number,
            keywords=d.keywords,
            ocr_text=d.ocr_text,
            file_path=d.image_path,
            embedding_created=d.embedding_created,
            ready_for_retrieval=d.ready_for_retrieval,
            retrieval_score=score_map.get(str(d.id), 0.0)
        ))
        
    # Sort by score (L2 distance, so lower is better)
    results.sort(key=lambda x: x.retrieval_score)
    return DiagramSearchResponse(results=results)
