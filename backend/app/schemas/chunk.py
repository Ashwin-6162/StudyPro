from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class ChunkSchema(BaseModel):
    chunk_id: UUID
    document_id: UUID
    chunk_index: int
    topic: Optional[str]
    heading: Optional[str]
    subheading: Optional[str]
    content: str
    chunk_type: str
    page_numbers: List[int]
    diagram_ids: Optional[List[str]]
    token_count: int
    created_at: datetime
    ready_for_embedding: bool = True # Meta field to indicate completion

    model_config = ConfigDict(from_attributes=True)
