from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Entry(Base):
    __tablename__ = "entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(Text, nullable=False)
    image_hash = Column(String(64), nullable=False, index=True)
    hash_ahash = Column(String(64), nullable=True, index=True)
    hash_dhash = Column(String(64), nullable=True, index=True)
    hash_whash = Column(String(64), nullable=True, index=True)
    image_size = Column(Integer, nullable=False)
    verified = Column(Boolean, default=False, index=True)
    admin_notes = Column(Text, nullable=True)
    fraud_score = Column(Float, default=0.0, nullable=False, index=True)
    fraud_reason = Column(Text, nullable=True)
    similar_entry_ids = Column(Text, nullable=True)
    review_status = Column(String(20), default='pending', nullable=False, index=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    code_id = Column(Integer, ForeignKey("codes.id"), nullable=True)  # Nullable to handle existing entries
    code_entered_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="entries", foreign_keys=[user_id])
    reviewer = relationship("User", back_populates="reviewed_entries", foreign_keys=[reviewed_by])
    code = relationship("Code", back_populates="entries")
    winner = relationship("Winner", back_populates="entry", uselist=False)
