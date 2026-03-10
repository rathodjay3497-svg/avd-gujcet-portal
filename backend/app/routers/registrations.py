from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from typing import List

from app.dependencies import get_current_user
from app.models.registration import RegistrationCreate, RegistrationResponse, RegistrationCheckResponse
from app.services import dynamo
from app.services.id_generator import generate_registration_id
from app.services.twilio_service import send_registration_sms
from app.services.email_service import send_registration_email
from app.config import get_settings

settings = get_settings()
router = APIRouter()


@router.post("/{event_id}", response_model=RegistrationResponse, status_code=201, summary="Register for an event (full form)")
def register_form(event_id: str, body: RegistrationCreate, background_tasks: BackgroundTasks):
    # 1. Fetch event
    event = dynamo.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.get("status") != "active":
        raise HTTPException(status_code=400, detail="Event is not active")
    if event.get("registration_type") != "full_form":
        raise HTTPException(status_code=400, detail="This event requires login-based registration")

    # 2. Check duplicate
    existing = dynamo.get_registration(event_id, body.phone)
    if existing:
        raise HTTPException(status_code=409, detail="Already registered for this event")

    # 3. Generate registration ID
    reg_id = generate_registration_id(event_id)

    # 4. Upsert user profile from form data
    user_data = {
        "user_id": f"usr_{body.phone}",
        "name": body.form_data.get("name", ""),
        "email": body.form_data.get("email", ""),
        "phone": body.phone,
        "stream": body.form_data.get("stream", ""),
        "district": body.form_data.get("district", ""),
        "school_college": body.form_data.get("school", body.form_data.get("school_college", "")),
    }
    dynamo.upsert_user(body.phone, user_data)

    # 5. Save registration
    reg_data = {
        "registration_id": reg_id,
        "user_id": user_data["user_id"],
        "form_data": body.form_data,
    }
    registration = dynamo.create_registration(event_id, body.phone, reg_data)

    # 6. Send notifications asynchronously
    if settings.TWILIO_ACCOUNT_SID:
        background_tasks.add_task(
            send_registration_sms,
            body.phone,
            body.form_data.get("name", "Student"),
            event.get("title", ""),
            reg_id,
            event.get("event_date", ""),
            event.get("venue", ""),
        )

    email = body.form_data.get("email")
    if email:
        background_tasks.add_task(
            send_registration_email,
            email,
            body.form_data.get("name", "Student"),
            event.get("title", ""),
            reg_id,
            event.get("event_date", ""),
            event.get("venue", ""),
        )

    return _format_registration(registration)


@router.post("/{event_id}/click", response_model=RegistrationResponse, status_code=201, summary="One-click registration (requires login)")
def register_click(event_id: str, background_tasks: BackgroundTasks, user=Depends(get_current_user)):
    # 1. Fetch event
    event = dynamo.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.get("status") != "active":
        raise HTTPException(status_code=400, detail="Event is not active")
    if event.get("registration_type") != "click_to_register":
        raise HTTPException(status_code=400, detail="This event requires form registration")

    phone = user["sub"]

    # 2. Fetch student profile
    profile = dynamo.get_user(phone)
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found. Please complete your profile first.")

    # 3. Check duplicate
    existing = dynamo.get_registration(event_id, phone)
    if existing:
        raise HTTPException(status_code=409, detail="Already registered for this event")

    # 4. Generate registration ID
    reg_id = generate_registration_id(event_id)

    # 5. Build form_data from profile
    form_data = {
        "name": profile.get("name", ""),
        "phone": phone,
        "email": profile.get("email", ""),
        "stream": profile.get("stream", ""),
        "district": profile.get("district", ""),
        "school": profile.get("school_college", ""),
    }

    # 6. Save registration
    reg_data = {
        "registration_id": reg_id,
        "user_id": profile.get("user_id", ""),
        "form_data": form_data,
    }
    registration = dynamo.create_registration(event_id, phone, reg_data)

    # 7. Send notifications
    if settings.TWILIO_ACCOUNT_SID:
        background_tasks.add_task(
            send_registration_sms, phone, form_data["name"],
            event.get("title", ""), reg_id, event.get("event_date", ""), event.get("venue", ""),
        )
    if form_data.get("email"):
        background_tasks.add_task(
            send_registration_email, form_data["email"], form_data["name"],
            event.get("title", ""), reg_id, event.get("event_date", ""), event.get("venue", ""),
        )

    return _format_registration(registration)


@router.get("/me", response_model=List[RegistrationResponse], summary="Get current student's registrations")
def my_registrations(user=Depends(get_current_user)):
    phone = user["sub"]
    regs = dynamo.get_user_registrations(phone)
    return [_format_registration(r) for r in regs]


@router.get("/{event_id}/check", response_model=RegistrationCheckResponse, summary="Check if logged-in user is registered")
def check_registration(event_id: str, user=Depends(get_current_user)):
    phone = user["sub"]
    reg = dynamo.get_registration(event_id, phone)
    if reg:
        return {"registered": True, "registration_id": reg.get("registration_id")}
    return {"registered": False}


def _format_registration(reg: dict) -> dict:
    return {
        "registration_id": reg.get("registration_id", ""),
        "event_id": reg.get("event_id", ""),
        "phone": reg.get("phone", ""),
        "form_data": reg.get("form_data", {}),
        "status": reg.get("status", "confirmed"),
        "registered_at": reg.get("registered_at", ""),
    }
