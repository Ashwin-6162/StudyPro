from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID

class DiagramReconstructRequest(BaseModel):
    topic: str
    document_id: Optional[UUID] = None
    provider: Optional[str] = Field("gemini", description="AI provider (gemini or grok)")

class DiagramReconstructResponse(BaseModel):
    diagram_id: UUID
    topic: str
    diagram_type: str
    nodes: List[str]
    edges: List[List[str]]
    source_pages: List[int]
    diagram_generated: bool = True
    ready_for_answer_generation: bool = True
    provider: Optional[str] = None
    processing_time: Optional[float] = None
