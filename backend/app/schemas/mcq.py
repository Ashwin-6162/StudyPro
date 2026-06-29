import uuid
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from uuid import UUID
from app.schemas.context import CitationSchema

class MCQRequestSchema(BaseModel):
    topic: Optional[str] = None
    document_id: Optional[UUID] = None
    count: int = Field(default=10, ge=1, le=100)
    exam_prep_mode: bool = False
    provider: Optional[str] = Field("gemini", description="AI provider (gemini or grok)")

class MCQItemSchema(BaseModel):
    question_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    options: List[str] # Always 4 options
    correct_answer: str # 'A', 'B', 'C', or 'D'
    explanation: str
    difficulty: str # 'EASY', 'MEDIUM', 'HARD'
    source: Optional[CitationSchema] = None
    diagram_based: bool = False

class MCQResponseSchema(BaseModel):
    mcq_set_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topic: str
    question_count: int
    difficulty_distribution: Dict[str, int]
    questions: List[MCQItemSchema]
    citations_attached: bool = True
    exam_prep_mode: bool = False
    ready_for_display: bool = True
    provider: Optional[str] = None
    processing_time: Optional[float] = None

