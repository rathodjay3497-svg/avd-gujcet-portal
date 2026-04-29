from fastapi import APIRouter, HTTPException, Depends
from typing import List

from app.dependencies import require_admin
from app.models.helpdesk import (
    HelpDeskEntryCreate,
    HelpDeskEntryUpdate,
    HelpDeskEntryResponse,
    HelpDeskSettings,
)
from app.services import dynamo

router = APIRouter()


# ─── Public Endpoint ─────────────────────────────────────────────────────────

@router.get(
    "/entries",
    summary="List all help-desk admission entries (public)",
    response_model=List[HelpDeskEntryResponse],
)
def list_entries():
    """Returns all help-desk entries sorted by sort_order ascending."""
    items = dynamo.list_helpdesk_entries()
    return items


@router.get(
    "/settings",
    summary="Get help-desk settings (public)",
    response_model=HelpDeskSettings,
)
def get_settings():
    """Returns global help-desk settings like default sort order."""
    return dynamo.get_helpdesk_settings()


# ─── Admin Endpoints (require_admin) ─────────────────────────────────────────

@router.post(
    "/entries",
    summary="Create a new help-desk entry (admin only)",
    response_model=HelpDeskEntryResponse,
    status_code=201,
)
def create_entry(body: HelpDeskEntryCreate, _admin=Depends(require_admin)):
    """Create a new admission help-desk entry."""
    data = body.model_dump()
    entry = dynamo.create_helpdesk_entry(data)
    return entry


@router.put(
    "/entries/{entry_id}",
    summary="Update a help-desk entry (admin only)",
    response_model=HelpDeskEntryResponse,
)
def update_entry(entry_id: str, body: HelpDeskEntryUpdate, _admin=Depends(require_admin)):
    """Replace updatable fields of an existing help-desk entry."""
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    updated = dynamo.update_helpdesk_entry(entry_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Entry not found")
    return updated


@router.delete(
    "/entries/{entry_id}",
    summary="Delete a help-desk entry (admin only)",
    status_code=200,
)
def delete_entry(entry_id: str, _admin=Depends(require_admin)):
    """Permanently delete a help-desk entry."""
    deleted = dynamo.delete_helpdesk_entry(entry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": f"Entry {entry_id} deleted successfully"}


@router.put(
    "/settings",
    summary="Update help-desk settings (admin only)",
    response_model=HelpDeskSettings,
)
def update_settings(body: HelpDeskSettings, _admin=Depends(require_admin)):
    """Update global help-desk settings."""
    return dynamo.update_helpdesk_settings(body.model_dump())
