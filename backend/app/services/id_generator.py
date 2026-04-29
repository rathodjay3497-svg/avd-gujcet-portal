from datetime import datetime, timezone
from app.services.dynamo import get_next_registration_id


def generate_registration_id(event_id: str) -> str:
    """Generate the next sequential registration ID for an event."""
    return get_next_registration_id(event_id)
