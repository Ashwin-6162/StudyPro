from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID
from app.database.connection import get_db
from app.models.document import UploadedDocument
from app.services import extraction_service
from app.schemas.extraction import ExtractionResultSchema

router = APIRouter()

@router.post("/extract/{document_id}")
async def start_extraction(document_id: UUID, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    document = db.query(UploadedDocument).filter(UploadedDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if document.processing_status in ["EXTRACTING", "EXTRACTED"]:
        return {"message": f"Extraction already {document.processing_status.lower()}", "status": document.processing_status}
        
    background_tasks.add_task(extraction_service.process_document_task, document_id)
    return {"message": "Extraction started", "status": "EXTRACTING"}

@router.get("/extract/status/{document_id}")
def get_extraction_status(document_id: UUID, db: Session = Depends(get_db)):
    document = db.query(UploadedDocument).filter(UploadedDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    return {"status": document.processing_status}

@router.get("/extract/results/{document_id}", response_model=ExtractionResultSchema)
def get_extraction_results(document_id: UUID, db: Session = Depends(get_db)):
    document = db.query(UploadedDocument).filter(UploadedDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if document.processing_status != "EXTRACTED":
        raise HTTPException(status_code=400, detail="Document extraction not complete")
        
    results = extraction_service.get_extraction_results(db, document_id)
    if not results:
        raise HTTPException(status_code=404, detail="Extraction results missing")
        
    return results
