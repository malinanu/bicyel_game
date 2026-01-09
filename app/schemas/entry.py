from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class EntryBase(BaseModel):
    pass

class EntryCreate(BaseModel):
    pass  # File upload handled separately

class EntryResponse(BaseModel):
    id: int
    user_id: int
    image_url: str
    verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

class EntryListResponse(BaseModel):
    success: bool
    entries: list[EntryResponse]
    total_entries: int
    entries_remaining: int

class DuplicateCheckResponse(BaseModel):
    is_duplicate: bool
    message: str
