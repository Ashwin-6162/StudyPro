import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Text, JSON, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.connection import Base

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("uploaded_documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    topic = Column(String, nullable=True)
    heading = Column(String, nullable=True)
    subheading = Column(String, nullable=True)
    content = Column(Text, nullable=False)
    chunk_type = Column(String, nullable=False, default="NORMAL_CONTENT")
    page_numbers = Column(JSON, nullable=False) # list of page integers
    diagram_ids = Column(JSON, nullable=True)   # list of associated diagram UUIDs
    token_count = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("UploadedDocument", backref="chunks")
