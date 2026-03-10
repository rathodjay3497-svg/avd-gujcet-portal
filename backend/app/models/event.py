from pydantic import BaseModel, Field
from typing import Optional, List, Any
from enum import Enum


class RegistrationType(str, Enum):
    FORM = "form"
    CLICK_TO_REGISTER = "click_to_register"


class FormType(str, Enum):
    JSON_SCHEMA = "json_schema"
    HTML = "html"


class EventStatus(str, Enum):
    ACTIVE = "active"
    DRAFT = "draft"
    CLOSED = "closed"


class EventCreate(BaseModel):
    event_id: str = Field(..., description="URL-safe slug, e.g. gujcet-2026")
    title: str
    description: str = ""
    medium: str = "English"
    event_type: str = "counseling"
    registration_type: RegistrationType = RegistrationType.FORM
    is_paid: bool = False
    fee_amount: float = 0
    streams: List[str] = ["Science", "Commerce", "Arts"]
    venue: str = ""
    event_date: str = ""
    registration_deadline: Optional[str] = None
    seat_limit: Optional[int] = None
    status: EventStatus = EventStatus.DRAFT
    form_type: FormType = FormType.JSON_SCHEMA
    form_schema: Optional[List[dict]] = None
    form_html: Optional[str] = None


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    medium: Optional[str] = None
    event_type: Optional[str] = None
    registration_type: Optional[RegistrationType] = None
    is_paid: Optional[bool] = None
    fee_amount: Optional[float] = None
    streams: Optional[List[str]] = None
    venue: Optional[str] = None
    event_date: Optional[str] = None
    registration_deadline: Optional[str] = None
    seat_limit: Optional[int] = None
    status: Optional[EventStatus] = None
    form_type: Optional[FormType] = None
    form_schema: Optional[List[dict]] = None
    form_html: Optional[str] = None


class EventResponse(BaseModel):
    event_id: str
    title: str
    description: str
    medium: str
    event_type: str
    registration_type: str
    is_paid: bool
    fee_amount: float
    streams: List[str]
    venue: str
    event_date: str
    registration_deadline: Optional[str]
    seat_limit: Optional[int]
    seat_filled: int = 0
    status: str
    form_type: str
    form_schema: Optional[List[Any]] = None
    form_html: Optional[str] = None
    created_at: str


class StatusUpdate(BaseModel):
    status: EventStatus
