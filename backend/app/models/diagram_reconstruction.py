import uuid
from sqlalchemy import Column, String, JSON, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from app.database.connection import Base

class ReconstructedDiagram(Base):
    __tablename__ = "reconstructed_diagrams"

    diagram_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("uploaded_documents.id"), nullable=True)
    topic = Column(String, nullable=False)
    diagram_type = Column(String, nullable=False) # ARCHITECTURE, FLOWCHART, etc.
    nodes = Column(JSON, nullable=False) # List of strings
    edges = Column(JSON, nullable=False) # List of [source, target] pairs
    source_pages = Column(JSON, nullable=True) # List of ints
    created_at = Column(DateTime(timezone=True), server_default=func.now())
