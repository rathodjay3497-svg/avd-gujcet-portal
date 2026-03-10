from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from typing import Optional, Dict

from app.config import get_settings

settings = get_settings()


def create_token(data: Dict, expires_hours: Optional[int] = None) -> str:
    """Create a JWT token with the given data and expiry."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        hours=expires_hours or settings.JWT_EXPIRY_HOURS
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[Dict]:
    """Decode and validate a JWT token. Returns None if invalid."""
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None
