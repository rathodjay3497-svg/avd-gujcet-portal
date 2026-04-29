from pydantic import BaseModel, field_validator
from typing import Optional, Dict, Any
import re


class RegistrationCreate(BaseModel):
    form_data: Dict[str, Any]


class PublicRegistrationRequest(BaseModel):
    name: str
    phone: str  # 10-digit mobile number
    gender: str = "Male"
    school_college: str
    medium: str = "English"
    address: str
    email: Optional[str] = None
    standard: Optional[str] = None
    reference: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if len(digits) != 10:
            raise ValueError("Phone number must be exactly 10 digits")
        return digits


class RegistrationResponse(BaseModel):
    registration_id: str
    event_id: str
    email: str
    form_data: Dict[str, Any]
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
