from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    name: str
    phone_number: str

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    phone_verified_at: Optional[datetime]
    last_login_at: Optional[datetime]
    is_active: bool
    created_at: datetime
    entry_count: int = 0

    class Config:
        from_attributes = True
