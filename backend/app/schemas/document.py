from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID

class DocumentResponse(BaseModel):
    id: UUID
    original_filename: str
    file_type: str
    file_size: int
    upload_timestamp: datetime
    processing_status: str

    model_config = ConfigDict(from_attributes=True)
