from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import OtpRequest, OtpVerify, Token
from app.schemas.user import UserResponse
from app.services.service_factory import get_otp_service
from app.services.auth_service import AuthService
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.models.entry import Entry

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/request-otp")
async def request_otp(
    request: OtpRequest,
    db: Session = Depends(get_db)
):
    """Request OTP for login"""
    otp_service = get_otp_service(db)
    result = otp_service.send_otp(request.phone_number)

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

    return result

@router.post("/verify-otp", response_model=dict)
async def verify_otp(
    request: OtpVerify,
    db: Session = Depends(get_db)
):
    """Verify OTP and login"""
    otp_service = get_otp_service(db)
    auth_service = AuthService(db)

    # Verify OTP
    result = otp_service.verify_otp(request.phone_number, request.otp_code)

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

    # Get or create user
    # Note: Name should be stored in session from request-otp
    # For simplicity, using phone as name if not provided
    user = auth_service.get_or_create_user(
        name="User",  # Should come from session
        phone_number=request.phone_number
    )

    # Create access token
    access_token = auth_service.create_access_token(user.id)

    # Count user's entries
    entry_count = db.query(Entry).filter(Entry.user_id == user.id).count()

    # Create user response with entry_count
    user_response = UserResponse.from_orm(user)
    user_response.entry_count = entry_count

    return {
        "success": True,
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout (client-side token removal)"""
    return {
        "success": True,
        "message": "Logged out successfully"
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user information"""
    # Count user's entries
    entry_count = db.query(Entry).filter(Entry.user_id == current_user.id).count()

    # Create response with entry_count
    user_data = UserResponse.from_orm(current_user)
    user_data.entry_count = entry_count

    return user_data
