from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from typing import List
import uuid

from app.dependencies import get_current_user
from app.models.registration import RegistrationCreate, RegistrationResponse, RegistrationCheckResponse, PublicRegistrationRequest
from app.services import dynamo
from app.services.id_generator import generate_registration_id
from app.services.twilio_service import send_registration_sms
from app.services.email_service import send_registration_email
from app.config import get_settings

settings = get_settings()
router = APIRouter()


@router.post("/{event_id}", response_model=RegistrationResponse, status_code=201, summary="Register for an event (full form)")
def register_form(event_id: str, body: RegistrationCreate, background_tasks: BackgroundTasks, user=Depends(get_current_user)):
    email = user["sub"]

    # 1. Fetch event
    event = dynamo.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.get("status") != "active":
        raise HTTPException(status_code=400, detail="Event is not active")
    if event.get("registration_type") != "full_form":
        raise HTTPException(status_code=400, detail="This event requires login-based registration")

    # 2. Fetch student profile and validate phone is set
    profile = dynamo.get_user(email)
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found. Please complete your profile first.")
    if not profile.get("phone"):
        raise HTTPException(status_code=400, detail="Please add your mobile number in your profile before registering.")

    # 3. Check duplicate
    existing = dynamo.get_registration(event_id, email)
    if existing:
        raise HTTPException(status_code=409, detail="Already registered for this event")

    # 4. Generate registration ID
    reg_id = generate_registration_id(event_id)

    # 5. Save registration (phone stored at top-level for admin queries)
    reg_data = {
        "registration_id": reg_id,
        "user_id": profile.get("user_id", ""),
        "phone": profile.get("phone", ""),
        "form_data": body.form_data,
    }
    registration = dynamo.create_registration(event_id, email, reg_data)

    # 6. Send notifications asynchronously
    phone = profile.get("phone", "")
    if phone and settings.TWILIO_ACCOUNT_SID:
        background_tasks.add_task(
            send_registration_sms,
            phone,
            profile.get("name", "Student"),
            event.get("title", ""),
            reg_id,
            event.get("event_date", ""),
            event.get("venue", ""),
        )

    background_tasks.add_task(
        send_registration_email,
        email,
        profile.get("name", "Student"),
        event.get("title", ""),
        reg_id,
        event.get("event_date", ""),
        event.get("venue", ""),
    )

    return _format_registration(registration)


@router.post("/{event_id}/click", response_model=RegistrationResponse, status_code=201, summary="One-click registration (requires login)")
def register_click(event_id: str, background_tasks: BackgroundTasks, user=Depends(get_current_user)):
    email = user["sub"]

    # 1. Fetch event
    event = dynamo.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.get("status") != "active":
        raise HTTPException(status_code=400, detail="Event is not active")
    if event.get("registration_type") != "click_to_register":
        raise HTTPException(status_code=400, detail="This event requires form registration")

    # 2. Fetch student profile
    profile = dynamo.get_user(email)
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found. Please complete your profile first.")
    if not profile.get("phone"):
        raise HTTPException(status_code=400, detail="Please add your mobile number in your profile before registering.")

    # 3. Check duplicate
    existing = dynamo.get_registration(event_id, email)
    if existing:
        raise HTTPException(status_code=409, detail="Already registered for this event")

    # 4. Generate registration ID
    reg_id = generate_registration_id(event_id)

    # 5. Build form_data from profile
    form_data = {
        "name": profile.get("name", ""),
        "phone": profile.get("phone", ""),
        "email": email,
        "stream": profile.get("stream", ""),
        "district": profile.get("district", ""),
        "school": profile.get("school_college", ""),
    }

    # 6. Save registration (phone stored at top-level for admin queries)
    reg_data = {
        "registration_id": reg_id,
        "user_id": profile.get("user_id", ""),
        "phone": profile.get("phone", ""),
        "form_data": form_data,
    }
    registration = dynamo.create_registration(event_id, email, reg_data)

    # 7. Send notifications
    phone = profile.get("phone", "")
    if phone and settings.TWILIO_ACCOUNT_SID:
        background_tasks.add_task(
            send_registration_sms, phone, form_data["name"],
            event.get("title", ""), reg_id, event.get("event_date", ""), event.get("venue", ""),
        )
    background_tasks.add_task(
        send_registration_email, email, form_data["name"],
        event.get("title", ""), reg_id, event.get("event_date", ""), event.get("venue", ""),
    )

    return _format_registration(registration)


