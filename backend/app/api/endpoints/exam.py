from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.exam import ExamAnswerRequestSchema, ExamAnswerResponseSchema
from app.services.exam_engine.generator_8m import generate_8m_answer
from app.services.exam_engine.generator_15m import generate_15m_answer

router = APIRouter()

@router.post("/generate/8m", response_model=ExamAnswerResponseSchema)
def generate_8m(request: ExamAnswerRequestSchema, db: Session = Depends(get_db)):
    return generate_8m_answer(request, db)

@router.post("/generate/8m/topic", response_model=ExamAnswerResponseSchema)
def generate_8m_topic(request: ExamAnswerRequestSchema, db: Session = Depends(get_db)):
    # Topic-mode: ask the LLM to give a broad overview of the topic rather than
    # answering a specific exam question. Signal this via the request object so
    # the prompt builder can adapt its instructions.
    request.query_mode = "TOPIC"
    return generate_8m_answer(request, db)

@router.post("/generate/8m/question", response_model=ExamAnswerResponseSchema)
def generate_8m_question(request: ExamAnswerRequestSchema, db: Session = Depends(get_db)):
    # Question-mode: treat the query as a direct exam question and answer it precisely.
    request.query_mode = "QUESTION"
    return generate_8m_answer(request, db)

@router.post("/generate/15m", response_model=ExamAnswerResponseSchema)
def generate_15m(request: ExamAnswerRequestSchema, db: Session = Depends(get_db)):
    return generate_15m_answer(request, db)

@router.post("/generate/15m/topic", response_model=ExamAnswerResponseSchema)
def generate_15m_topic(request: ExamAnswerRequestSchema, db: Session = Depends(get_db)):
    request.query_mode = "TOPIC"
    return generate_15m_answer(request, db)

@router.post("/generate/15m/question", response_model=ExamAnswerResponseSchema)
def generate_15m_question(request: ExamAnswerRequestSchema, db: Session = Depends(get_db)):
    request.query_mode = "QUESTION"
    return generate_15m_answer(request, db)
