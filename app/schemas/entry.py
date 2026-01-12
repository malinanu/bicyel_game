from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict

class EntryBase(BaseModel):
    pass

class EntryCreate(BaseModel):
    pass  # File upload handled separately

class EntryResponse(BaseModel):
    id: int
    user_id: int
    image_url: str
    verified: bool
    fraud_score: float
    review_status: str
    created_at: datetime

    class Config:
        from_attributes = True

class EntryDetailResponse(EntryResponse):
    fraud_reason: Optional[Dict] = None
    similar_entry_ids: Optional[List[int]] = None
    admin_notes: Optional[str] = None

class EntryListResponse(BaseModel):
    success: bool
    entries: list[EntryResponse]
    total_entries: int
    entries_remaining: int

class DuplicateCheckResponse(BaseModel):
    is_duplicate: bool
    message: str
