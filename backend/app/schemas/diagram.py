from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from uuid import UUID

class DiagramSchema(BaseModel):
    diagram_id: UUID
    document_id: UUID
    title: Optional[str]
    topic: Optional[str]
    diagram_type: Optional[str]
    page_number: Optional[int]
    keywords: Optional[List[str]]
    ocr_text: Optional[str]
    file_path: str
    embedding_created: bool
    ready_for_retrieval: bool
    retrieval_score: Optional[float]

    model_config = ConfigDict(from_attributes=True)

class DiagramSearchResponse(BaseModel):
    results: List[DiagramSchema]
