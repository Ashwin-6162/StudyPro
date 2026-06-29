import uuid
from sqlalchemy import Column, String, BigInteger, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.database.connection import Base

class UploadedDocument(Base):
    __tablename__ = "uploaded_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False, unique=True)
    file_type = Column(String, nullable=False)
    file_size = Column(BigInteger, nullable=False)
    upload_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    file_path = Column(String, nullable=False)
    processing_status = Column(String, nullable=False, default="UPLOADED")
