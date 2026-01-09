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
