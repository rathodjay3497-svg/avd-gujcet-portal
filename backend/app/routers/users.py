from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_current_user
from app.models.user import UserProfile
from app.services import dynamo

router = APIRouter()

class UpdateProfileRequest(BaseModel):
    name: str
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

@router.get("/me", response_model=UserProfile)
def get_my_profile(current_user: dict = Depends(get_current_user)):
    user = dynamo.get_user(current_user["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/me")
def update_my_profile(payload: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    phone = current_user["sub"]
    user = dynamo.get_user(phone)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Merge new data with existing, preserving user_id, phone, created_at etc.
    updates = payload.model_dump(exclude_none=True)
    merged = {**user, **updates}
    updated_user = dynamo.upsert_user(phone, merged)
    return updated_user
