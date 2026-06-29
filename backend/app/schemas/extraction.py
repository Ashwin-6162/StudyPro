from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Any
from uuid import UUID

class PageSchema(BaseModel):
    page_number: int
    text_content: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class ImageSchema(BaseModel):
    id: UUID
    page_number: Optional[int]
    image_path: str

    model_config = ConfigDict(from_attributes=True)

class DiagramSchema(BaseModel):
    id: UUID
    page_number: Optional[int]
    title: Optional[str]
    diagram_type: Optional[str]
    image_path: str

    model_config = ConfigDict(from_attributes=True)

class TableSchema(BaseModel):
    id: UUID
    page_number: Optional[int]
    headers: Optional[Any]
    rows: Optional[Any]

    model_config = ConfigDict(from_attributes=True)

class HeadingSchema(BaseModel):
    id: UUID
    page_number: Optional[int]
    level: int
    text: str

    model_config = ConfigDict(from_attributes=True)

class OcrResultSchema(BaseModel):
    page_number: Optional[int]
    text: str
    ocr_confidence: Optional[float]

    model_config = ConfigDict(from_attributes=True)

class ExtractionMetadataSchema(BaseModel):
    document_id: UUID
    file_name: str
    total_pages: int
    total_images: int
    total_diagrams: int
    total_tables: int

class ExtractionResultSchema(BaseModel):
    document_id: UUID
    metadata: ExtractionMetadataSchema
    pages: List[PageSchema]
    images: List[ImageSchema]
    diagrams: List[DiagramSchema]
    tables: List[TableSchema]
    headings: List[HeadingSchema]
