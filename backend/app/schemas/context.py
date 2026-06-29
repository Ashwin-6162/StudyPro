from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from uuid import UUID

class CitationSchema(BaseModel):
    file_name: str
    pages: List[int]

class DiagramContextSchema(BaseModel):
    diagram_id: UUID
    topic: Optional[str]
    title: Optional[str]
    image_path: str
    ocr_text: Optional[str]

class ContextPackageSchema(BaseModel):
    query: str
    topic: str
    answer_type: str # e.g., "15M", "8M", "MCQ", "GENERIC"
    
    # Dictionary mapping heading strings to lists of chunk content
    content_sections: Dict[str, List[str]]
    
    diagrams: List[DiagramContextSchema]
    citations: List[CitationSchema]
    
    estimated_tokens: int
    ready_for_generation: bool = True

class ContextRequestSchema(BaseModel):
    query: str
    document_id: Optional[UUID] = None # Optional: restrict to specific document
    top_k: int = 10 # Number of initial chunks to retrieve before ranking/filtering
