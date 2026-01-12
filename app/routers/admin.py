from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.entry import Entry
from app.models.winner import Winner
from app.config import settings
from app.utils.dependencies import get_admin_user
from typing import Optional
import random
import json

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/draw-winners")
async def draw_winners(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
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
async def get_stats(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
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

@router.get("/flagged-entries")
async def get_flagged_entries(
    skip: int = 0,
    limit: int = 50,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get entries flagged for fraud review"""
    query = db.query(Entry).join(User).filter(
        Entry.review_status.in_(['flagged', 'pending']),
        Entry.fraud_score >= 0.5
    ).order_by(Entry.fraud_score.desc(), Entry.created_at.desc())

    total = query.count()
    entries = query.offset(skip).limit(limit).all()

    enriched_entries = []
    for entry in entries:
        fraud_reason = json.loads(entry.fraud_reason) if entry.fraud_reason else {}
        similar_ids = json.loads(entry.similar_entry_ids) if entry.similar_entry_ids else []

        enriched_entries.append({
            'id': entry.id,
            'user_id': entry.user_id,
            'user_name': entry.user.name,
            'user_phone': entry.user.phone_number,
            'image_url': entry.image_url,
            'fraud_score': entry.fraud_score,
            'fraud_reason': fraud_reason,
            'similar_entry_ids': similar_ids,
            'review_status': entry.review_status,
            'created_at': entry.created_at
        })

    return {
        'success': True,
        'entries': enriched_entries,
        'total': total
    }

@router.get("/entries/{entry_id}/similar")
async def get_similar_entries(
    entry_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get entries similar to a specific entry"""
    entry = db.query(Entry).filter(Entry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    similar_ids = json.loads(entry.similar_entry_ids) if entry.similar_entry_ids else []
    similar_entries = db.query(Entry).filter(Entry.id.in_(similar_ids)).all()

    return {
        'success': True,
        'entry': {'id': entry.id, 'image_url': entry.image_url},
        'similar_entries': [
            {
                'id': e.id,
                'user_id': e.user_id,
                'user_name': e.user.name,
                'image_url': e.image_url,
                'fraud_score': e.fraud_score,
                'created_at': e.created_at
            }
            for e in similar_entries
        ]
    }

@router.post("/entries/{entry_id}/review")
async def review_entry(
    entry_id: int,
    decision: str,
    admin_notes: Optional[str] = None,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Approve or reject a flagged entry"""
    entry = db.query(Entry).filter(Entry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    if decision == 'approve':
        entry.review_status = 'approved'
        entry.verified = True
    elif decision == 'reject':
        entry.review_status = 'rejected'
        entry.verified = False
    else:
        raise HTTPException(status_code=400, detail="Invalid decision")

    entry.admin_notes = admin_notes
    entry.reviewed_by = admin.id
    entry.reviewed_at = func.now()

    db.commit()

    return {
        'success': True,
        'message': f'Entry {decision}d successfully',
        'entry_id': entry_id
    }
