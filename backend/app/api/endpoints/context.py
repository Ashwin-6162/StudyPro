from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.context import ContextRequestSchema, ContextPackageSchema
from app.services.context_builder.builder import build_context_package

router = APIRouter()

@router.post("/context/build", response_model=ContextPackageSchema)
def build_generic_context(request: ContextRequestSchema, db: Session = Depends(get_db)):
    return build_context_package(request, "GENERIC", db)

@router.post("/context/8m", response_model=ContextPackageSchema)
def build_8m_context(request: ContextRequestSchema, db: Session = Depends(get_db)):
    return build_context_package(request, "8M", db)

@router.post("/context/15m", response_model=ContextPackageSchema)
def build_15m_context(request: ContextRequestSchema, db: Session = Depends(get_db)):
    return build_context_package(request, "15M", db)

@router.post("/context/mcq", response_model=ContextPackageSchema)
def build_mcq_context(request: ContextRequestSchema, db: Session = Depends(get_db)):
    return build_context_package(request, "MCQ", db)

@router.post("/context/questions", response_model=ContextPackageSchema)
def build_questions_context(request: ContextRequestSchema, db: Session = Depends(get_db)):
    return build_context_package(request, "QUESTION_PAPER", db)

@router.get("/context/status")
def context_status():
    return {"status": "operational", "engine": "ContextBuilderEngine"}
