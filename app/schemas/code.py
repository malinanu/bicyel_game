from pydantic import BaseModel, Field
from typing import Optional

class CodeValidate(BaseModel):
    code: str = Field(..., min_length=1, max_length=50, description="Unique code from Milo pack")

class CodeValidateResponse(BaseModel):
    success: bool
    message: str
    code_id: Optional[int] = None

    class Config:
        from_attributes = True
