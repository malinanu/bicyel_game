# Milo Bicycle Campaign System - Python/PostgreSQL Backend

## Project Overview

A promotional campaign system for Milo's 3M RTD pack sale with 1000 bicycle giveaway. Built with Python FastAPI, PostgreSQL, and Cloudflare R2 storage.

---

## Tech Stack

- **Backend Framework**: FastAPI 0.104+
- **Database**: PostgreSQL 15+
- **ORM**: SQLAlchemy 2.0+
- **Authentication**: JWT with OTP verification
- **Storage**: Cloudflare R2 (S3-compatible)
- **SMS Gateway**: Text.lk API
- **Image Processing**: Pillow + ImageHash
- **Task Queue**: Celery with Redis (optional)

---

## Project Structure

```
milo-campaign/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── otp.py
│   │   ├── entry.py
│   │   └── winner.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── entry.py
│   │   └── user.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── otp_service.py
│   │   ├── image_service.py
│   │   └── auth_service.py
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── entries.py
│   │   └── admin.py
│   └── utils/
│       ├── __init__.py
│       ├── security.py
│       └── dependencies.py
├── alembic/
│   ├── versions/
│   └── env.py
├── tests/
├── requirements.txt
├── .env.example
├── alembic.ini
└── README.md
```

---

## Installation & Setup

### 1. System Requirements

```bash
# Install Python 3.11+
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip postgresql postgresql-contrib redis-server

# Install PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Virtual Environment

```bash
# Create project directory
mkdir milo-campaign
cd milo-campaign

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Upgrade pip
pip install --upgrade pip
```

### 3. Install Dependencies

Create `requirements.txt`:

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
alembic==1.12.1
python-dotenv==1.0.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
Pillow==10.1.0
ImageHash==4.3.1
boto3==1.29.7
requests==2.31.0
pydantic==2.5.0
pydantic-settings==2.1.0
redis==5.0.1
celery==5.3.4
```

```bash
pip install -r requirements.txt
```

---

## Environment Configuration

### .env File

```env
# Application
APP_NAME=Milo Campaign
APP_ENV=development
DEBUG=True
API_HOST=0.0.0.0
API_PORT=8000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/milo_campaign
DATABASE_ECHO=False

# JWT
JWT_SECRET_KEY=your-super-secret-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=milo-campaign-images
R2_ENDPOINT_URL=https://your_account_id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://your-public-domain.com

# Text.lk SMS API
TEXTLK_API_KEY=your_textlk_api_key
TEXTLK_SENDER_ID=Milo
TEXTLK_API_URL=https://app.text.lk/api/v3/sms/send

# Campaign Settings
MAX_ENTRIES_PER_USER=10
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=3
MAX_IMAGE_SIZE_MB=5
TOTAL_BICYCLES=1000

# Redis (optional - for Celery)
REDIS_URL=redis://localhost:6379/0
```

---

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Access PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE milo_campaign;
CREATE USER milo_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE milo_campaign TO milo_user;

# Exit
\q
```

### 2. Database Configuration (app/database.py)

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Create engine
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DATABASE_ECHO,
    pool_size=20,
    max_overflow=0,
    pool_pre_ping=True
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## Configuration (app/config.py)

```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Milo Campaign"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    # Database
    DATABASE_URL: str
    DATABASE_ECHO: bool = False
    
    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    
    # Cloudflare R2
    R2_ACCOUNT_ID: str
    R2_ACCESS_KEY_ID: str
    R2_SECRET_ACCESS_KEY: str
    R2_BUCKET_NAME: str
    R2_ENDPOINT_URL: str
    R2_PUBLIC_URL: str
    
    # Text.lk
    TEXTLK_API_KEY: str
    TEXTLK_SENDER_ID: str = "Milo"
    TEXTLK_API_URL: str = "https://app.text.lk/api/v3/sms/send"
    
    # Campaign
    MAX_ENTRIES_PER_USER: int = 10
    OTP_EXPIRY_MINUTES: int = 5
    OTP_MAX_ATTEMPTS: int = 3
    MAX_IMAGE_SIZE_MB: int = 5
    TOTAL_BICYCLES: int = 1000
    
    # Redis
    REDIS_URL: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

---

## Database Models

### 1. User Model (app/models/user.py)

```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone_number = Column(String(15), unique=True, nullable=False, index=True)
    phone_verified_at = Column(DateTime(timezone=True), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    entries = relationship("Entry", back_populates="user", cascade="all, delete-orphan")
    winners = relationship("Winner", back_populates="user")
```

