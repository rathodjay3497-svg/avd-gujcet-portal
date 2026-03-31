import logging
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

logger = logging.getLogger(__name__)


def verify_google_token(token: str, client_id: str) -> dict:
    """
    Verify a Google ID token and return the decoded payload.

    Returns a dict with: sub, email, name, picture, email_verified.
    Raises ValueError if the token is invalid or the email is not verified.
    """
    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            client_id,
        )
    except Exception as e:
        logger.warning(f"Google token verification failed: {e}")
        raise ValueError(f"Invalid Google token: {e}")

    if not idinfo.get("email_verified"):
        raise ValueError("Google account email is not verified")

    return {
        "sub": idinfo["sub"],
        "email": idinfo["email"],
        "name": idinfo.get("name", ""),
        "picture": idinfo.get("picture", ""),
        "email_verified": idinfo["email_verified"],
    }
