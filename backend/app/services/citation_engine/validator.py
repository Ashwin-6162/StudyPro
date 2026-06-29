import logging
from sqlalchemy.orm import Session
from uuid import UUID
from app.models.document import UploadedDocument

def validate_citation_integrity(document_id: UUID, db: Session) -> bool:
    """
    Implements CITATION_INTEGRITY_MODE: 
    Checks if the source document actually exists in the database.
    """
    doc = db.query(UploadedDocument).filter(UploadedDocument.id == document_id).first()
    if not doc:
        logging.error(f"Integrity Failure: Citation references unknown document_id: {document_id}")
        return False
    return True
