from pydantic import BaseModel
from typing import Optional


class HelpDeskEntryCreate(BaseModel):
    """Payload to create a new help-desk admission entry."""

    body: str                             # Governing body / university name
    course: str                           # Course name (supports \n line breaks)
    eligibility: str                      # Eligibility criteria
    start_date: Optional[str] = ""        # Empty string → "Announce Soon"
    end_date: Optional[str] = ""          # Empty string → "Announce Soon"
    link: Optional[str] = ""             # Primary URL or plain text label
    link2: Optional[str] = ""            # Secondary URL (Details button)
    sort_order: Optional[int] = 0        # Ascending sort order for display


class HelpDeskEntryUpdate(BaseModel):
    """All fields are optional — send only what needs to change."""

    body: Optional[str] = None
    course: Optional[str] = None
    eligibility: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    link: Optional[str] = None
    link2: Optional[str] = None
    sort_order: Optional[int] = None


class HelpDeskEntryResponse(BaseModel):
    """Full representation of a help-desk entry returned by the API."""

    entry_id: str
    body: str
    course: str
    eligibility: str
    start_date: str
    end_date: str
    link: str
    link2: str
    sort_order: int
    created_at: str
    updated_at: str


class HelpDeskSettings(BaseModel):
    """Global settings for the help-desk."""
    default_sort: str = "custom"
