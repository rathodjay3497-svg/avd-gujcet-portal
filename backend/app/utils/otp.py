import random
import string
from passlib.hash import bcrypt


def generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP."""
    return "".join(random.choices(string.digits, k=length))


def hash_otp(otp: str) -> str:
    """Hash OTP using bcrypt."""
    return bcrypt.hash(otp)


def verify_otp(otp: str, otp_hash: str) -> bool:
    """Verify OTP against its bcrypt hash."""
    return bcrypt.verify(otp, otp_hash)
