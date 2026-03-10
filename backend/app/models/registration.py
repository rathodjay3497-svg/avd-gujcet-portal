from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class RegistrationCreate(BaseModel):
    phone: str = Field(..., pattern=r"^\d{10}$")
    form_data: Dict[str, Any]


class RegistrationResponse(BaseModel):
    registration_id: str
    event_id: str
    phone: str
    form_data: Dict[str, Any]
    pdf_url: Optional[str] = None
    status: str = "confirmed"
    registered_at: str


class RegistrationCheckResponse(BaseModel):
    registered: bool
    registration_id: Optional[str] = None


class BulkNotifyRequest(BaseModel):
    message: str
    channel: str = "sms"  # "sms", "email", or "both"
    filter_stream: Optional[str] = None
    filter_district: Optional[str] = None
