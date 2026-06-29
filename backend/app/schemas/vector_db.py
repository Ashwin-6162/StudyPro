from pydantic import BaseModel, Field
from typing import List, Optional, Any
from uuid import UUID

class SearchRequest(BaseModel):
    query: str
    top_k: int = Field(5, ge=1, le=50)
    # Optional filters to search specific indices if needed
    index_name: Optional[str] = "chunk_index" # 'chunk_index' or 'diagram_index'

class SearchResultItem(BaseModel):
    faiss_id: int
    embedding_id: UUID
    document_id: UUID
    score: float # L2 distance (lower is better) or Cosine (higher is better) depending on metric
    metadata: dict # Includes original chunk/diagram data

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResultItem]
