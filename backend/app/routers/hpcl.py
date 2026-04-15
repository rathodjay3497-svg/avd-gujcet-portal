from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
import uuid

from app.models.hpcl import HPCLRegistrationRequest, HPCLRegistrationResponse, HPCLUpdateRequest
from app.services import dynamo
from app.services.twilio_service import send_registration_sms
from app.dependencies import require_admin
from app.config import get_settings

settings = get_settings()
router = APIRouter()

EVENT_ID = "hpcl-2026"

_GROUP_INITIALS = {
    "Suhradbhav": "SHB",
    "Bhoolku":    "BHK",
    "Samp":       "SMP",
    "Atmiya":     "ATM",
    "Dastav":     "DST",
    "Sarlata":    "SLT",
    "Swikar":     "SWK",
    "Ekta":       "EKT",
    "Mogri":      "MGR",
}


def _generate_hpcl_id(group: str) -> str:
    """Atomic counter → {GROUP_INITIALS}-hpcl-2026-{count:03d}."""
    table = dynamo._get_table()
    resp = table.update_item(
        Key={"PK": f"EVENT#{EVENT_ID}", "SK": "COUNTER"},
        UpdateExpression="ADD #cnt :inc",
        ExpressionAttributeNames={"#cnt": "count"},
        ExpressionAttributeValues={":inc": 1},
        ReturnValues="UPDATED_NEW",
    )
    count = int(resp["Attributes"]["count"])
    prefix = _GROUP_INITIALS.get(group, group[:3].upper())
    return f"{prefix}-hpcl-2026-{count:03d}"


@router.post(
    "/register",
    response_model=HPCLRegistrationResponse,
    status_code=201,
    summary="Register for HPCL - Hari Prabodham Cricket League 2026",
)
def register_hpcl(body: HPCLRegistrationRequest, background_tasks: BackgroundTasks):
    # 1. Duplicate phone check
    existing = dynamo.get_registration_by_phone(EVENT_ID, body.phone)
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Phone number is already registered for this event",
        )

    # 2. Synthetic email key
    email_key = f"{body.phone}@hpcl.local"

    # 3. Upsert lightweight user record
    profile = dynamo.get_user(email_key)
    if not profile:
        dynamo.upsert_user(
            email_key,
            {
                "user_id": f"usr_{uuid.uuid4().hex[:12]}",
                "name": body.name,
                "email": email_key,
                "phone": body.phone,
                "age": body.age,
                "address": body.address,
                "standard": body.standard,
                "playing_role": body.playing_role,
                "batting_style": body.batting_style or "",
                "bowling_style": body.bowling_style or "",
                "group": body.group,
                "reference": body.reference or "",
                "fees_paid": body.fees_paid,
                "paid_to": body.paid_to or "",
            },
        )

    # 4. Generate registration ID with group prefix
    reg_id = _generate_hpcl_id(body.group)

    # 5. Build form_data
    form_data = {
        "name": body.name,
        "phone": body.phone,
        "age": body.age,
        "address": body.address,
        "standard": body.standard,
        "playing_role": body.playing_role,
        "batting_style": body.batting_style or "",
        "bowling_style": body.bowling_style or "",
        "group": body.group,
        "reference": body.reference or "",
        "fees_paid": body.fees_paid,
        "paid_to": body.paid_to or "",
    }

    # 6. Save registration
    reg_data = {
        "registration_id": reg_id,
        "phone": body.phone,
        "form_data": form_data,
    }
    registration = dynamo.create_registration(EVENT_ID, email_key, reg_data)

    # 7. Optional SMS notification
    if settings.TWILIO_ACCOUNT_SID:
        background_tasks.add_task(
            send_registration_sms,
            body.phone,
            body.name,
            "HPCL - Hari Prabodham Cricket League 2026",
            reg_id,
            "",
            "",
        )

    return {
        "registration_id": registration.get("registration_id", reg_id),
        "event_id": EVENT_ID,
        "phone": body.phone,
        "form_data": registration.get("form_data", form_data),
        "status": registration.get("status", "confirmed"),
        "registered_at": registration.get("registered_at", ""),
    }


# ─── Admin endpoint ──────────────────────────────────────────────────────────

def _flatten_hpcl_reg(r: dict) -> dict:
    fd = r.get("form_data", {})
    return {
        "registration_id": r.get("registration_id", ""),
        "phone": r.get("phone") or fd.get("phone", ""),
        "name": fd.get("name", ""),
        "age": fd.get("age", ""),
        "address": fd.get("address", ""),
        "standard": fd.get("standard", ""),
        "playing_role": fd.get("playing_role", ""),
        "batting_style": fd.get("batting_style", ""),
        "bowling_style": fd.get("bowling_style", ""),
        "group": fd.get("group", ""),
        "reference": fd.get("reference", ""),
        "fees_paid": fd.get("fees_paid", False),
        "paid_to": fd.get("paid_to", ""),
        "status": r.get("status", "confirmed"),
        "registered_at": r.get("registered_at", ""),
    }


@router.get(
    "/admin/registrations",
    summary="Get all HPCL registrations (admin only)",
)
def get_hpcl_registrations(_admin=Depends(require_admin)):
    regs = dynamo.get_event_registrations(EVENT_ID)
    return {
        "event_id": EVENT_ID,
        "event_title": "HPCL - Hari Prabodham Cricket League 2026",
        "total": len(regs),
        "registrations": [_flatten_hpcl_reg(r) for r in regs],
    }


@router.patch(
    "/admin/registrations/{phone}",
    summary="Update HPCL registration (admin only)",
)
def update_hpcl_registration(
    phone: str,
    body: HPCLUpdateRequest,
    _admin=Depends(require_admin)
):
    email_key = f"{phone}@hpcl.local"
    
    updates = {}
    if body.fees_paid is not None:
        updates["form_data.fees_paid"] = body.fees_paid
    if body.paid_to is not None:
        updates["form_data.paid_to"] = body.paid_to

    if not updates:
        return {"message": "No changes provided"}

    updated = dynamo.update_registration_fields(EVENT_ID, email_key, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Registration not found")

    return _flatten_hpcl_reg(updated)


@router.delete(
    "/admin/registrations/{phone}",
    status_code=200,
    summary="Delete HPCL registration (admin only)",
)
def delete_hpcl_registration(phone: str, _admin=Depends(require_admin)):
    email_key = f"{phone}@hpcl.local"
    deleted = dynamo.delete_registration(EVENT_ID, email_key)
    if not deleted:
        raise HTTPException(status_code=404, detail="Registration not found")
    return {"message": f"Registration for {phone} deleted successfully"}
