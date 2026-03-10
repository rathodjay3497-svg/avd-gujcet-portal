import random
import string
import bcrypt


def generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP."""
    return "".join(random.choices(string.digits, k=length))


def hash_otp(otp: str) -> str:
    """Hash OTP using bcrypt."""
    # bcrypt requires bytes
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(otp.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_otp(otp: str, otp_hash: str) -> bool:
    """Verify OTP against its bcrypt hash."""
    return bcrypt.checkpw(otp.encode('utf-8'), otp_hash.encode('utf-8'))
