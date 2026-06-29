import logging
import uuid
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.models.document import UploadedDocument
from app.models.extraction import DocumentImage, DocumentDiagram, DocumentHeading
from app.services.diagram_engine.vision_analyzer import is_diagram
from app.services.diagram_engine.diagram_ocr import extract_diagram_text
from app.services.diagram_engine.topic_associator import associate_topic_and_title
from app.services.diagram_engine.embeddings import generate_embedding, index_manager

logging.basicConfig(filename="logs/diagram_engine.log", level=logging.INFO, 
                    format="%(asctime)s - %(levelname)s - %(message)s")

def process_document_diagrams_task(document_id: uuid.UUID):
    """
    Background task to process all images in a document, classify true diagrams,
    extract text, generate embeddings, and index them.
    """
    logging.info(f"Diagram Processing Start: {document_id}")
    db: Session = SessionLocal()
    
    try:
        document = db.query(UploadedDocument).filter(UploadedDocument.id == document_id).first()
        if not document:
            logging.error(f"Document {document_id} not found.")
            return

        # Change status
        document.processing_status = "DIAGRAM_ANALYZING"
        db.commit()
        
        images = db.query(DocumentImage).filter(DocumentImage.document_id == document_id).all()
        diagrams_existing = db.query(DocumentDiagram).filter(DocumentDiagram.document_id == document_id).all()
        
        # We also process existing DocumentDiagrams from Phase 2 (since they were heuristically classified)
        all_potential_diagrams = [(img.image_path, img.page_number, img) for img in images]
        
        # Plus any already marked diagrams
        for diag in diagrams_existing:
            all_potential_diagrams.append((diag.image_path, diag.page_number, diag))

        for img_path, page_num, record in all_potential_diagrams:
            # Step 1: Vision Classification (only if it wasn't already classified as a diagram in Phase 2)
            is_valid_diagram = True
            if isinstance(record, DocumentImage):
                is_valid_diagram = is_diagram(img_path)
                
            if not is_valid_diagram:
                db.delete(record)
                db.flush()
                continue # Skip normal images
                
            document.processing_status = "DIAGRAM_CLASSIFIED"
            db.commit()

            # Step 2: OCR Extraction
            ocr_text = extract_diagram_text(img_path)
            
            # Step 3: Topic Association
            page_headings = db.query(DocumentHeading).filter(
                DocumentHeading.document_id == document_id,
                DocumentHeading.page_number == page_num
            ).order_by(DocumentHeading.level).all()
            heading_texts = [h.text for h in page_headings]
            
            topic, title, keywords = associate_topic_and_title(ocr_text, heading_texts)
            
            # Step 4: Embedding Generation
            combined_text = f"{title}. {topic}. {ocr_text} " + " ".join(keywords)
            embedding = generate_embedding(combined_text)
            
            # Step 5: Save/Update Database
            if isinstance(record, DocumentImage):
                # Promote to Diagram
                new_diagram = DocumentDiagram(
                    document_id=document.id,
                    page_number=page_num,
                    title=title,
                    topic=topic,
                    diagram_type="UNKNOWN", # Default since we didn't use Vision LLM
                    image_path=img_path,
                    keywords=keywords,
                    ocr_text=ocr_text,
                    embedding_created=True,
                    ready_for_retrieval=True
                )
                db.add(new_diagram)
                db.delete(record) # Remove from standard images
                db.flush()
                diag_id = new_diagram.id
            else:
                # Update existing diagram
                record.topic = topic
                record.title = title if not record.title else record.title
                record.keywords = keywords
                record.ocr_text = ocr_text
                record.embedding_created = True
                record.ready_for_retrieval = True
                db.add(record)
                db.flush()
                diag_id = record.id

            # Step 6: Add to FAISS
            index_manager.add_diagram(str(diag_id), embedding)
            
        document.processing_status = "DIAGRAM_INDEXED"
        db.commit()
        logging.info(f"Diagram Processing Success: {document_id}")
        
    except Exception as e:
        db.rollback()
        logging.error(f"Diagram Processing Failure: {document_id} - Error: {str(e)}")
        if document:
            document.processing_status = "FAILED"
            db.commit()
    finally:
        db.close()
