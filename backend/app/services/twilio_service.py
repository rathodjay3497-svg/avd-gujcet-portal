from twilio.rest import Client
from app.config import get_settings

settings = get_settings()


def _get_client() -> Client:
    return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)


def send_otp_sms(phone: str, otp: str):
    """Send OTP verification SMS to the student."""
    client = _get_client()
    client.messages.create(
        body=f"Your GUJCET Platform verification code is: {otp}. Valid for 5 minutes.",
        from_=settings.TWILIO_PHONE_NUMBER,
        to=f"+91{phone}",
    )


def send_registration_sms(phone: str, name: str, event_title: str, reg_id: str, event_date: str, venue: str):
    """Send registration confirmation SMS."""
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


def send_bulk_sms(phone_numbers: list[str], message: str):
    """Send bulk SMS to a list of phone numbers."""
    client = _get_client()
    for phone in phone_numbers:
        client.messages.create(
            body=message,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=f"+91{phone}",
        )
