import uuid
from sqlalchemy import Column, String, JSON, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.dialects.postgresql import UUID
from app.database.connection import Base
from sqlalchemy.sql import func

class SourceCitation(Base):
    __tablename__ = "source_citations"

    citation_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("uploaded_documents.id"), nullable=True)
    file_name = Column(String, nullable=True)
    page_numbers = Column(JSON, nullable=True) # E.g., [12, 13]
    heading = Column(String, nullable=True)
    citation_type = Column(String, nullable=False) # e.g., PAGE_CITATION, DIAGRAM_CITATION
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CitationMapping(Base):
    __tablename__ = "citation_mappings"

    mapping_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content_id = Column(UUID(as_uuid=True), nullable=False) # ID of generated answer, MCQ, etc.
    citation_id = Column(UUID(as_uuid=True), ForeignKey("source_citations.citation_id"))
    content_type = Column(String, nullable=False) # e.g., "8M_ANSWER", "MCQ"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
