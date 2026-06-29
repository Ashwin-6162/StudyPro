from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.question_paper import QuestionPaperRequestSchema, QuestionPaperResponseSchema
from app.services.question_paper_engine.generator import generate_paper

router = APIRouter()

@router.post("/question-paper/generate", response_model=QuestionPaperResponseSchema)
def generate_question_paper(request: QuestionPaperRequestSchema, db: Session = Depends(get_db)):
    try:
        return generate_paper(request, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question paper generation failed: {str(e)}")

@router.post("/question-paper/unit", response_model=QuestionPaperResponseSchema)
def generate_unit_paper(request: QuestionPaperRequestSchema, db: Session = Depends(get_db)):
    request.exam_type = "UNIT"
    try:
        return generate_paper(request, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/question-paper/question-bank", response_model=QuestionPaperResponseSchema)
def generate_question_bank(request: QuestionPaperRequestSchema, db: Session = Depends(get_db)):
    # Massive custom pattern
    request.custom_pattern = {2: 25, 8: 15, 15: 5} 
    try:
        return generate_paper(request, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
