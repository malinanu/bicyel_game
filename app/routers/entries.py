from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.entry import EntryResponse, EntryListResponse, DuplicateCheckResponse
from app.services.service_factory import get_image_service
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.models.entry import Entry
from app.config import settings

router = APIRouter(prefix="/entries", tags=["Entries"])

@router.post("", response_model=dict)
async def create_entry(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new entry with image upload"""
    image_service = get_image_service(db)

    # Check max entries per user
    entry_count = db.query(Entry).filter(
        Entry.user_id == current_user.id
    ).count()

    if entry_count >= settings.MAX_ENTRIES_PER_USER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You have reached the maximum limit of {settings.MAX_ENTRIES_PER_USER} entries"
        )

    # Upload image
    result = await image_service.upload_image(image, current_user.id)

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

    # Create entry
    entry = Entry(
        user_id=current_user.id,
        image_url=result["image_url"],
        image_hash=result["image_hash"],
        image_size=result["size"],
        verified=False
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {
        "success": True,
        "message": "Entry submitted successfully",
        "entry": EntryResponse.from_orm(entry),
        "entries_remaining": settings.MAX_ENTRIES_PER_USER - (entry_count + 1)
    }

@router.get("", response_model=EntryListResponse)
async def get_entries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's entries"""
    entries = db.query(Entry).filter(
        Entry.user_id == current_user.id
    ).order_by(Entry.created_at.desc()).all()

    return EntryListResponse(
        success=True,
        entries=[EntryResponse.from_orm(e) for e in entries],
        total_entries=len(entries),
        entries_remaining=settings.MAX_ENTRIES_PER_USER - len(entries)
    )

@router.post("/check-duplicate", response_model=DuplicateCheckResponse)
async def check_duplicate(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if image is duplicate before upload"""
    image_service = get_image_service(db)
    is_duplicate = await image_service.check_duplicate(image)

    return DuplicateCheckResponse(
        is_duplicate=is_duplicate,
        message="This image has already been used" if is_duplicate else "Image is unique"
    )
