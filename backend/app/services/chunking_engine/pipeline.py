import logging
import uuid
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.models.document import UploadedDocument
from app.models.extraction import DocumentPage, DocumentHeading, DocumentTable, DocumentDiagram, OcrResult
from app.models.chunking import DocumentChunk

from app.services.chunking_engine.cleaner import clean_text
from app.services.chunking_engine.classifier import classify_chunk
from app.services.chunking_engine.segmenter import segment_text
from app.services.chunking_engine.linker import link_diagrams_to_chunk

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("logs/chunking.log"),
        logging.StreamHandler(),
    ],
)

def process_document_chunks_task(document_id: uuid.UUID):
    logging.info(f"Chunking Start: {document_id}")
    db: Session = SessionLocal()
    
    try:
        document = db.query(UploadedDocument).filter(UploadedDocument.id == document_id).first()
        if not document:
            logging.error(f"Document {document_id} not found.")
            return

        document.processing_status = "CHUNKING"
        db.commit()
        
        pages = db.query(DocumentPage).filter(DocumentPage.document_id == document_id).order_by(DocumentPage.page_number).all()
        diagrams = db.query(DocumentDiagram).filter(DocumentDiagram.document_id == document_id).all()
        tables = db.query(DocumentTable).filter(DocumentTable.document_id == document_id).all()
        headings = db.query(DocumentHeading).filter(DocumentHeading.document_id == document_id).order_by(DocumentHeading.page_number, DocumentHeading.level).all()
        ocr_results = db.query(OcrResult).filter(OcrResult.document_id == document_id).all()
        
        ocr_by_page = {}
        for ocr in ocr_results:
            if ocr.page_number not in ocr_by_page:
                ocr_by_page[ocr.page_number] = []
            if ocr.text:
                ocr_by_page[ocr.page_number].append(ocr.text)
        
        chunk_index = 1
        
        # 1. Process Text Pages
        # Group text by headings or process page by page. For simplicity, we concatenate with tracking.
        for page in pages:
            raw_text = page.text_content or ""
            if page.page_number in ocr_by_page:
                raw_text += "\n" + "\n".join(ocr_by_page[page.page_number])
                
            cleaned_text = clean_text(raw_text)
            if not cleaned_text or len(cleaned_text.strip()) < 100:
                continue
                
            # Determine heading for this page (naive approach: take last heading on this page or previous)
            page_headings = [h for h in headings if h.page_number <= page.page_number]
            current_heading = page_headings[-1].text if page_headings else "General Content"
            current_topic = page_headings[0].text if page_headings else "Unknown Topic"

            # Segment text into overlapping chunks
            raw_chunks = segment_text(cleaned_text)
            
            for rc in raw_chunks:
                chunk_type = classify_chunk(rc["content"])
                diagram_ids = link_diagrams_to_chunk(rc["content"], [page.page_number], diagrams)
                
                new_chunk = DocumentChunk(
                    document_id=document.id,
                    chunk_index=chunk_index,
                    topic=current_topic,
                    heading=current_heading,
                    content=rc["content"],
                    chunk_type=chunk_type,
                    page_numbers=[page.page_number],
                    diagram_ids=diagram_ids,
                    token_count=rc["token_count"]
                )
                db.add(new_chunk)
                chunk_index += 1
                
        # 2. Process Tables as Separate Chunks
        for table in tables:
            # Reconstruct table to text
            if not table.headers and not table.rows:
                continue
            table_text = f"Headers: {table.headers}\nRows: {table.rows}"
            
            page_headings = [h for h in headings if h.page_number <= table.page_number]
            current_heading = page_headings[-1].text if page_headings else "General Content"
            current_topic = page_headings[0].text if page_headings else "Unknown Topic"

            diagram_ids = link_diagrams_to_chunk(table_text, [table.page_number], diagrams)
            
            # Simple token count estimation for tables (roughly 1 token per word/number)
            token_count = len(str(table_text).split())
            
            new_chunk = DocumentChunk(
                document_id=document.id,
                chunk_index=chunk_index,
                topic=current_topic,
                heading=current_heading,
                content=table_text,
                chunk_type="TABLE",
                page_numbers=[table.page_number],
                diagram_ids=diagram_ids,
                token_count=token_count
            )
            db.add(new_chunk)
            chunk_index += 1

        document.processing_status = "READY_FOR_EMBEDDING"
        db.commit()
        logging.info(f"Chunking Success: {document_id}")
        
    except Exception as e:
        db.rollback()
        logging.error(f"Chunking Failure: {document_id} - Error: {str(e)}")
        if document:
            document.processing_status = "FAILED"
            db.commit()
    finally:
        db.close()
