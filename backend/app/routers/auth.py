import logging
import time
import uuid

from fastapi import APIRouter, HTTPException, Request, Response, status
from passlib.hash import bcrypt

from app.config import get_settings
from app.models.user import OTPRequest, OTPVerify, AdminLogin, TokenResponse
from app.services import dynamo
from app.services.twilio_service import send_otp_sms
from app.utils.jwt import create_token, decode_token

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter()

OTP_EXPIRY_SECONDS = 300  # 5 minutes
MAX_OTP_ATTEMPTS = 3
COOKIE_NAME = "access_token"
COOKIE_MAX_AGE = settings.JWT_EXPIRY_HOURS * 3600  # seconds


def _set_auth_cookie(response: Response, token: str):
    """Set the JWT as an HttpOnly cookie on the response."""
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.ENVIRONMENT != "development",
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        path="/",
    )


@router.post("/otp/send", summary="Send OTP to phone number")
def send_otp(body: OTPRequest):
    otp = generate_otp()
    from app.utils.otp import hash_otp

    otp_hashed = hash_otp(otp)
    expires_at = int(time.time()) + OTP_EXPIRY_SECONDS

    dynamo.save_otp(body.phone, otp_hashed, expires_at)

    # Send SMS (skip in development if Twilio is not configured)
    if settings.TWILIO_ACCOUNT_SID:
        try:
            send_otp_sms(body.phone, otp)
        except Exception as e:
            logger.error(f"Failed to send SMS via Twilio: {e}")

    return {"message": "OTP sent successfully", "expires_in": OTP_EXPIRY_SECONDS}


@router.post(
    "/otp/verify", response_model=TokenResponse, summary="Verify OTP and get JWT"
)
def verify_otp_endpoint(body: OTPVerify, response: Response):
    from app.utils.otp import verify_otp

    otp_record = dynamo.get_otp(body.phone)

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP found. Request a new one.",
        )

    # Check expiry
    if int(time.time()) > otp_record.get("expires_at", 0):
        dynamo.delete_otp(body.phone)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Request a new one.",
        )

    # Check attempts
    if otp_record.get("attempts", 0) >= MAX_OTP_ATTEMPTS:
        dynamo.delete_otp(body.phone)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many attempts. Request a new OTP.",
        )

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
        user = dynamo.upsert_user(
            body.phone,
            {
                "user_id": f"usr_{uuid.uuid4().hex[:12]}",
                "name": "",
                "phone": body.phone,
            },
        )

    # Issue JWT
    token = create_token(
        {"sub": body.phone, "user_id": user.get("user_id"), "role": "student"}
    )

    # Set HttpOnly cookie
    _set_auth_cookie(response, token)

    return TokenResponse(
        access_token=token,
        user={
            "user_id": user.get("user_id", ""),
            "name": user.get("name", ""),
            "phone": body.phone,
            "email": user.get("email"),
            "stream": user.get("stream"),
            "medium": user.get("medium"),
            "address": user.get("address"),
            "district": user.get("district"),
            "school_college": user.get("school_college"),
        },
    )


@router.get("/me", summary="Get current user from cookie session")
def get_me(request: Request):
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        )

    phone = payload.get("sub")
    if not phone or phone == "admin":
        # Return admin info directly from token
        return {"user": {"role": payload.get("role")}, "token": token}

    user = dynamo.get_user(phone)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return {
        "token": token,
        "user": {
            "user_id": user.get("user_id", ""),
            "name": user.get("name", ""),
            "phone": phone,
            "email": user.get("email"),
            "stream": user.get("stream"),
            "medium": user.get("medium"),
            "address": user.get("address"),
            "district": user.get("district"),
            "school_college": user.get("school_college"),
            "role": payload.get("role", "student"),
        },
    }


@router.post("/logout", summary="Clear auth cookie and logout")
def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"message": "Logged out successfully"}


@router.post(
    "/admin/login",
    response_model=TokenResponse,
    summary="Admin login with username and password",
)
def admin_login(body: AdminLogin, response: Response):
    if body.username != settings.ADMIN_USERNAME:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    if not settings.ADMIN_PASSWORD_HASH or not bcrypt.verify(
        body.password, settings.ADMIN_PASSWORD_HASH
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    token = create_token(
        {"sub": "admin", "role": "admin"},
        expires_hours=settings.ADMIN_JWT_EXPIRY_HOURS,
    )

    # Set HttpOnly cookie for admin too
    _set_auth_cookie(response, token)

    return TokenResponse(access_token=token)
