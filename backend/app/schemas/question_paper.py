import uuid
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from uuid import UUID
from app.schemas.context import CitationSchema

class QuestionPaperRequestSchema(BaseModel):
    subject: str
    document_id: Optional[UUID] = None
    exam_type: str = Field("SEMESTER", description="SEMESTER, INTERNAL, MODEL, UNIT")
    total_marks: int = 100
    custom_pattern: Optional[Dict[int, int]] = None # e.g. {2: 10, 8: 5, 15: 2}
    provider: Optional[str] = Field("gemini", description="AI provider (gemini or grok)")

class QuestionSchema(BaseModel):
    question_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question_text: str
    marks: int
    difficulty: str # EASY, MEDIUM, HARD
    topic: str
    source: Optional[CitationSchema] = None

class SectionSchema(BaseModel):
    name: str # e.g., "Section A"
    instructions: str # e.g., "Answer all questions. Each carries 2 marks."
    questions: List[QuestionSchema]

class QuestionPaperResponseSchema(BaseModel):
    paper_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subject: str
    exam_type: str
    total_marks: int
    sections: List[SectionSchema]
    ready_for_export: bool = True
    provider: Optional[str] = None
    processing_time: Optional[float] = None

