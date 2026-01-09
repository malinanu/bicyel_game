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
