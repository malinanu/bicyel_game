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
    entries = relationship("Entry", back_populates="user", cascade="all, delete-orphan", foreign_keys="[Entry.user_id]")
    reviewed_entries = relationship("Entry", back_populates="reviewer", foreign_keys="[Entry.reviewed_by]")
    winners = relationship("Winner", back_populates="user")
