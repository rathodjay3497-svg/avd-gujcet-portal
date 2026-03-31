from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Optional

from app.utils.jwt import decode_token

security = HTTPBearer(auto_error=False)

COOKIE_NAME = "access_token"


def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Dict:
    """Extract and validate the current user from JWT token.
    
    Checks Authorization header first, then falls back to HttpOnly cookie.
    """
    token = None

    # 1. Try Authorization header
    if credentials:
        token = credentials.credentials

    # 2. Fallback to cookie
    if not token:
        token = request.cookies.get(COOKIE_NAME)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return payload


def require_admin(user: Dict = Depends(get_current_user)) -> Dict:
    """Ensure the current user has admin role."""
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user