@router.get("/me", response_model=List[RegistrationResponse], summary="Get current student's registrations")
def my_registrations(user=Depends(get_current_user)):
    email = user["sub"]
    regs = dynamo.get_user_registrations(email)
    return [_format_registration(r) for r in regs]


@router.get("/{event_id}/check", response_model=RegistrationCheckResponse, summary="Check if logged-in user is registered")
def check_registration(event_id: str, user=Depends(get_current_user)):
    email = user["sub"]
    reg = dynamo.get_registration(event_id, email)
    if reg:
        return {"registered": True, "registration_id": reg.get("registration_id")}
    return {"registered": False}


def _format_registration(reg: dict) -> dict:
    return {
        "registration_id": reg.get("registration_id", ""),
        "event_id": reg.get("event_id", ""),
        "email": reg.get("email", ""),
        "form_data": reg.get("form_data", {}),
        "status": reg.get("status", "confirmed"),
        "registered_at": reg.get("registered_at", ""),
    }


# ─── Public (no-auth) Registration ──────────────────────────────────────────

@router.post(
    "/{event_id}/public",
    response_model=RegistrationResponse,
    status_code=201,
    summary="Public registration — no login required",
)
def register_public(
    event_id: str,
    body: PublicRegistrationRequest,
    background_tasks: BackgroundTasks,
):
    # 1. Fetch event
    event = dynamo.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.get("status") != "active":
        raise HTTPException(status_code=400, detail="Event is not currently active")

    # 2. Duplicate phone check
    existing_phone = dynamo.get_registration_by_phone(event_id, body.phone)
    if existing_phone:
        raise HTTPException(
            status_code=409,
            detail="Phone number is already registered for this event",
        )

    # 3. Synthetic email key (phone@noemail.local) used as DynamoDB SK
    email_key = body.email if body.email else f"{body.phone}@noemail.local"

    # 4. Duplicate email check (if real email provided)
    if body.email:
        existing_email = dynamo.get_registration(event_id, body.email)
        if existing_email:
            raise HTTPException(
                status_code=409,
                detail="This email is already registered for this event",
            )

    # 5. Ensure a lightweight user record exists (keyed by email_key)
    profile = dynamo.get_user(email_key)
    if not profile:
        profile = dynamo.upsert_user(
            email_key,
            {
                "user_id": f"usr_{uuid.uuid4().hex[:12]}",
                "name": body.name,
                "email": email_key,
                "phone": body.phone,
                "gender": body.gender,
                "school_college": body.school_college,
                "stream": body.stream,
                "medium": body.medium,
                "address": body.address,
            },
        )

    # 6. Generate registration ID
    reg_id = generate_registration_id(event_id)

    # 7. Build form_data
    form_data = {
        "name": body.name,
        "phone": body.phone,
        "email": body.email or "",
        "gender": body.gender,
        "school_college": body.school_college,
        "stream": body.stream,
        "medium": body.medium,
        "address": body.address,
    }

    # 8. Save registration
    reg_data = {
        "registration_id": reg_id,
        "user_id": profile.get("user_id", ""),
        "phone": body.phone,
        "form_data": form_data,
    }
    registration = dynamo.create_registration(event_id, email_key, reg_data)

    # 9. Send SMS notification (best-effort)
    if body.phone and settings.TWILIO_ACCOUNT_SID:
        background_tasks.add_task(
            send_registration_sms,
            body.phone,
            body.name,
            event.get("title", ""),
            reg_id,
            event.get("event_date", ""),
            event.get("venue", ""),
        )

    # 10. Send email notification (best-effort, only if real email supplied)
    if body.email:
        background_tasks.add_task(
            send_registration_email,
            body.email,
            body.name,
            event.get("title", ""),
            reg_id,
            event.get("event_date", ""),
            event.get("venue", ""),
        )

    return _format_registration(registration)
