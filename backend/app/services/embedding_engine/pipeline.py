import logging
import uuid
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.models.document import UploadedDocument
from app.models.chunking import DocumentChunk
from app.models.extraction import DocumentDiagram
from app.models.embedding import DocumentEmbedding, DiagramEmbedding
from app.services.embedding_engine.generator import generate_embeddings_batch, DIMENSION, MODEL_NAME
from app.services.embedding_engine.validator import validate_embedding

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("logs/embedding_engine.log"),
        logging.StreamHandler(),
    ],
)

BATCH_SIZE = 32

def process_document_embeddings_task(document_id: uuid.UUID):
    logging.info(f"Embedding Generation Start: {document_id}")
    db: Session = SessionLocal()
    
    try:
        document = db.query(UploadedDocument).filter(UploadedDocument.id == document_id).first()
        if not document:
            logging.error(f"Document {document_id} not found.")
            return

        document.processing_status = "EMBEDDING_GENERATING"
        db.commit()
        
        # --- 1. Process Text Chunks in Batches ---
        chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).all()
        
        for i in range(0, len(chunks), BATCH_SIZE):
            batch_chunks = chunks[i:i+BATCH_SIZE]
            
            # Create dense semantic representation string
            # Hybrid format: combining topic, heading, and content
            batch_texts = [
                f"Topic: {c.topic}\nHeading: {c.heading}\n\n{c.content}" for c in batch_chunks
            ]
            
            batch_vectors = generate_embeddings_batch(batch_texts)
            
            for chunk, vector in zip(batch_chunks, batch_vectors):
                if validate_embedding(vector, DIMENSION):
                    new_embedding = DocumentEmbedding(
                        chunk_id=chunk.id,
                        document_id=document.id,
                        embedding_type=chunk.chunk_type,
                        embedding_model=MODEL_NAME,
                        vector_dimension=DIMENSION,
                        embedding_vector=vector
                    )
                    db.add(new_embedding)
                else:
                    logging.warning(f"Invalid embedding generated for chunk {chunk.id}")
                    
            db.commit() # Commit each batch

        # --- 2. Process Diagram Metadata ---
        diagrams = db.query(DocumentDiagram).filter(DocumentDiagram.document_id == document_id).all()
        
        for i in range(0, len(diagrams), BATCH_SIZE):
            batch_diagrams = diagrams[i:i+BATCH_SIZE]
            
            batch_texts = []
            for d in batch_diagrams:
                kw_str = ", ".join(d.keywords) if d.keywords else ""
                batch_texts.append(f"Diagram Title: {d.title}\nTopic: {d.topic}\nKeywords: {kw_str}\nOCR Content: {d.ocr_text}")
                
            batch_vectors = generate_embeddings_batch(batch_texts)
            
            for diagram, vector in zip(batch_diagrams, batch_vectors):
                if validate_embedding(vector, DIMENSION):
                    new_embedding = DiagramEmbedding(
                        diagram_id=diagram.id,
                        document_id=document.id,
                        topic=diagram.topic,
                        ocr_text=diagram.ocr_text,
                        embedding_model=MODEL_NAME,
                        vector_dimension=DIMENSION,
                        embedding_vector=vector
                    )
                    db.add(new_embedding)
                    
            db.commit()

        document.processing_status = "READY_FOR_INDEXING"
        db.commit()
        logging.info(f"Embedding Generation Success: {document_id}")
        
    except Exception as e:
        db.rollback()
        logging.error(f"Embedding Generation Failure: {document_id} - Error: {str(e)}")
        if document:
            document.processing_status = "FAILED"
            db.commit()
    finally:
        db.close()
