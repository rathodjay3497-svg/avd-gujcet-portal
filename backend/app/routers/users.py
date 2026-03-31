from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from app.dependencies import get_current_user
from app.models.user import UserProfile
from app.services import dynamo

router = APIRouter()


class UpdateProfileRequest(BaseModel):
    name: str
    phone: Optional[str] = Field(None, pattern=r"^\d{10}$", description="10-digit Indian mobile number")
    gender: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    school_college: Optional[str] = None
    stream: Optional[str] = None
    medium: Optional[str] = None
    address: Optional[str] = None



@router.get("/me", response_model=UserProfile)
def get_my_profile(current_user: dict = Depends(get_current_user)):
    user = dynamo.get_user(current_user["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/me")
def update_my_profile(payload: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    email = current_user["sub"]
    user = dynamo.get_user(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updates = payload.model_dump(exclude_none=True)
    # email is the PK — never allow updates to overwrite it from request body
    updates.pop("email", None)
    merged = {**user, **updates}
    updated_user = dynamo.upsert_user(email, merged)
    return updated_user
