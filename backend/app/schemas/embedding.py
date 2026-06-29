from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class DocumentEmbeddingSchema(BaseModel):
    id: UUID
    chunk_id: UUID
    document_id: UUID
    embedding_type: str
    embedding_model: str
    vector_dimension: int
    created_at: datetime
    # We do NOT include embedding_vector here by default to prevent massive payloads.
    
    model_config = ConfigDict(from_attributes=True)

class DiagramEmbeddingSchema(BaseModel):
    id: UUID
    diagram_id: UUID
    document_id: UUID
    topic: Optional[str]
    embedding_model: str
    vector_dimension: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class EmbeddingWithVectorSchema(DocumentEmbeddingSchema):
    embedding_vector: List[float]

class DiagramEmbeddingWithVectorSchema(DiagramEmbeddingSchema):
    embedding_vector: List[float]
