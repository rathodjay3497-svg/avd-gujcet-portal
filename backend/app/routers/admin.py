import csv
import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional

from app.dependencies import require_admin
from app.models.registration import BulkNotifyRequest
from app.services import dynamo
from app.services.twilio_service import send_bulk_sms
from app.services.email_service import send_bulk_email
from app.config import get_settings

settings = get_settings()
router = APIRouter()


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
        "registrations": [
            {
                "registration_id": r.get("registration_id", ""),
                "phone": r.get("phone", ""),
                "form_data": r.get("form_data", {}),
                "status": r.get("status", "confirmed"),
                "registered_at": r.get("registered_at", ""),
                "pdf_url": r.get("pdf_url", ""),
            }
            for r in regs
        ],
    }


@router.get("/registrations/{event_id}/export", summary="Export registrations as CSV")
def export_registrations(event_id: str, _admin=Depends(require_admin)):
    event = dynamo.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    regs = dynamo.get_event_registrations(event_id)

    # Build CSV
    output = io.StringIO()
    writer = csv.writer(output)

    # Collect all form_data keys for headers
    all_keys = set()
    for r in regs:
        all_keys.update(r.get("form_data", {}).keys())
    all_keys = sorted(all_keys)

    headers = ["Registration ID", "Phone", "Status", "Registered At"] + all_keys
    writer.writerow(headers)

    for r in regs:
        form_data = r.get("form_data", {})
        row = [
            r.get("registration_id", ""),
            r.get("phone", ""),
            r.get("status", ""),
            r.get("registered_at", ""),
        ] + [form_data.get(k, "") for k in all_keys]
        writer.writerow(row)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={event_id}-registrations.csv"},
    )


@router.get("/stats/{event_id}", summary="Get registration statistics")
def get_stats(event_id: str, _admin=Depends(require_admin)):
    event = dynamo.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    regs = dynamo.get_event_registrations(event_id)

    # Stream breakdown
    stream_counts = {}
    district_counts = {}
    for r in regs:
        form_data = r.get("form_data", {})
        stream = form_data.get("stream", "Unknown")
        district = form_data.get("district", "Unknown")
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

    # Apply filters
    if body.filter_stream:
        regs = [r for r in regs if r.get("form_data", {}).get("stream") == body.filter_stream]
    if body.filter_district:
        regs = [r for r in regs if r.get("form_data", {}).get("district") == body.filter_district]

    phones = [r["phone"] for r in regs if r.get("phone")]
    recipients = [
        {"email": r.get("form_data", {}).get("email")}
        for r in regs
        if r.get("form_data", {}).get("email")
    ]

    sent_sms = 0
    sent_email = 0

    if body.channel in ("sms", "both") and settings.TWILIO_ACCOUNT_SID:
        send_bulk_sms(phones, body.message)
        sent_sms = len(phones)

    if body.channel in ("email", "both"):
        send_bulk_email(recipients, f"Notification - {event.get('title', '')}", body.message)
        sent_email = len(recipients)

    return {
        "message": "Notifications sent",
        "sms_sent": sent_sms,
        "email_sent": sent_email,
    }


@router.get("/users", summary="List all users")
def list_users(_admin=Depends(require_admin)):
    # Use GSI2 to query all users
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
                "phone": u.get("phone", ""),
                "email": u.get("email", ""),
                "stream": u.get("stream", ""),
                "district": u.get("district", ""),
                "created_at": u.get("created_at", ""),
            }
            for u in users
        ],
    }
