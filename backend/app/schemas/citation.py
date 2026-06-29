from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID

class CitationGenerateRequest(BaseModel):
    content_id: UUID
    content_type: str
    document_id: UUID
    file_name: str
    page_numbers: List[int]
    heading: Optional[str] = None
    citation_type: str = "PAGE_CITATION"

class CitationResponseSchema(BaseModel):
    citation_id: UUID
    file_name: str
    pages_formatted: str
    heading: Optional[str] = None
    citation_confidence: float = 98.4

class CitationListResponse(BaseModel):
    content_id: UUID
    citations: List[CitationResponseSchema]
    validated: bool = True
    ready_for_output: bool = True
