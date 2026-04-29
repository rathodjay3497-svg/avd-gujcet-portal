import csv
import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional

from app.dependencies import require_admin
from app.models.registration import BulkNotifyRequest
from app.services import dynamo
from app.services.email_service import send_bulk_email
from app.config import get_settings

settings = get_settings()
router = APIRouter()


def _flatten_reg(r: dict) -> dict:
    """Flatten a registration item for API responses — pulls common fields out of form_data."""
    fd = r.get("form_data", {})
    return {
        "registration_id": r.get("registration_id", ""),
        "phone": r.get("phone") or fd.get("phone", ""),
        "name": fd.get("name", ""),
        "gender": fd.get("gender", ""),
        "standard": fd.get("standard", ""),
        "school_college": fd.get("school_college") or fd.get("school", ""),
        "medium": fd.get("medium", ""),
        "address": fd.get("address", ""),
        "reference": fd.get("reference", ""),
        "form_data": fd,
        "status": r.get("status", "confirmed"),
        "registered_at": r.get("registered_at", ""),
    }


@router.get("/registrations/{event_id}", summary="Get all registrations for an event")
def get_registrations(event_id: str, _admin=Depends(require_admin)):
    event = dynamo.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    regs = dynamo.get_event_registrations(event_id)
    return {
        "event_id": event_id,
        "event_title": event.get("title", ""),
        "total": len(regs),
        "registrations": [_flatten_reg(r) for r in regs],
    }


@router.get("/registrations/{event_id}/export", summary="Export registrations as CSV")
def export_registrations(event_id: str, _admin=Depends(require_admin)):
    event = dynamo.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    regs = dynamo.get_event_registrations(event_id)

    output = io.StringIO()
    writer = csv.writer(output)

    headers = [
        "Registration ID",
        "Name",
        "Phone",
        "Gender",
        "Standard / Education",
        "School / College",
        "Medium",
        "Address",
        "Reference",
        "Status",
        "Registered At",
    ]
    writer.writerow(headers)

    for r in regs:
        flat = _flatten_reg(r)
        row = [
            flat["registration_id"],
            flat["name"],
            flat["phone"],
            flat["gender"],
            flat["standard"],
            flat["school_college"],
            flat["medium"],
            flat["address"],
            flat["reference"],
            flat["status"],
            flat["registered_at"],
        ]
        writer.writerow(row)

    output.seek(0)
    filename = f"{event.get('title', event_id)}-registrations.csv".replace(" ", "_")
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/stats/{event_id}", summary="Get registration statistics")
def get_stats(event_id: str, _admin=Depends(require_admin)):
    event = dynamo.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    regs = dynamo.get_event_registrations(event_id)

    stream_counts = {}
    district_counts = {}
    for r in regs:
        fd = r.get("form_data", {})
        stream = fd.get("stream", "Unknown")
        district = fd.get("district", "Unknown")
        stream_counts[stream] = stream_counts.get(stream, 0) + 1
        district_counts[district] = district_counts.get(district, 0) + 1

    return {
        "event_id": event_id,
        "event_title": event.get("title", ""),
        "total_registrations": len(regs),
        "seat_limit": event.get("seat_limit"),
        "seat_filled": event.get("seat_filled", 0),
        "by_stream": stream_counts,
        "by_district": district_counts,
    }


@router.post("/notify/{event_id}", summary="Send bulk notifications")
def send_notifications(event_id: str, body: BulkNotifyRequest, _admin=Depends(require_admin)):
    event = dynamo.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    regs = dynamo.get_event_registrations(event_id)

    if body.filter_stream:
        regs = [r for r in regs if r.get("form_data", {}).get("stream") == body.filter_stream]
    if body.filter_district:
        regs = [r for r in regs if r.get("form_data", {}).get("district") == body.filter_district]

    # Phone is stored at top-level (post-migration) with fallback to form_data
    phones = [
        r.get("phone") or r.get("form_data", {}).get("phone", "")
        for r in regs
        if r.get("phone") or r.get("form_data", {}).get("phone")
    ]
    emails = [r["email"] for r in regs if r.get("email")]

    sent_sms = 0
    sent_email = 0


    if body.channel in ("email", "both"):
        recipients = [{"email": e} for e in emails]
        send_bulk_email(recipients, f"Notification – {event.get('title', '')}", body.message)
        sent_email = len(emails)

    return {
        "message": "Notifications sent",
        "sms_sent": sent_sms,
        "email_sent": sent_email,
    }


@router.get("/overview", summary="Get overall registration stats across all events")
def get_overview(_admin=Depends(require_admin)):
    events = dynamo.list_events(status=None)
    total_registrations = 0
    events_with_counts = []
    for event in events:
        event_id = event.get("event_id", "")
        count = len(dynamo.get_event_registrations(event_id))
        total_registrations += count
        events_with_counts.append({"event_id": event_id, "registration_count": count})
    return {
        "total_registrations": total_registrations,
        "events_with_counts": events_with_counts,
    }


@router.get("/users", summary="List all users")
def list_users(_admin=Depends(require_admin)):
    table = dynamo._get_table()
    resp = table.query(
        IndexName="GSI2",
        KeyConditionExpression="entity_type = :et",
        ExpressionAttributeValues={":et": "USER"},
    )
    users = [dynamo._deserialize(i) for i in resp.get("Items", [])]
    return {
        "total": len(users),
        "users": [
            {
                "user_id": u.get("user_id", ""),
                "name": u.get("name", ""),
                "email": u.get("email", ""),
                "phone": u.get("phone", ""),
                "stream": u.get("stream", ""),
                "district": u.get("district", ""),
                "created_at": u.get("created_at", ""),
            }
            for u in users
        ],
    }
