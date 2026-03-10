from pydantic import BaseModel, Field
from typing import Optional


class UserProfile(BaseModel):
    user_id: str
    name: str
    phone: str
    email: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    school_college: Optional[str] = None
    stream: Optional[str] = None
    medium: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = "Gujarat"
    pin_code: Optional[str] = None
    created_at: Optional[str] = None


class OTPRequest(BaseModel):
    phone: str = Field(..., pattern=r"^\d{10}$", description="10-digit Indian phone number")


class OTPVerify(BaseModel):
    phone: str = Field(..., pattern=r"^\d{10}$")
    otp: str = Field(..., min_length=6, max_length=6)


class AdminLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[UserProfile] = None
