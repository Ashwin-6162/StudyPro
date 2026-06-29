from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.mcq import MCQRequestSchema, MCQResponseSchema
from app.services.mcq_engine.generator import generate_mcq_set

router = APIRouter()

@router.post("/mcq/generate", response_model=MCQResponseSchema)
def generate_mcqs(request: MCQRequestSchema, db: Session = Depends(get_db)):
    try:
        return generate_mcq_set(request, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MCQ generation failed: {str(e)}")

@router.post("/mcq/topic", response_model=MCQResponseSchema)
def generate_mcqs_topic(request: MCQRequestSchema, db: Session = Depends(get_db)):
    # Intended to be broader, could tweak prompt in future
    try:
        return generate_mcq_set(request, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MCQ generation failed: {str(e)}")

@router.post("/mcq/document", response_model=MCQResponseSchema)
def generate_mcqs_document(request: MCQRequestSchema, db: Session = Depends(get_db)):
    # Generates across entire document
    try:
        return generate_mcq_set(request, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MCQ generation failed: {str(e)}")

@router.post("/mcq/quiz", response_model=MCQResponseSchema)
def generate_mcqs_quiz(request: MCQRequestSchema, db: Session = Depends(get_db)):
    # Sets EXAM_PREP_MODE automatically
    request.exam_prep_mode = True
    try:
        return generate_mcq_set(request, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MCQ generation failed: {str(e)}")
