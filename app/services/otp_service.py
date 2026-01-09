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
