from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.entry import EntryResponse, EntryListResponse, DuplicateCheckResponse
from app.schemas.code import CodeValidate, CodeValidateResponse
from app.services.service_factory import get_image_service
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.models.entry import Entry
from app.models.code import Code
from app.config import settings
from datetime import datetime
import json

router = APIRouter(prefix="/entries", tags=["Entries"])

@router.post("/validate-code", response_model=CodeValidateResponse)
async def validate_code(
    request: CodeValidate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Validate unique Milo pack code before allowing image upload"""
    import logging
    logger = logging.getLogger(__name__)

    try:
        logger.info(f"[VALIDATE_CODE] User {current_user.id} validating code: {request.code}")

        # Find code in database
        code = db.query(Code).filter(Code.code == request.code).first()

        # Check if code exists
        if not code:
            logger.warning(f"[VALIDATE_CODE] Invalid code: {request.code}")
            return CodeValidateResponse(
                success=False,
                message="Invalid code. Please check and try again.",
                code_id=None
            )

        # Check if code is already used
        if code.used:
            logger.warning(f"[VALIDATE_CODE] Code already used: {request.code} by user {code.used_by_user_id}")
            return CodeValidateResponse(
                success=False,
                message="This code has already been used.",
                code_id=None
            )

        # Mark code as used by this user
        code.used = True
        code.used_by_user_id = current_user.id
        code.used_at = datetime.now()
        db.commit()

        logger.info(f"[VALIDATE_CODE] Code validated successfully: {request.code} for user {current_user.id}")

        return CodeValidateResponse(
            success=True,
            message="Code validated successfully! You can now upload your image.",
            code_id=code.id
        )

    except Exception as e:
        logger.error(f"[VALIDATE_CODE] Error: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Code validation failed: {str(e)}")

@router.post("", response_model=dict)
async def create_entry(
    image: UploadFile = File(...),
    code_id: int = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new entry with fraud detection"""
    import logging
    logger = logging.getLogger(__name__)

    try:
        logger.info(f"[CREATE_ENTRY] Starting for user {current_user.id}")
        logger.info(f"[CREATE_ENTRY] File: {image.filename}, Type: {image.content_type}")

        # Verify code belongs to current user and is used
        code = db.query(Code).filter(
            Code.id == code_id,
            Code.used == True,
            Code.used_by_user_id == current_user.id
        ).first()

        if not code:
            logger.error(f"[CREATE_ENTRY] Invalid code_id {code_id} for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or unauthorized code. Please validate your code first."
            )

        logger.info(f"[CREATE_ENTRY] Code {code.code} verified for user {current_user.id}")

        image_service = get_image_service(db)

        # Check max entries per user
        entry_count = db.query(Entry).filter(
            Entry.user_id == current_user.id
        ).count()

        logger.info(f"[CREATE_ENTRY] User has {entry_count} entries (max: {settings.MAX_ENTRIES_PER_USER})")

        if entry_count >= settings.MAX_ENTRIES_PER_USER:
            logger.warning(f"[CREATE_ENTRY] Max entries reached for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"You have reached the maximum limit of {settings.MAX_ENTRIES_PER_USER} entries"
            )

        # Read image data for fraud detection
        image_data = await image.read()
        await image.seek(0)  # Reset file pointer for later upload

        logger.info(f"[CREATE_ENTRY] Image data read: {len(image_data)} bytes")

        # FRAUD DETECTION
        logger.info(f"[CREATE_ENTRY] Running fraud detection...")
        fraud_analysis = image_service.detect_fraud(image_data, current_user.id)
        logger.info(f"[CREATE_ENTRY] Fraud score: {fraud_analysis['fraud_score']:.2f}")

        # Auto-reject if fraud score too high
        if fraud_analysis['fraud_score'] >= settings.FRAUD_AUTO_REJECT_THRESHOLD:
            logger.warning(f"[CREATE_ENTRY] Auto-reject: fraud score {fraud_analysis['fraud_score']:.2f} >= {settings.FRAUD_AUTO_REJECT_THRESHOLD}")

            # Extract fraud signals for user feedback
            fraud_reason = fraud_analysis['fraud_reason']
            signals = fraud_reason.get('signals', [])
            min_distance = fraud_reason.get('closest_match', {}).get('min_distance')

            # Build user-friendly error response with detailed fraud information
            error_detail = {
                "error_type": "fraud_detection",
                "message": "This image is too similar to a previously submitted entry.",
                "details": {
                    "fraud_score": round(fraud_analysis['fraud_score'], 2),
                    "threshold": settings.FRAUD_AUTO_REJECT_THRESHOLD,
                    "signals": signals,
                    "hamming_distance": int(min_distance) if min_distance is not None else None,
                    "recommendation": "Please upload a different photo of your product.",
                    "help_text": "To pass fraud detection, try:\n• Taking a photo from a different angle\n• Using different lighting\n• Capturing a different view of the product\n• Using a unique background"
                }
            }

            logger.info(f"[CREATE_ENTRY] Fraud rejection details: score={fraud_analysis['fraud_score']:.2f}, signals={signals}")

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_detail
            )

        # Upload image
        logger.info(f"[CREATE_ENTRY] Uploading image...")
        result = await image_service.upload_image(image, current_user.id)
        logger.info(f"[CREATE_ENTRY] Upload result: success={result.get('success')}")

        if not result["success"]:
            logger.error(f"[CREATE_ENTRY] Upload failed: {result.get('message')}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"]
            )

        # Determine review status based on fraud score
        if fraud_analysis['fraud_score'] >= settings.FRAUD_HIGH_RISK_THRESHOLD:
            review_status = 'flagged'
            verified = False
        elif fraud_analysis['fraud_score'] < 0.3:
            review_status = 'approved'
            verified = True
        else:
            review_status = 'pending'
            verified = False

        logger.info(f"[CREATE_ENTRY] Review status: {review_status}, verified: {verified}")

        # Create entry with fraud data
        entry = Entry(
            user_id=current_user.id,
            code_id=code.id,
            code_entered_at=code.used_at,
            image_url=result["image_url"],
            image_hash=fraud_analysis['hashes']['phash'],
            hash_ahash=fraud_analysis['hashes']['ahash'],
            hash_dhash=fraud_analysis['hashes']['dhash'],
            hash_whash=fraud_analysis['hashes']['whash'],
            image_size=result["size"],
            verified=verified,
            fraud_score=fraud_analysis['fraud_score'],
            fraud_reason=json.dumps(fraud_analysis['fraud_reason']),
            similar_entry_ids=json.dumps(fraud_analysis['similar_entry_ids']),
            review_status=review_status
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)

        logger.info(f"[CREATE_ENTRY] Entry created successfully: ID={entry.id}")

        response = {
            "success": True,
            "message": "Entry submitted successfully",
            "entry": EntryResponse.from_orm(entry),
            "entries_remaining": settings.MAX_ENTRIES_PER_USER - (entry_count + 1)
        }

        # Add warning for flagged entries
        if review_status == 'flagged':
            response["warning"] = "Your entry is under review due to similarity with existing images."

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[CREATE_ENTRY] Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Entry creation failed: {str(e)}")

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
    import logging
    logger = logging.getLogger(__name__)

    try:
        logger.info(f"[CHECK_DUPLICATE] Starting check for user {current_user.id}")
        logger.info(f"[CHECK_DUPLICATE] File: {image.filename}, Type: {image.content_type}")

        image_service = get_image_service(db)
        is_duplicate = await image_service.check_duplicate(image)

        logger.info(f"[CHECK_DUPLICATE] Result: is_duplicate={is_duplicate}")

        return DuplicateCheckResponse(
            is_duplicate=is_duplicate,
            message="This image has already been used" if is_duplicate else "Image is unique"
        )
    except Exception as e:
        logger.error(f"[CHECK_DUPLICATE] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Duplicate check failed: {str(e)}")
