from pydantic import BaseModel
from typing import Optional, Dict, Any

class RegistrationBase(BaseModel):
    event_id: str
    email: str
    phone: Optional[str] = None
    status: str = "confirmed"

class RegistrationCreate(BaseModel):
    form_data: Dict[str, Any]

class PublicRegistrationRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    gender: str = "Male"
    school_college: str
    standard: str
    stream: Optional[str] = None
    education_board: Optional[str] = None
    interested_field: Optional[str] = None
    medium: str = "Gujarati"
    address: str
    theory_percentile: str
    gujcet_percentile: Optional[str] = ""
    notes: Optional[str] = ""
    reference: Optional[str] = ""

class UserRegistrationResponse(RegistrationBase):
    registration_id: str
    registered_at: str
    form_data: Dict[str, Any]

# Aliases for backward compatibility with routers
RegistrationResponse = UserRegistrationResponse

class RegistrationCheckResponse(BaseModel):
    registered: bool
    registration_id: Optional[str] = None

class AdminRegistrationResponse(UserRegistrationResponse):
    pass

class BulkNotifyRequest(BaseModel):
    message: str
    channel: str = "sms"  # "sms", "email", or "both"
    filter_stream: Optional[str] = None
    filter_district: Optional[str] = None

class RegistrationUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    standard: Optional[str] = None
    school_college: Optional[str] = None
    medium: Optional[str] = None
    address: Optional[str] = None
    theory_percentile: Optional[str] = None
    gujcet_percentile: Optional[str] = None
    education_board: Optional[str] = None
    interested_field: Optional[str] = None
    notes: Optional[str] = None
    reference: Optional[str] = None
    status: Optional[str] = None
