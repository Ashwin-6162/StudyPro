import uuid
from sqlalchemy import Column, String, Integer, Float, ForeignKey, Text, JSON, DateTime, func, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database.connection import Base

# Note: In SQLite, JSONB falls back to JSON or Text depending on driver. 
# We'll use JSON for broader compatibility with SQLAlchemy default JSON.

class DocumentPage(Base):
    __tablename__ = "document_pages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("uploaded_documents.id"), nullable=False)
    page_number = Column(Integer, nullable=False)
    text_content = Column(Text, nullable=True)
    
    document = relationship("UploadedDocument", backref="pages")

class DocumentImage(Base):
    __tablename__ = "document_images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("uploaded_documents.id"), nullable=False)
    page_number = Column(Integer, nullable=True)
    image_path = Column(String, nullable=False)
    
    document = relationship("UploadedDocument", backref="images")

class DocumentDiagram(Base):
    __tablename__ = "document_diagrams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("uploaded_documents.id"), nullable=False)
    page_number = Column(Integer, nullable=True)
    title = Column(String, nullable=True)
    diagram_type = Column(String, nullable=True) # FLOWCHART, ARCHITECTURE, etc.
    image_path = Column(String, nullable=False)
    topic = Column(String, nullable=True)
    keywords = Column(JSON, nullable=True)
    ocr_text = Column(Text, nullable=True)
    retrieval_score = Column(Float, nullable=True, default=0.0)
    embedding_created = Column(Boolean, default=False)
    ready_for_retrieval = Column(Boolean, default=False)

    document = relationship("UploadedDocument", backref="diagrams")

class DocumentTable(Base):
    __tablename__ = "document_tables"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("uploaded_documents.id"), nullable=False)
    page_number = Column(Integer, nullable=True)
    headers = Column(JSON, nullable=True)
    rows = Column(JSON, nullable=True)

    document = relationship("UploadedDocument", backref="tables")

class DocumentHeading(Base):
    __tablename__ = "document_headings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("uploaded_documents.id"), nullable=False)
    page_number = Column(Integer, nullable=True)
    level = Column(Integer, nullable=False) # e.g. 1 for H1
    text = Column(String, nullable=False)

    document = relationship("UploadedDocument", backref="headings")

class OcrResult(Base):
    __tablename__ = "ocr_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("uploaded_documents.id"), nullable=False)
    page_number = Column(Integer, nullable=True)
    text = Column(Text, nullable=False)
    ocr_confidence = Column(Float, nullable=True)

    document = relationship("UploadedDocument", backref="ocr_results")
