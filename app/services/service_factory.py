"""
Service Factory for Development and Production Modes
Returns real or mock services based on configuration
"""
import logging
from sqlalchemy.orm import Session
from app.config import settings

logger = logging.getLogger(__name__)

def _has_r2_credentials() -> bool:
    """Check if all R2 credentials are configured"""
    return all([
        settings.R2_ACCOUNT_ID,
        settings.R2_ACCESS_KEY_ID,
        settings.R2_SECRET_ACCESS_KEY,
        settings.R2_BUCKET_NAME,
        settings.R2_ENDPOINT_URL,
        settings.R2_PUBLIC_URL
    ])

def _has_sms_credentials() -> bool:
    """Check if SMS API key is configured"""
    return bool(settings.TEXTLK_API_KEY)

def get_image_service(db: Session):
    """
    Returns real or mock ImageService based on config

    Uses mock service if:
    - USE_MOCK_SERVICES is True, OR
    - R2 credentials are not configured
    """
    use_mock = settings.USE_MOCK_SERVICES or not _has_r2_credentials()

    if use_mock:
        from app.services.mock_image_service import MockImageService
        logger.info("🔧 Using mock image service (local storage)")
        return MockImageService(db)
    else:
        from app.services.image_service import ImageService
        logger.info("☁️ Using Cloudflare R2 image service")
        return ImageService(db)

def get_otp_service(db: Session):
    """
    Returns real or mock OTPService based on config

    Uses mock service if:
    - USE_MOCK_SERVICES is True, OR
    - SMS API key is not configured
    """
    use_mock = settings.USE_MOCK_SERVICES or not _has_sms_credentials()

    if use_mock:
        from app.services.mock_otp_service import MockOtpService
        logger.info("🔧 Using mock OTP service (console output)")
        return MockOtpService(db)
    else:
        from app.services.otp_service import OtpService
        logger.info("📱 Using Text.lk SMS service")
        return OtpService(db)

def get_service_mode() -> dict:
    """Get current service mode configuration"""
    r2_available = _has_r2_credentials()
    sms_available = _has_sms_credentials()

    return {
        "use_mock_services": settings.USE_MOCK_SERVICES,
        "image_service": "mock" if (settings.USE_MOCK_SERVICES or not r2_available) else "cloudflare_r2",
        "otp_service": "mock" if (settings.USE_MOCK_SERVICES or not sms_available) else "textlk_sms",
        "r2_credentials_configured": r2_available,
        "sms_credentials_configured": sms_available
    }
