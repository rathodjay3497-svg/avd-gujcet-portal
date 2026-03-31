from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from typing import Optional, Dict

from app.config import get_settings
from app.logger import jwt_logger, get_request_id

settings = get_settings()


def create_token(data: Dict, expires_hours: Optional[int] = None) -> str:
    """Create a JWT token with the given data and expiry."""
    request_id = get_request_id()
    jwt_logger.debug(f"Creating JWT token with data keys: {list(data.keys())}", request_id=request_id)
    try:
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(
            hours=expires_hours or settings.JWT_EXPIRY_HOURS
        )
        to_encode["exp"] = expire
        token = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        jwt_logger.info(f"JWT token created successfully", request_id=request_id, extra={"expires_hours": expires_hours or settings.JWT_EXPIRY_HOURS})
        return token
    except Exception as e:
        jwt_logger.error(f"Error creating JWT token: {str(e)}", request_id=request_id, exc_info=True)
        raise


def decode_token(token: str) -> Optional[Dict]:
    """Decode and validate a JWT token. Returns None if invalid."""
    request_id = get_request_id()
    jwt_logger.debug(f"Decoding JWT token", request_id=request_id)
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        jwt_logger.info(f"JWT token decoded successfully", request_id=request_id, extra={"payload_keys": list(payload.keys())})
        return payload
    except JWTError as e:
        jwt_logger.warning(f"JWT token validation failed: {str(e)}", request_id=request_id)
        return None
    except Exception as e:
        jwt_logger.error(f"Error decoding JWT token: {str(e)}", request_id=request_id, exc_info=True)
        return None
