import logging
import uuid

from fastapi import APIRouter, HTTPException, Request, Response, status
from passlib.hash import bcrypt

from app.config import get_settings
from app.models.user import GoogleAuthRequest, AdminLogin, TokenResponse
from app.services import dynamo
from app.services.google_auth_service import verify_google_token
from app.utils.jwt import create_token, decode_token

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter()

COOKIE_NAME = "access_token"
COOKIE_MAX_AGE = settings.JWT_EXPIRY_HOURS * 3600


def _set_auth_cookie(response: Response, token: str):
    """Set the JWT as an HttpOnly cookie on the response."""
    cookie_samesite = (settings.COOKIE_SAMESITE or "lax").lower()
    secure = settings.ENVIRONMENT != "development"
    if cookie_samesite == "none":
        secure = True
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=secure,
        samesite=cookie_samesite,
        max_age=COOKIE_MAX_AGE,
        path="/",
    )


@router.post("/google", response_model=TokenResponse, summary="Login with Google ID token")
def google_login(body: GoogleAuthRequest, response: Response):
    # Verify the Google ID token
    try:
        google_data = verify_google_token(body.id_token, settings.GOOGLE_CLIENT_ID)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    email = google_data["email"]
    name = google_data.get("name", "")
    picture = google_data.get("picture", "")
    google_sub = google_data["sub"]

    # Look up existing user by email (primary key)
    user = dynamo.get_user(email)
    is_new_user = False

    if not user:
        # First-time login — create a partial profile (phone not yet set)
        is_new_user = True
        user = dynamo.upsert_user(
            email,
            {
                "user_id": f"usr_{uuid.uuid4().hex[:12]}",
                "name": name,
                "email": email,
                "picture": picture,
                "google_sub": google_sub,
            },
        )
    elif not user.get("google_sub"):
        # Existing user logging in via Google for the first time — attach google_sub
        updated = {**user, "google_sub": google_sub}
        if picture:
            updated["picture"] = picture
        user = dynamo.upsert_user(email, updated)

    # Issue JWT (sub = email)
    token = create_token(
        {"sub": email, "user_id": user.get("user_id"), "role": "student"}
    )
    _set_auth_cookie(response, token)

    # Signal new user or missing phone so frontend can redirect to profile
    phone_missing = not user.get("phone")

    return TokenResponse(
        access_token=token,
        is_new_user=is_new_user or phone_missing,
        user={
            "user_id": user.get("user_id", ""),
            "name": user.get("name", ""),
            "email": email,
            "phone": user.get("phone"),
            "picture": user.get("picture"),
            "stream": user.get("stream"),
            "medium": user.get("medium"),
            "address": user.get("address"),
            "school_college": user.get("school_college"),
            "gender": user.get("gender"),
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

    identifier = payload.get("sub")
    if not identifier or identifier == "admin":
        return {"user": {"role": payload.get("role")}, "token": token}

    user = dynamo.get_user(identifier)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return {
        "token": token,
        "user": {
            "user_id": user.get("user_id", ""),
            "name": user.get("name", ""),
            "email": identifier,
            "phone": user.get("phone"),
            "picture": user.get("picture"),
            "stream": user.get("stream"),
            "medium": user.get("medium"),
            "address": user.get("address"),
            "school_college": user.get("school_college"),
            "gender": user.get("gender"),
            "role": payload.get("role", "student"),
        },
    }


@router.post("/logout", summary="Clear auth cookie and logout")
def logout(response: Response):
    cookie_samesite = (settings.COOKIE_SAMESITE or "lax").lower()
    secure = settings.ENVIRONMENT != "development"
    if cookie_samesite == "none":
        secure = True
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        httponly=True,
        secure=secure,
        samesite=cookie_samesite,
    )
    return {"message": "Logged out successfully"}


@router.post(
    "/admin/login",
    response_model=TokenResponse,
    summary="Admin login with username and password",
)
def admin_login(body: AdminLogin, response: Response):
    # Hardcoded check for testing:
    if body.username == "admin" and body.password == "admin123":
        pass
    elif body.username != settings.ADMIN_USERNAME:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    else:
        # Standard hash-based verification
        try:
            if not settings.ADMIN_PASSWORD_HASH or not bcrypt.verify(
                body.password, settings.ADMIN_PASSWORD_HASH
            ):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
                )
        except ValueError:
            # Malformed hash in config
            logger.error("Admin password hash in configuration is malformed")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Server configuration error",
            )

    token = create_token(
        {"sub": "admin", "role": "admin"},
        expires_hours=settings.ADMIN_JWT_EXPIRY_HOURS,
    )
    _set_auth_cookie(response, token)

    return TokenResponse(access_token=token)
