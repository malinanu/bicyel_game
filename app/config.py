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

    # Cloudflare R2 (optional for development)
    R2_ACCOUNT_ID: Optional[str] = None
    R2_ACCESS_KEY_ID: Optional[str] = None
    R2_SECRET_ACCESS_KEY: Optional[str] = None
    R2_BUCKET_NAME: Optional[str] = None
    R2_ENDPOINT_URL: Optional[str] = None
    R2_PUBLIC_URL: Optional[str] = None

    # Text.lk (optional for development)
    TEXTLK_API_KEY: Optional[str] = None
    TEXTLK_SENDER_ID: str = "Milo"
    TEXTLK_API_URL: str = "https://app.text.lk/api/v3/sms/send"

    # Mock services for development (auto-enables if credentials missing)
    USE_MOCK_SERVICES: bool = True

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