### 2. OTP Model (app/models/otp.py)

```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base

class OtpVerification(Base):
    __tablename__ = "otp_verifications"
    
    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(15), nullable=False, index=True)
    otp_code = Column(String(6), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    verified = Column(Boolean, default=False)
    attempts = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

### 3. Entry Model (app/models/entry.py)

```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Entry(Base):
    __tablename__ = "entries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(Text, nullable=False)
    image_hash = Column(String(64), unique=True, nullable=False, index=True)
    image_size = Column(Integer, nullable=False)
    verified = Column(Boolean, default=False, index=True)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="entries")
    winner = relationship("Winner", back_populates="entry", uselist=False)
```

### 4. Winner Model (app/models/winner.py)

```python
from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Winner(Base):
    __tablename__ = "winners"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    entry_id = Column(Integer, ForeignKey("entries.id"), nullable=False, index=True)
    bicycle_number = Column(Integer, nullable=False, index=True)
    drawn_at = Column(DateTime(timezone=True), server_default=func.now())
    notified = Column(Boolean, default=False)
    claimed = Column(Boolean, default=False)
    claimed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="winners")
    entry = relationship("Entry", back_populates="winner")
```

### Models __init__.py (app/models/__init__.py)

```python
from app.models.user import User
from app.models.otp import OtpVerification
from app.models.entry import Entry
from app.models.winner import Winner

__all__ = ["User", "OtpVerification", "Entry", "Winner"]
```

---

## Pydantic Schemas

### 1. Auth Schemas (app/schemas/auth.py)

```python
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
```

### 2. User Schemas (app/schemas/user.py)

```python
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
    
    class Config:
        from_attributes = True
```

### 3. Entry Schemas (app/schemas/entry.py)

```python
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
```

---

## Services

### 1. OTP Service (app/services/otp_service.py)

```python
import requests
import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.otp import OtpVerification
from app.config import settings
import re

class OtpService:
    def __init__(self, db: Session):
        self.db = db
    
    @staticmethod
    def is_valid_sri_lankan_number(phone: str) -> bool:
        """Validate Sri Lankan phone number format"""
        cleaned = re.sub(r'[^0-9]', '', phone)
        return bool(re.match(r'^(94|0)?7[0-9]{8}$', cleaned))
    
    @staticmethod
    def clean_phone_number(phone: str) -> str:
        """Clean and format phone number"""
        cleaned = re.sub(r'[^0-9]', '', phone)
        # Ensure it starts with 94
        if cleaned.startswith('0'):
            cleaned = '94' + cleaned[1:]
        elif not cleaned.startswith('94'):
            cleaned = '94' + cleaned
        return cleaned
    
    def generate_otp(self) -> str:
        """Generate 6-digit OTP"""
        return str(secrets.randbelow(1000000)).zfill(6)
    
    def send_otp(self, phone_number: str) -> dict:
        """Send OTP via Text.lk"""
        # Validate phone number
        if not self.is_valid_sri_lankan_number(phone_number):
            return {
                "success": False,
                "message": "Invalid phone number format"
            }
        
        # Clean phone number
        phone_number = self.clean_phone_number(phone_number)
        
        # Generate OTP
        otp_code = self.generate_otp()
        
        # Store in database
        expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
        
        otp_record = OtpVerification(
            phone_number=phone_number,
            otp_code=otp_code,
            expires_at=expires_at,
            verified=False,
            attempts=0
        )
        self.db.add(otp_record)
        self.db.commit()
        
        # Send SMS
        message = f"Your Milo Campaign verification code is: {otp_code}. Valid for {settings.OTP_EXPIRY_MINUTES} minutes."
        
        try:
            response = requests.post(
                settings.TEXTLK_API_URL,
                headers={
                    'Authorization': f'Bearer {settings.TEXTLK_API_KEY}',
                    'Content-Type': 'application/json'
                },
                json={
                    'recipient': phone_number,
                    'sender_id': settings.TEXTLK_SENDER_ID,
                    'message': message
                },
                timeout=10
            )
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "message": "OTP sent successfully",
                    "expires_in": settings.OTP_EXPIRY_MINUTES
                }
            else:
                return {
                    "success": False,
                    "message": f"Failed to send OTP: {response.text}"
                }
        except Exception as e:
            return {
                "success": False,
                "message": f"Failed to send OTP: {str(e)}"
            }
    
    def verify_otp(self, phone_number: str, otp_code: str) -> dict:
        """Verify OTP code"""
        phone_number = self.clean_phone_number(phone_number)
        
        # Find the most recent OTP
        otp_record = self.db.query(OtpVerification).filter(
            OtpVerification.phone_number == phone_number,
            OtpVerification.verified == False,
            OtpVerification.expires_at > datetime.utcnow()
        ).order_by(OtpVerification.created_at.desc()).first()
        
        if not otp_record:
            return {
                "success": False,
                "message": "OTP expired or not found"
            }
        
        # Check max attempts
        if otp_record.attempts >= settings.OTP_MAX_ATTEMPTS:
            return {
                "success": False,
                "message": "Maximum verification attempts exceeded"
            }
        
        # Increment attempts
        otp_record.attempts += 1
        self.db.commit()
        
        # Verify OTP
        if otp_record.otp_code != otp_code:
            return {
                "success": False,
                "message": "Invalid OTP code",
                "attempts_left": settings.OTP_MAX_ATTEMPTS - otp_record.attempts
            }
        
        # Mark as verified
        otp_record.verified = True
        self.db.commit()
        
        return {
            "success": True,
            "message": "OTP verified successfully"
        }
    
    def cleanup_expired_otps(self) -> int:
        """Delete expired OTPs (run periodically)"""
        cutoff = datetime.utcnow() - timedelta(hours=24)
        deleted = self.db.query(OtpVerification).filter(
            OtpVerification.expires_at < cutoff
        ).delete()
        self.db.commit()
        return deleted
