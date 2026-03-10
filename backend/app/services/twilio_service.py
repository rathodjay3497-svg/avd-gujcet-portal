from twilio.rest import Client
from app.config import get_settings
from app.logger import sms_logger, get_request_id

settings = get_settings()


def _get_client() -> Client:
    return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)


def send_otp_sms(phone: str, otp: str):
    """Send OTP verification SMS to the student."""
    request_id = get_request_id()
    sms_logger.info(f"Sending OTP SMS to phone: {phone}", request_id=request_id, extra={"phone": phone, "type": "otp"})
    try:
        client = _get_client()
        client.messages.create(
            body=f"Your GUJCET Platform verification code is: {otp}. Valid for 5 minutes.",
            from_=settings.TWILIO_PHONE_NUMBER,
            to=f"+91{phone}",
        )
        sms_logger.info(f"OTP SMS sent successfully to phone: {phone}", request_id=request_id)
    except Exception as e:
        sms_logger.error(f"Error sending OTP SMS to phone {phone}: {str(e)}", request_id=request_id, exc_info=True)
        raise


def send_registration_sms(phone: str, name: str, event_title: str, reg_id: str, event_date: str, venue: str):
    """Send registration confirmation SMS."""
    request_id = get_request_id()
    sms_logger.info(
        f"Sending registration SMS to phone: {phone}, event: {event_title}, reg_id: {reg_id}",
        request_id=request_id,
        extra={"phone": phone, "event_title": event_title, "reg_id": reg_id, "type": "registration"}
    )
    try:
        client = _get_client()
        message = (
            f"Hi {name}! You're registered for {event_title}. "
            f"Reg ID: {reg_id}. Date: {event_date}, {venue}. "
            f"Keep this ID for reference."
        )
        client.messages.create(
            body=message,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=f"+91{phone}",
        )
        sms_logger.info(f"Registration SMS sent successfully to phone: {phone}", request_id=request_id)
    except Exception as e:
        sms_logger.error(f"Error sending registration SMS to phone {phone}: {str(e)}", request_id=request_id, exc_info=True)
        raise


def send_bulk_sms(phone_numbers: list[str], message: str):
    """Send bulk SMS to a list of phone numbers."""
    request_id = get_request_id()
    sms_logger.info(f"Sending bulk SMS to {len(phone_numbers)} recipients", request_id=request_id, extra={"count": len(phone_numbers), "type": "bulk"})
    
    client = _get_client()
    success_count = 0
    failed_count = 0
    
    for phone in phone_numbers:
        try:
            client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=f"+91{phone}",
            )
            success_count += 1
        except Exception as e:
            failed_count += 1
            sms_logger.error(f"Error sending bulk SMS to phone {phone}: {str(e)}", request_id=request_id, exc_info=True)
    
    sms_logger.info(f"Bulk SMS completed. Success: {success_count}, Failed: {failed_count}", request_id=request_id, extra={"success": success_count, "failed": failed_count})
