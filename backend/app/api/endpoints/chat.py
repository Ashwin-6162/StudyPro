from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.chat import ChatRequestSchema, ChatResponseSchema
from app.services.chat_engine.generator import generate_chat_answer

router = APIRouter()

@router.post("/chat/answer", response_model=ChatResponseSchema)
def chat_answer(request: ChatRequestSchema, db: Session = Depends(get_db)):
    return generate_chat_answer(request, "TOPIC_EXPLANATION", db)

@router.post("/chat/explain", response_model=ChatResponseSchema)
def chat_explain(request: ChatRequestSchema, db: Session = Depends(get_db)):
    return generate_chat_answer(request, "EXPLANATION", db)

@router.post("/chat/summary", response_model=ChatResponseSchema)
def chat_summary(request: ChatRequestSchema, db: Session = Depends(get_db)):
    return generate_chat_answer(request, "SUMMARY", db)

@router.post("/chat/compare", response_model=ChatResponseSchema)
def chat_compare(request: ChatRequestSchema, db: Session = Depends(get_db)):
    return generate_chat_answer(request, "COMPARE", db)