```

### 2. Image Service (app/services/image_service.py)

```python
import boto3
from PIL import Image
from imagehash import phash
from io import BytesIO
from typing import Optional, Tuple
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.models.entry import Entry
from app.config import settings
import uuid

class ImageService:
    def __init__(self, db: Session):
        self.db = db
        self.s3_client = boto3.client(
            's3',
            endpoint_url=settings.R2_ENDPOINT_URL,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name='auto'
        )
    
    def calculate_image_hash(self, image_data: bytes) -> str:
        """Calculate perceptual hash of image"""
        image = Image.open(BytesIO(image_data))
        return str(phash(image))
    
    def optimize_image(self, image_data: bytes) -> Tuple[bytes, int]:
        """Optimize and resize image"""
        image = Image.open(BytesIO(image_data))
        
        # Convert to RGB if needed
        if image.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
        
        # Resize maintaining aspect ratio
        image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
        
        # Save optimized image
        output = BytesIO()
        image.save(output, format='JPEG', quality=85, optimize=True)
        optimized_data = output.getvalue()
        
        return optimized_data, len(optimized_data)
    
    def is_duplicate(self, image_hash: str) -> bool:
        """Check if image hash exists"""
        return self.db.query(Entry).filter(
            Entry.image_hash == image_hash
        ).first() is not None
    
    async def upload_image(
        self, 
        file: UploadFile, 
        user_id: int
    ) -> dict:
        """Upload and process image"""
        try:
            # Read file data
            image_data = await file.read()
            
            # Check file size
            size_mb = len(image_data) / (1024 * 1024)
            if size_mb > settings.MAX_IMAGE_SIZE_MB:
                return {
                    "success": False,
                    "message": f"Image size exceeds {settings.MAX_IMAGE_SIZE_MB}MB limit"
                }
            
            # Validate image type
            if file.content_type not in ['image/jpeg', 'image/jpg', 'image/png']:
                return {
                    "success": False,
                    "message": "Only JPEG and PNG images are allowed"
                }
            
            # Calculate image hash
            image_hash = self.calculate_image_hash(image_data)
            
            # Check for duplicates
            if self.is_duplicate(image_hash):
                return {
                    "success": False,
                    "message": "This image has already been uploaded by another user",
                    "is_duplicate": True
                }
            
            # Optimize image
            optimized_data, optimized_size = self.optimize_image(image_data)
            
            # Generate unique filename
            filename = f"entries/{user_id}/{uuid.uuid4()}.jpg"
            
            # Upload to R2
            self.s3_client.put_object(
                Bucket=settings.R2_BUCKET_NAME,
                Key=filename,
                Body=optimized_data,
                ContentType='image/jpeg'
            )
            
            # Generate public URL
            image_url = f"{settings.R2_PUBLIC_URL}/{filename}"
            
            return {
                "success": True,
                "image_url": image_url,
                "image_hash": image_hash,
                "filename": filename,
                "size": optimized_size
            }
        
        except Exception as e:
            return {
                "success": False,
                "message": f"Upload failed: {str(e)}"
            }
    
    def delete_image(self, filename: str) -> bool:
        """Delete image from R2"""
        try:
            self.s3_client.delete_object(
                Bucket=settings.R2_BUCKET_NAME,
                Key=filename
            )
            return True
        except Exception:
            return False
    
    async def check_duplicate(self, file: UploadFile) -> bool:
        """Check if uploaded file is duplicate"""
        try:
            image_data = await file.read()
            await file.seek(0)  # Reset file pointer
            image_hash = self.calculate_image_hash(image_data)
            return self.is_duplicate(image_hash)
        except Exception:
            return False
