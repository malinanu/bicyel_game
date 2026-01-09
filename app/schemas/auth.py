from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
import re

class OtpRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    phone_number: str = Field(..., min_length=10, max_length=15)

    @validator('phone_number')
    def validate_phone(cls, v):
        # Remove spaces and dashes
        cleaned = re.sub(r'[^0-9]', '', v)
        # Validate Sri Lankan format
        if not re.match(r'^(94|0)?7[0-9]{8}$', cleaned):
            raise ValueError('Invalid Sri Lankan phone number')
        return cleaned

class OtpVerify(BaseModel):
    phone_number: str = Field(..., min_length=10, max_length=15)
    otp_code: str = Field(..., min_length=6, max_length=6)

    @validator('otp_code')
    def validate_otp(cls, v):
        if not v.isdigit():
            raise ValueError('OTP must be numeric')
        return v

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[int] = None
