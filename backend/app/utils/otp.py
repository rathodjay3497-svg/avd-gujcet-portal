import random
import string
import bcrypt

from app.logger import otp_logger, get_request_id


def generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP."""
    request_id = get_request_id()
    otp_logger.debug(f"Generating OTP of length: {length}", request_id=request_id)
    otp = "".join(random.choices(string.digits, k=length))
    otp_logger.debug(f"OTP generated successfully", request_id=request_id)
    return otp


def hash_otp(otp: str) -> str:
    """Hash OTP using bcrypt."""
    request_id = get_request_id()
    otp_logger.debug(f"Hashing OTP", request_id=request_id)
    try:
        # bcrypt requires bytes
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(otp.encode('utf-8'), salt)
        otp_logger.info(f"OTP hashed successfully", request_id=request_id)
        return hashed.decode('utf-8')
    except Exception as e:
        otp_logger.error(f"Error hashing OTP: {str(e)}", request_id=request_id, exc_info=True)
        raise


def verify_otp(otp: str, otp_hash: str) -> bool:
    """Verify OTP against its bcrypt hash."""
    request_id = get_request_id()
    otp_logger.debug(f"Verifying OTP", request_id=request_id)
    try:
        result = bcrypt.checkpw(otp.encode('utf-8'), otp_hash.encode('utf-8'))
        if result:
            otp_logger.info(f"OTP verified successfully", request_id=request_id)
        else:
            otp_logger.warning(f"OTP verification failed - invalid OTP", request_id=request_id)
        return result
    except Exception as e:
        otp_logger.error(f"Error verifying OTP: {str(e)}", request_id=request_id, exc_info=True)
        return False
