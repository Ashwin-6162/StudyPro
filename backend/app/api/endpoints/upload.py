from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import List
from sqlalchemy.orm import Session
from uuid import UUID
from app.database.connection import get_db
from app.schemas.document import DocumentResponse
from app.services import file_service

router = APIRouter()

@router.post("/upload", response_model=List[DocumentResponse])
async def upload_files(files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
        
    responses = []
    for file in files:
        response = await file_service.save_upload_file(file, db)
        responses.append(response)
    return responses

@router.get("/files", response_model=List[DocumentResponse])
def list_files(db: Session = Depends(get_db)):
    return file_service.get_all_files(db)

@router.get("/files/{file_id}", response_model=DocumentResponse)
def get_file(file_id: UUID, db: Session = Depends(get_db)):
    document = file_service.get_file_by_id(db, file_id)
    if not document:
        raise HTTPException(status_code=404, detail="File not found")
    return document

@router.delete("/files/{file_id}")
def delete_file(file_id: UUID, db: Session = Depends(get_db)):
    success = file_service.delete_file(db, file_id)
    if not success:
        raise HTTPException(status_code=404, detail="File not found")
    return {"message": "File deleted successfully"}
