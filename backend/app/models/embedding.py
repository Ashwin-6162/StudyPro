import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Text, JSON, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.connection import Base

class DocumentEmbedding(Base):
    __tablename__ = "document_embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chunk_id = Column(UUID(as_uuid=True), ForeignKey("document_chunks.id"), nullable=False)
    document_id = Column(UUID(as_uuid=True), ForeignKey("uploaded_documents.id"), nullable=False)
    embedding_type = Column(String, nullable=False) # TEXT_CHUNK, FORMULA, etc.
    embedding_model = Column(String, nullable=False, default="all-MiniLM-L6-v2")
    vector_dimension = Column(Integer, nullable=False, default=384)
    embedding_vector = Column(JSON, nullable=False) # List of floats
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    chunk = relationship("DocumentChunk", backref="embeddings")
    document = relationship("UploadedDocument")

class DiagramEmbedding(Base):
    __tablename__ = "diagram_embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    diagram_id = Column(UUID(as_uuid=True), ForeignKey("document_diagrams.id"), nullable=False)
    document_id = Column(UUID(as_uuid=True), ForeignKey("uploaded_documents.id"), nullable=False)
    topic = Column(String, nullable=True)
    ocr_text = Column(Text, nullable=True)
    embedding_model = Column(String, nullable=False, default="all-MiniLM-L6-v2")
    vector_dimension = Column(Integer, nullable=False, default=384)
    embedding_vector = Column(JSON, nullable=False) # List of floats
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    diagram = relationship("DocumentDiagram", backref="diagram_embeddings")
    document = relationship("UploadedDocument")
