"""
Mock OTP Service for Development
Prints OTP codes to console instead of sending SMS
"""
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.otp import OtpVerification
from app.services.otp_service import OtpService
from app.config import settings

logger = logging.getLogger(__name__)

class MockOtpService(OtpService):
    """Mock OTP service that prints to console instead of sending SMS"""

    def __init__(self, db: Session):
        super().__init__(db)
        logger.info("🔧 MockOtpService initialized - OTP codes will print to console")

    def send_otp(self, phone_number: str) -> dict:
        """Send OTP - prints to console instead of SMS"""
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

        # Print OTP to console (instead of sending SMS)
        print("\n" + "=" * 60)
        print("🔧 DEV MODE: OTP Code Generated")
        print("=" * 60)
        print(f"Phone: {phone_number}")
        print(f"OTP Code: {otp_code}")
        print(f"Expires in: {settings.OTP_EXPIRY_MINUTES} minutes")
        print("=" * 60)
        print("Copy this OTP to verify in the app")
        print("=" * 60 + "\n")

        logger.info(f"🔧 DEV MODE: OTP for {phone_number}: {otp_code}")

        return {
            "success": True,
            "message": "OTP sent successfully (check console)",
            "expires_in": settings.OTP_EXPIRY_MINUTES,
            "dev_mode": True,
            "otp_code": otp_code  # Include in response for dev mode only
        }

    # verify_otp and cleanup_expired_otps are inherited from OtpService
    # They work the same in both dev and prod modes (database-driven)
