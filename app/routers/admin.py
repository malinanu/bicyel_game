from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
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
