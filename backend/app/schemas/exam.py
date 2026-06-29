from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from app.schemas.context import CitationSchema

class ExamAnswerRequestSchema(BaseModel):
    query: str
    document_id: Optional[UUID] = None
    format_mode: str = "paragraph"  # 'paragraph' or 'bullet'
    provider: Optional[str] = Field("gemini", description="AI provider (gemini or grok)")
    query_mode: Optional[str] = Field("QUESTION", description="'QUESTION' or 'TOPIC' — controls prompt framing")

class ExamAnswerResponseSchema(BaseModel):
    query: str
    answer_type: str  # '8M', '15M'
    topic: str
    answer: str
    word_count: int
    diagram_used: bool
    citations: List[CitationSchema]
    exam_score_mode: bool = False
    ready_for_display: bool = True
    provider: Optional[str] = None
    processing_time: Optional[float] = None
