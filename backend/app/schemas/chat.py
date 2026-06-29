from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from app.schemas.context import CitationSchema

class ChatRequestSchema(BaseModel):
    query: str
    document_id: Optional[UUID] = None
    response_length: str = Field("medium", description="short, medium, or detailed")
    provider: Optional[str] = Field("gemini", description="AI provider (gemini or grok)")

class ChatResponseSchema(BaseModel):
    query: str
    answer: str
    diagram_used: bool
    citations: List[CitationSchema]
    ready_for_display: bool = True
    provider: Optional[str] = None
    processing_time: Optional[float] = None

