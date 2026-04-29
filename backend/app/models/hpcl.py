from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, Dict, Any
import re


class HPCLRegistrationRequest(BaseModel):
    name: str
    phone: str
    age: int
    address: str
    standard: str
    playing_role: str
    batting_style: Optional[str] = None
    bowling_style: Optional[str] = None
    group: str
    reference: Optional[str] = None
    fees_paid: bool = False
    paid_to: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if len(digits) != 10:
            raise ValueError("Phone number must be exactly 10 digits")
        return digits

    @model_validator(mode="after")
    def validate_paid_to(self) -> "HPCLRegistrationRequest":
        if self.fees_paid and not self.paid_to:
            raise ValueError("paid_to is required when fees_paid is True")
        return self


class HPCLRegistrationResponse(BaseModel):
    registration_id: str
    event_id: str
    phone: str
    form_data: Dict[str, Any]
    status: str = "confirmed"
    registered_at: str


class HPCLUpdateRequest(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    reference: Optional[str] = None
    fees_paid: Optional[bool] = None
    paid_to: Optional[str] = None


    @model_validator(mode="after")
    def validate_paid_to(self) -> "HPCLUpdateRequest":
        if self.fees_paid is True and not self.paid_to:
            raise ValueError("paid_to is required when fees_paid is True")
        if self.fees_paid is False:
            self.paid_to = ""
        return self
