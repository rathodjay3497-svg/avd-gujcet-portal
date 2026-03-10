import time
import uuid

from fastapi import APIRouter, HTTPException, status
from passlib.hash import bcrypt

from app.config import get_settings
from app.models.user import OTPRequest, OTPVerify, AdminLogin, TokenResponse
from app.services import dynamo
from app.services.twilio_service import send_otp_sms
from app.utils.jwt import create_token
from app.utils.otp import generate_otp, hash_otp, verify_otp

settings = get_settings()
router = APIRouter()

OTP_EXPIRY_SECONDS = 300  # 5 minutes
MAX_OTP_ATTEMPTS = 3


@router.post("/otp/send", summary="Send OTP to phone number")
def send_otp(body: OTPRequest):
    otp = generate_otp()
    otp_hashed = hash_otp(otp)
    expires_at = int(time.time()) + OTP_EXPIRY_SECONDS

    dynamo.save_otp(body.phone, otp_hashed, expires_at)

    # Send SMS (skip in development if Twilio is not configured)
    if settings.TWILIO_ACCOUNT_SID:
        send_otp_sms(body.phone, otp)

    return {"message": "OTP sent successfully", "expires_in": OTP_EXPIRY_SECONDS}


@router.post("/otp/verify", response_model=TokenResponse, summary="Verify OTP and get JWT")
def verify_otp_endpoint(body: OTPVerify):
    otp_record = dynamo.get_otp(body.phone)

    if not otp_record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No OTP found. Request a new one.")

    # Check expiry
    if int(time.time()) > otp_record.get("expires_at", 0):
        dynamo.delete_otp(body.phone)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired. Request a new one.")

    # Check attempts
    if otp_record.get("attempts", 0) >= MAX_OTP_ATTEMPTS:
        dynamo.delete_otp(body.phone)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Too many attempts. Request a new OTP.")

    # Verify
    if not verify_otp(body.otp, otp_record["otp_hash"]):
        dynamo.increment_otp_attempts(body.phone)
        remaining = MAX_OTP_ATTEMPTS - otp_record.get("attempts", 0) - 1
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OTP. {remaining} attempts remaining.",
        )

    # OTP valid — clean up
    dynamo.delete_otp(body.phone)

    # Get or create user
    user = dynamo.get_user(body.phone)
    if not user:
        user = dynamo.upsert_user(body.phone, {
            "user_id": f"usr_{uuid.uuid4().hex[:12]}",
            "name": "",
            "phone": body.phone,
        })

    # Issue JWT
    token = create_token({"sub": body.phone, "user_id": user.get("user_id"), "role": "student"})

    return TokenResponse(
        access_token=token,
        user={
            "user_id": user.get("user_id", ""),
            "name": user.get("name", ""),
            "phone": body.phone,
            "email": user.get("email"),
            "stream": user.get("stream"),
            "district": user.get("district"),
            "school_college": user.get("school_college"),
        },
    )


@router.post("/admin/login", response_model=TokenResponse, summary="Admin login with username and password")
def admin_login(body: AdminLogin):
    if body.username != settings.ADMIN_USERNAME:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not settings.ADMIN_PASSWORD_HASH or not bcrypt.verify(body.password, settings.ADMIN_PASSWORD_HASH):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_token(
        {"sub": "admin", "role": "admin"},
        expires_hours=settings.ADMIN_JWT_EXPIRY_HOURS,
    )

    return TokenResponse(access_token=token)
