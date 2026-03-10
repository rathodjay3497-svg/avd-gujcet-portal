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


@router.delete("/{event_id}", summary="Soft-delete an event")
def delete_event(event_id: str, _admin=Depends(require_admin)):
    existing = dynamo.get_event(event_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    dynamo.update_event(event_id, {"status": "closed"})
    return {"message": "Event closed successfully"}


def _format_event(event: dict) -> dict:
    """Format raw DynamoDB event item to EventResponse shape."""
    return {
        "event_id": event.get("event_id", ""),
        "title": event.get("title", ""),
        "description": event.get("description", ""),
        "medium": event.get("medium", "English"),
        "event_type": event.get("event_type", "counseling"),
        "registration_type": event.get("registration_type", "form"),
        "is_paid": event.get("is_paid", False),
        "fee_amount": event.get("fee_amount", 0),
        "streams": event.get("streams", []),
        "venue": event.get("venue", ""),
        "event_date": event.get("event_date", ""),
        "registration_deadline": event.get("registration_deadline"),
        "seat_limit": event.get("seat_limit"),
        "seat_filled": event.get("seat_filled", 0),
        "status": event.get("status", "draft"),
        "form_type": event.get("form_type", "json_schema"),
        "form_schema": event.get("form_schema"),
        "form_html": event.get("form_html"),
        "created_at": event.get("created_at", ""),
    }
