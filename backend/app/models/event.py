from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class RegistrationType(str, Enum):
    FULL_FORM = "full_form"
    CLICK_TO_REGISTER = "click_to_register"


class EventStatus(str, Enum):
    ACTIVE = "active"
    DRAFT = "draft"
    CLOSED = "closed"


class EventCreate(BaseModel):
    event_id: str = Field(..., description="URL-safe slug, e.g. gujcet-2026")
    title: str
    description: str = ""
    registration_type: RegistrationType = RegistrationType.FULL_FORM
    fee: float = 0
    streams: List[str] = []
    venue: str = ""
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    organized_by: Optional[str] = None
    future_scope: Optional[bool] = False
    registration_deadline: Optional[str] = None
    status: EventStatus = EventStatus.DRAFT


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    registration_type: Optional[RegistrationType] = None
    fee: Optional[float] = None
    streams: Optional[List[str]] = None
    venue: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    organized_by: Optional[str] = None
    future_scope: Optional[bool] = None
    registration_deadline: Optional[str] = None
    status: Optional[EventStatus] = None


class EventResponse(BaseModel):
    event_id: str
    title: str
    description: str
    registration_type: str
    fee: float = 0
    streams: List[str]
    venue: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    organized_by: Optional[str] = None
    future_scope: Optional[bool] = False
    registration_deadline: Optional[str]
    status: str
    created_at: str


class StatusUpdate(BaseModel):
    status: EventStatus
