import os
import logging
from sqlalchemy.orm import Session
from app.schemas.citation import CitationGenerateRequest, CitationResponseSchema, CitationListResponse
from app.models.citation import SourceCitation, CitationMapping
from app.services.citation_engine.consolidator import consolidate_pages
from app.services.citation_engine.validator import validate_citation_integrity

os.makedirs("logs", exist_ok=True)

logging.basicConfig(filename="logs/source_citation_engine.log", level=logging.INFO, 
                    format="%(asctime)s - %(levelname)s - %(message)s")

def attach_and_save_citation(request: CitationGenerateRequest, db: Session) -> CitationListResponse:
    
    # 1. Integrity Check
    if not validate_citation_integrity(request.document_id, db):
        raise ValueError("Unable to verify source information for generated content.")
        
    # 2. Check if a duplicate citation already exists for this exact doc + pages
    # To keep the database clean
    pages_list = sorted(list(set(request.page_numbers)))
    existing_citation = db.query(SourceCitation).filter(
        SourceCitation.document_id == request.document_id,
        SourceCitation.page_numbers == pages_list
    ).first()
    
    if existing_citation:
        citation_id = existing_citation.citation_id
        formatted_pages = consolidate_pages(existing_citation.page_numbers)
        file_name = existing_citation.file_name
    else:
        # Create new
        new_citation = SourceCitation(
            document_id=request.document_id,
            file_name=request.file_name,
            page_numbers=pages_list,
            heading=request.heading,
            citation_type=request.citation_type
        )
        db.add(new_citation)
        db.flush() # flush to get the citation_id
        
        citation_id = new_citation.citation_id
        formatted_pages = consolidate_pages(new_citation.page_numbers)
        file_name = new_citation.file_name
        
    # 3. Create mapping linking generated content -> citation
    mapping = CitationMapping(
        content_id=request.content_id,
        citation_id=citation_id,
        content_type=request.content_type
    )
    db.add(mapping)
    db.commit()
    
    logging.info(f"Successfully attached citation {citation_id} to content {request.content_id}")
    
    # 4. Return Output
    response_item = CitationResponseSchema(
        citation_id=citation_id,
        file_name=file_name,
        pages_formatted=formatted_pages,
        heading=request.heading,
        citation_confidence=98.4 # Fixed value as per requirements
    )
    
    return CitationListResponse(
        content_id=request.content_id,
        citations=[response_item],
        validated=True,
        ready_for_output=True
    )
