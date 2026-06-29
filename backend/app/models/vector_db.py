from sqlalchemy import Column, String, Integer, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.database.connection import Base

class VectorIndexMapping(Base):
    """
    Maps the 64-bit integer ID stored in FAISS (faiss_id) 
    back to the embedding_id UUID in the database.
    """
    __tablename__ = "vector_index_mapping"

    # faiss_id acts as the primary key. It's the exact integer we pass to IndexIDMap in FAISS.
    faiss_id = Column(Integer, primary_key=True, autoincrement=True)
    
    embedding_id = Column(UUID(as_uuid=True), nullable=False, unique=True)
    document_id = Column(UUID(as_uuid=True), nullable=False)
    
    # E.g., 'chunk_index' or 'diagram_index'
    index_name = Column(String, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
