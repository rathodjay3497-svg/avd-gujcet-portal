from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional

from app.dependencies import require_admin
from app.models.event import EventCreate, EventUpdate, EventResponse, StatusUpdate
from app.services import dynamo

router = APIRouter()


@router.get("", response_model=List[EventResponse], summary="List all active events")
def list_events(status_filter: Optional[str] = "active"):
    events = dynamo.list_events(status=status_filter)
    return [_format_event(e) for e in events]


@router.get("/{event_id}", response_model=EventResponse, summary="Get event details")
def get_event(event_id: str):
    event = dynamo.get_event(event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return _format_event(event)


@router.post("", response_model=EventResponse, status_code=201, summary="Create a new event")
def create_event(body: EventCreate, _admin=Depends(require_admin)):
    # Check if event_id already exists
    existing = dynamo.get_event(body.event_id)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Event ID already exists")

    event_data = body.model_dump()
    event = dynamo.create_event(event_data)
    return _format_event(event)


@router.put("/{event_id}", response_model=EventResponse, summary="Update an event")
def update_event(event_id: str, body: EventUpdate, _admin=Depends(require_admin)):
    existing = dynamo.get_event(event_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    updates = body.model_dump(exclude_none=True)
    if not updates:
        return _format_event(existing)

    updated = dynamo.update_event(event_id, updates)
    return _format_event(updated)


@router.patch("/{event_id}/status", response_model=EventResponse, summary="Update event status")
def update_event_status(event_id: str, body: StatusUpdate, _admin=Depends(require_admin)):
    existing = dynamo.get_event(event_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    updated = dynamo.update_event(event_id, {"status": body.status.value})
    return _format_event(updated)


@router.delete("/{event_id}", summary="Delete an event")
def delete_event(event_id: str, _admin=Depends(require_admin)):
    existing = dynamo.get_event(event_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    dynamo.delete_event(event_id)
    return {"message": "Event deleted successfully"}


def _format_event(event: dict) -> dict:
    """Format raw DynamoDB event item to EventResponse shape."""
    return {
        "event_id": event.get("event_id", ""),
        "title": event.get("title", ""),
        "description": event.get("description", ""),
        "registration_type": event.get("registration_type", "full_form"),
        "fee": event.get("fee", 0),
        "streams": event.get("streams", []),
        "venue": event.get("venue", ""),
        "start_date": event.get("start_date"),
        "end_date": event.get("end_date"),
        "start_time": event.get("start_time"),
        "end_time": event.get("end_time"),
        "organized_by": event.get("organized_by"),
        "future_scope": event.get("future_scope", False),
        "registration_deadline": event.get("registration_deadline"),
        "contact_details": event.get("contact_details"),
        "status": event.get("status", "draft"),
        "created_at": event.get("created_at", ""),
    }