```

### 3. Auth Service (app/services/auth_service.py)

```python
from datetime import datetime, timedelta
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.models.user import User
from app.config import settings

class AuthService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_access_token(self, user_id: int) -> str:
        """Create JWT access token"""
        expire = datetime.utcnow() + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )
        to_encode = {
            "sub": str(user_id),
            "exp": expire
        }
        encoded_jwt = jwt.encode(
            to_encode, 
            settings.JWT_SECRET_KEY, 
            algorithm=settings.JWT_ALGORITHM
        )
        return encoded_jwt
    
    def verify_token(self, token: str) -> int:
        """Verify JWT token and return user_id"""
        try:
            payload = jwt.decode(
                token, 
                settings.JWT_SECRET_KEY, 
                algorithms=[settings.JWT_ALGORITHM]
            )
            user_id: str = payload.get("sub")
            if user_id is None:
                return None
            return int(user_id)
        except JWTError:
            return None
    
    def get_or_create_user(self, name: str, phone_number: str) -> User:
        """Get existing user or create new one"""
        user = self.db.query(User).filter(
            User.phone_number == phone_number
        ).first()
        
        if not user:
            user = User(
                name=name,
                phone_number=phone_number,
                phone_verified_at=datetime.utcnow()
            )
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
        
        # Update last login
        user.last_login_at = datetime.utcnow()
        self.db.commit()
        
        return user
```

---

## API Routes

### 1. Auth Routes (app/routers/auth.py)

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import OtpRequest, OtpVerify, Token
from app.schemas.user import UserResponse
from app.services.otp_service import OtpService
from app.services.auth_service import AuthService
from app.utils.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/request-otp")
async def request_otp(
    request: OtpRequest,
    db: Session = Depends(get_db)
):
    """Request OTP for login"""
    otp_service = OtpService(db)
    result = otp_service.send_otp(request.phone_number)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    
    return result

@router.post("/verify-otp", response_model=dict)
async def verify_otp(
    request: OtpVerify,
    db: Session = Depends(get_db)
):
    """Verify OTP and login"""
    otp_service = OtpService(db)
    auth_service = AuthService(db)
    
    # Verify OTP
    result = otp_service.verify_otp(request.phone_number, request.otp_code)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    
    # Get or create user
    # Note: Name should be stored in session from request-otp
    # For simplicity, using phone as name if not provided
    user = auth_service.get_or_create_user(
        name="User",  # Should come from session
        phone_number=request.phone_number
    )
    
    # Create access token
    access_token = auth_service.create_access_token(user.id)
    
    return {
        "success": True,
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout (client-side token removal)"""
    return {
        "success": True,
        "message": "Logged out successfully"
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user
```

### 2. Entry Routes (app/routers/entries.py)

```python
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.entry import EntryResponse, EntryListResponse, DuplicateCheckResponse
from app.services.image_service import ImageService
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.models.entry import Entry
from app.config import settings

router = APIRouter(prefix="/entries", tags=["Entries"])

@router.post("", response_model=dict)
async def create_entry(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new entry with image upload"""
    image_service = ImageService(db)
    
    # Check max entries per user
    entry_count = db.query(Entry).filter(
        Entry.user_id == current_user.id
    ).count()
    
    if entry_count >= settings.MAX_ENTRIES_PER_USER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You have reached the maximum limit of {settings.MAX_ENTRIES_PER_USER} entries"
        )
    
    # Upload image
    result = await image_service.upload_image(image, current_user.id)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    
    # Create entry
    entry = Entry(
        user_id=current_user.id,
        image_url=result["image_url"],
        image_hash=result["image_hash"],
        image_size=result["size"],
        verified=False
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    
    return {
        "success": True,
        "message": "Entry submitted successfully",
        "entry": EntryResponse.from_orm(entry),
        "entries_remaining": settings.MAX_ENTRIES_PER_USER - (entry_count + 1)
    }

@router.get("", response_model=EntryListResponse)
async def get_entries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's entries"""
    entries = db.query(Entry).filter(
        Entry.user_id == current_user.id
    ).order_by(Entry.created_at.desc()).all()
    
    return EntryListResponse(
        success=True,
        entries=[EntryResponse.from_orm(e) for e in entries],
        total_entries=len(entries),
        entries_remaining=settings.MAX_ENTRIES_PER_USER - len(entries)
    )

@router.post("/check-duplicate", response_model=DuplicateCheckResponse)
async def check_duplicate(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if image is duplicate before upload"""
    image_service = ImageService(db)
    is_duplicate = await image_service.check_duplicate(image)
    
    return DuplicateCheckResponse(
        is_duplicate=is_duplicate,
        message="This image has already been used" if is_duplicate else "Image is unique"
    )
```

