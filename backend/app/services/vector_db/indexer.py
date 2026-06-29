import logging
import numpy as np
import uuid
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.models.document import UploadedDocument
from app.models.embedding import DocumentEmbedding, DiagramEmbedding
from app.models.vector_db import VectorIndexMapping
from app.services.vector_db.faiss_manager import faiss_manager

logging.basicConfig(filename="logs/vector_database.log", level=logging.INFO, 
                    format="%(asctime)s - %(levelname)s - %(message)s")

def index_document_task(document_id: uuid.UUID):
    """
    Fetches raw embeddings from Postgres for a document and pushes them into FAISS.
    Also creates mappings in VectorIndexMapping.
    """
    logging.info(f"Indexing Start: {document_id}")
    db: Session = SessionLocal()
    
    try:
        document = db.query(UploadedDocument).filter(UploadedDocument.id == document_id).first()
        if not document:
            logging.error(f"Document {document_id} not found.")
            return

        document.processing_status = "INDEXING"
        db.commit()
        
        # --- 1. Index Chunks ---
        chunk_embs = db.query(DocumentEmbedding).filter(DocumentEmbedding.document_id == document_id).all()
        if chunk_embs:
            vectors = np.array([emb.embedding_vector for emb in chunk_embs], dtype=np.float32)
            
            # Create mapping rows to get DB primary keys (which will serve as faiss_ids)
            mappings = []
            for emb in chunk_embs:
                mapping = VectorIndexMapping(
                    embedding_id=emb.id,
                    document_id=emb.document_id,
                    index_name="chunk_index"
                )
                db.add(mapping)
                mappings.append(mapping)
            
            db.flush() # Flush to generate mapping IDs
            
            faiss_ids = np.array([m.faiss_id for m in mappings], dtype=np.int64)
            faiss_manager.chunk_index.add_with_ids(vectors, faiss_ids)

        # --- 2. Index Diagrams ---
        diagram_embs = db.query(DiagramEmbedding).filter(DiagramEmbedding.document_id == document_id).all()
        if diagram_embs:
            vectors = np.array([emb.embedding_vector for emb in diagram_embs], dtype=np.float32)
            
            mappings = []
            for emb in diagram_embs:
                mapping = VectorIndexMapping(
                    embedding_id=emb.id,
                    document_id=emb.document_id,
                    index_name="diagram_index"
                )
                db.add(mapping)
                mappings.append(mapping)
            
            db.flush()
            
            faiss_ids = np.array([m.faiss_id for m in mappings], dtype=np.int64)
            faiss_manager.diagram_index.add_with_ids(vectors, faiss_ids)

        # Save indices to disk
        faiss_manager.save_indices()
        
        document.processing_status = "READY_FOR_RETRIEVAL"
        db.commit()
        logging.info(f"Indexing Success: {document_id}")
        
    except Exception as e:
        db.rollback()
        logging.error(f"Indexing Failure: {document_id} - Error: {str(e)}")
        if document:
            document.processing_status = "FAILED"
            db.commit()
    finally:
        db.close()
