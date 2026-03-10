from pydantic import BaseModel, Field
from typing import Optional


class UserProfile(BaseModel):
    user_id: str
    email: str
    name: str
    phone: Optional[str] = None
    picture: Optional[str] = None
    google_sub: Optional[str] = None
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


class GoogleAuthRequest(BaseModel):
    id_token: str


class AdminLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[dict] = None
    is_new_user: bool = False