### 3. Admin Routes (app/routers/admin.py)

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.entry import Entry
from app.models.winner import Winner
from app.config import settings
import random

router = APIRouter(prefix="/admin", tags=["Admin"])

# Note: Add proper admin authentication middleware

@router.post("/draw-winners")
async def draw_winners(db: Session = Depends(get_db)):
    """Draw random winners from verified entries"""
    # Get all verified entries that haven't won
    eligible_entries = db.query(Entry).filter(
        Entry.verified == True
    ).outerjoin(Winner).filter(Winner.id == None).all()
    
    if len(eligible_entries) < settings.TOTAL_BICYCLES:
        raise HTTPException(
            status_code=400,
            detail=f"Only {len(eligible_entries)} eligible entries available"
        )
    
    # Randomly select winners
    winning_entries = random.sample(eligible_entries, settings.TOTAL_BICYCLES)
    
    # Create winner records
    winners_created = 0
    for idx, entry in enumerate(winning_entries, 1):
        winner = Winner(
            user_id=entry.user_id,
            entry_id=entry.id,
            bicycle_number=idx,
            notified=False,
            claimed=False
        )
        db.add(winner)
        winners_created += 1
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Successfully drew {winners_created} winners",
        "total_winners": winners_created
    }

@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    """Get campaign statistics"""
    total_users = db.query(func.count(User.id)).scalar()
    total_entries = db.query(func.count(Entry.id)).scalar()
    verified_entries = db.query(func.count(Entry.id)).filter(Entry.verified == True).scalar()
    total_winners = db.query(func.count(Winner.id)).scalar()
    
    return {
        "total_users": total_users,
        "total_entries": total_entries,
        "verified_entries": verified_entries,
        "total_winners": total_winners,
        "bicycles_remaining": settings.TOTAL_BICYCLES - total_winners
    }
```

---

## Utilities

### 1. Security Utils (app/utils/security.py)

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

### 2. Dependencies (app/utils/dependencies.py)

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import AuthService
from app.models.user import User

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    auth_service = AuthService(db)
    
    user_id = auth_service.verify_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    return user
```

---

## Main Application (app/main.py)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, entries, admin
from app.config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(entries.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "Milo Campaign API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG
    )
```

---

## Database Migrations with Alembic

### 1. Initialize Alembic

```bash
alembic init alembic
```

### 2. Configure alembic.ini

```ini
sqlalchemy.url = postgresql://postgres:password@localhost:5432/milo_campaign
```

### 3. Configure env.py (alembic/env.py)

```python
from app.database import Base
from app.models import User, OtpVerification, Entry, Winner

target_metadata = Base.metadata
```

### 4. Create Initial Migration

```bash
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

---

## Running the Application

### Development Mode

```bash
# Activate virtual environment
source venv/bin/activate

# Run with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
# Using Gunicorn with Uvicorn workers
pip install gunicorn

gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --access-logfile - \
    --error-logfile -
```

---

## API Documentation

Once running, access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Testing

### Create test file (tests/test_auth.py)

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_request_otp():
    response = client.post("/api/auth/request-otp", json={
        "name": "Test User",
        "phone_number": "0771234567"
    })
    assert response.status_code == 200
    assert response.json()["success"] == True
```

Run tests:
```bash
pytest tests/ -v
```

---

## Deployment Checklist

- [ ] Set strong JWT_SECRET_KEY
- [ ] Configure PostgreSQL with proper credentials
- [ ] Set up Cloudflare R2 bucket with CORS
- [ ] Get Text.lk API credentials
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up monitoring (Sentry, DataDog)
- [ ] Configure log rotation
- [ ] Set up automated backups
- [ ] Load test the API
- [ ] Set up CI/CD pipeline

---

## Docker Deployment (Optional)

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "app.main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    env_file:
      - .env
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: milo_campaign
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

Run with Docker:
```bash
docker-compose up -d
```

---

This provides a complete Python/FastAPI backend with PostgreSQL!