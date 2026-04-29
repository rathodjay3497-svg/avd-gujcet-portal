import boto3
import json
from decimal import Decimal
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

from app.config import get_settings
from app.logger import dynamo_logger, get_request_id

settings = get_settings()


def _get_table():
    if settings.DYNAMODB_ENDPOINT_URL:
        dynamodb = boto3.resource(
            "dynamodb",
            region_name=settings.AWS_REGION,
            endpoint_url=settings.DYNAMODB_ENDPOINT_URL,
            aws_access_key_id="dummy",  # Required for local but ignored
            aws_secret_access_key="dummy"  # Required for local but ignored
        )
    else:
        # No credentials passed — boto3 automatically uses the Lambda IAM execution role.
        dynamodb = boto3.resource("dynamodb", region_name=settings.AWS_REGION)
    return dynamodb.Table(settings.DYNAMODB_TABLE_NAME)


def _serialize(obj: Any) -> Any:
    """Convert Python types to DynamoDB-safe types."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_serialize(i) for i in obj]
    return obj


def _deserialize(obj: Any) -> Any:
    """Convert DynamoDB types back to standard Python types."""
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    if isinstance(obj, dict):
        return {k: _deserialize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_deserialize(i) for i in obj]
    return obj


# ─── User Operations ────────────────────────────────────────────

def get_user(email: str) -> Optional[Dict]:
    request_id = get_request_id()
    dynamo_logger.debug(f"Getting user: {email}", request_id=request_id)
    try:
        table = _get_table()
        resp = table.get_item(Key={"PK": f"USER#{email}", "SK": "PROFILE"})
        item = resp.get("Item")
        result = _deserialize(item) if item else None
        if result:
            dynamo_logger.info(f"User found: {email}", request_id=request_id)
        else:
            dynamo_logger.debug(f"User not found: {email}", request_id=request_id)
        return result
    except Exception as e:
        dynamo_logger.error(f"Error getting user {email}: {str(e)}", request_id=request_id, exc_info=True)
        raise


def upsert_user(email: str, data: Dict) -> Dict:
    request_id = get_request_id()
    dynamo_logger.info(f"Upserting user: {email}", request_id=request_id)
    try:
        table = _get_table()
        now = datetime.now(timezone.utc).isoformat()
        item = {
            "PK": f"USER#{email}",
            "SK": "PROFILE",
            "entity_type": "USER",
            "email": email,
            "created_at": now,
            **_serialize(data),
        }
        table.put_item(Item=item)
        dynamo_logger.info(f"User upserted successfully: {email}", request_id=request_id)
        return _deserialize(item)
    except Exception as e:
        dynamo_logger.error(f"Error upserting user {email}: {str(e)}", request_id=request_id, exc_info=True)
        raise


# ─── Event Operations ───────────────────────────────────────────

def create_event(data: Dict) -> Dict:
    request_id = get_request_id()
    event_id = data.get("event_id", "unknown")
    dynamo_logger.info(f"Creating event: {event_id}", request_id=request_id)
    try:
        table = _get_table()
        now = datetime.now(timezone.utc).isoformat()
        item = {
            "PK": f"EVENT#{event_id}",
            "SK": "METADATA",
            "entity_type": "EVENT",
            "seat_filled": 0,
            "created_at": now,
            **_serialize(data),
        }
        table.put_item(Item=item)
        dynamo_logger.info(f"Event created successfully: {event_id}", request_id=request_id)
        return _deserialize(item)
    except Exception as e:
        dynamo_logger.error(f"Error creating event {event_id}: {str(e)}", request_id=request_id, exc_info=True)
        raise


def get_event(event_id: str) -> Optional[Dict]:
    request_id = get_request_id()
    dynamo_logger.debug(f"Getting event: {event_id}", request_id=request_id)
    try:
        table = _get_table()
        resp = table.get_item(Key={"PK": f"EVENT#{event_id}", "SK": "METADATA"})
        item = resp.get("Item")
        result = _deserialize(item) if item else None
        if result:
            dynamo_logger.debug(f"Event found: {event_id}", request_id=request_id)
        else:
            dynamo_logger.debug(f"Event not found: {event_id}", request_id=request_id)
        return result
    except Exception as e:
        dynamo_logger.error(f"Error getting event {event_id}: {str(e)}", request_id=request_id, exc_info=True)
        raise


def list_events(status: Optional[str] = None) -> List[Dict]:
    request_id = get_request_id()
    dynamo_logger.debug(f"Listing events with status filter: {status}", request_id=request_id)
    try:
        table = _get_table()
        resp = table.query(
            IndexName="GSI2",
            KeyConditionExpression="entity_type = :et",
            ExpressionAttributeValues={":et": "EVENT"},
            ScanIndexForward=False,
        )
        items = [_deserialize(i) for i in resp.get("Items", [])]
        if status:
            items = [i for i in items if i.get("status") == status]
        dynamo_logger.info(f"Found {len(items)} events", request_id=request_id)
        return items
    except Exception as e:
        dynamo_logger.error(f"Error listing events: {str(e)}", request_id=request_id, exc_info=True)
        raise


def update_event(event_id: str, updates: Dict) -> Optional[Dict]:
    request_id = get_request_id()
    dynamo_logger.info(f"Updating event: {event_id}", request_id=request_id, extra={"updates": list(updates.keys())})
    try:
        table = _get_table()
        updates = _serialize(updates)

        expr_parts = []
        attr_names = {}
        attr_values = {}
        for idx, (key, val) in enumerate(updates.items()):
            placeholder = f"#k{idx}"
            value_ph = f":v{idx}"
            expr_parts.append(f"{placeholder} = {value_ph}")
            attr_names[placeholder] = key
            attr_values[value_ph] = val

        if not expr_parts:
            return get_event(event_id)

        resp = table.update_item(
            Key={"PK": f"EVENT#{event_id}", "SK": "METADATA"},
            UpdateExpression="SET " + ", ".join(expr_parts),
            ExpressionAttributeNames=attr_names,
            ExpressionAttributeValues=attr_values,
            ReturnValues="ALL_NEW",
        )
        dynamo_logger.info(f"Event updated successfully: {event_id}", request_id=request_id)
        return _deserialize(resp.get("Attributes"))
    except Exception as e:
        dynamo_logger.error(f"Error updating event {event_id}: {str(e)}", request_id=request_id, exc_info=True)
        raise


def delete_event(event_id: str) -> bool:
    """Delete an event record permanently."""
    request_id = get_request_id()
    dynamo_logger.info(f"Deleting event: {event_id}", request_id=request_id)
    try:
        table = _get_table()
        resp = table.delete_item(
            Key={"PK": f"EVENT#{event_id}", "SK": "METADATA"},
            ReturnValues="ALL_OLD",
        )
        deleted = bool(resp.get("Attributes"))
        if deleted:
            dynamo_logger.info(f"Event deleted successfully: {event_id}", request_id=request_id)
        else:
            dynamo_logger.warning(f"Event not found for deletion: {event_id}", request_id=request_id)
        return deleted
    except Exception as e:
        dynamo_logger.error(f"Error deleting event {event_id}: {str(e)}", request_id=request_id, exc_info=True)
        raise


def increment_seat(event_id: str) -> int:
    """Atomically increment seat_filled. Returns the new count."""
    request_id = get_request_id()
    dynamo_logger.debug(f"Incrementing seat for event: {event_id}", request_id=request_id)
    try:
        table = _get_table()
        resp = table.update_item(
            Key={"PK": f"EVENT#{event_id}", "SK": "METADATA"},
            UpdateExpression="ADD seat_filled :inc",
            ExpressionAttributeValues={":inc": 1},
            ReturnValues="UPDATED_NEW",
        )
        new_count = int(resp["Attributes"]["seat_filled"])
        dynamo_logger.info(f"Seat incremented for event {event_id}, new count: {new_count}", request_id=request_id)
        return new_count
    except Exception as e:
        dynamo_logger.error(f"Error incrementing seat for event {event_id}: {str(e)}", request_id=request_id, exc_info=True)
        raise


# ─── Registration Operations ────────────────────────────────────

def create_registration(event_id: str, email: str, data: Dict) -> Dict:
    request_id = get_request_id()
    dynamo_logger.info(f"Creating registration for event: {event_id}, email: {email}", request_id=request_id)
    try:
        table = _get_table()
        now = datetime.now(timezone.utc).isoformat()
        item = {
            "PK": f"EVENT#{event_id}",
            "SK": f"REG#{email}",
            "entity_type": "REGISTRATION",
            "event_id": event_id,
            "email": email,
            "registered_at": now,
            "status": "confirmed",
            # GSI1: query registrations by user
            "GSI1PK": f"USER#{email}",
            "GSI1SK": f"REG#{event_id}",
            **_serialize(data),
        }
        table.put_item(Item=item)
        dynamo_logger.info(f"Registration created successfully for event: {event_id}, email: {email}", request_id=request_id)
        return _deserialize(item)
    except Exception as e:
        dynamo_logger.error(f"Error creating registration for event {event_id}, email {email}: {str(e)}", request_id=request_id, exc_info=True)
        raise


def get_registration(event_id: str, email: str) -> Optional[Dict]:
    request_id = get_request_id()
    dynamo_logger.debug(f"Getting registration for event: {event_id}, email: {email}", request_id=request_id)
    try:
        table = _get_table()
        resp = table.get_item(Key={"PK": f"EVENT#{event_id}", "SK": f"REG#{email}"})
        item = resp.get("Item")
        result = _deserialize(item) if item else None
        if result:
            dynamo_logger.debug(f"Registration found for event: {event_id}, email: {email}", request_id=request_id)
        else:
            dynamo_logger.debug(f"No registration found for event: {event_id}, email: {email}", request_id=request_id)
        return result
    except Exception as e:
        dynamo_logger.error(f"Error getting registration for event {event_id}, email {email}: {str(e)}", request_id=request_id, exc_info=True)
        raise


def get_user_registrations(email: str) -> List[Dict]:
    request_id = get_request_id()
    dynamo_logger.debug(f"Getting registrations for user: {email}", request_id=request_id)
    try:
        table = _get_table()
        resp = table.query(
            IndexName="GSI1",
            KeyConditionExpression="GSI1PK = :pk",
            ExpressionAttributeValues={":pk": f"USER#{email}"},
        )
        items = [_deserialize(i) for i in resp.get("Items", [])]
        dynamo_logger.info(f"Found {len(items)} registrations for user: {email}", request_id=request_id)
        return items
    except Exception as e:
        dynamo_logger.error(f"Error getting registrations for user {email}: {str(e)}", request_id=request_id, exc_info=True)
        raise


def get_event_registrations(event_id: str) -> List[Dict]:
    request_id = get_request_id()
    dynamo_logger.debug(f"Getting registrations for event: {event_id}", request_id=request_id)
    try:
        table = _get_table()
        resp = table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :prefix)",
            ExpressionAttributeValues={
                ":pk": f"EVENT#{event_id}",
                ":prefix": "REG#",
            },
        )
        items = [_deserialize(i) for i in resp.get("Items", [])]
        dynamo_logger.info(f"Found {len(items)} registrations for event: {event_id}", request_id=request_id)
        return items
    except Exception as e:
        dynamo_logger.error(f"Error getting registrations for event {event_id}: {str(e)}", request_id=request_id, exc_info=True)
        raise


def update_registration_fields(event_id: str, email: str, updates: Dict) -> Optional[Dict]:
    request_id = get_request_id()
    dynamo_logger.info(f"Updating registration: {event_id}/{email}", request_id=request_id, extra={"updates": list(updates.keys())})
    try:
        table = _get_table()
        updates = _serialize(updates)

        expr_parts = []
        attr_names = {}
        attr_values = {}
        for idx, (key, val) in enumerate(updates.items()):
            # Handle nested form_data updates if key starts with "form_data."
            if key.startswith("form_data."):
                inner_key = key.split(".", 1)[1]
                placeholder = f"#fd"
                inner_placeholder = f"#k{idx}"
                value_ph = f":v{idx}"
                expr_parts.append(f"{placeholder}.{inner_placeholder} = {value_ph}")
                attr_names[placeholder] = "form_data"
                attr_names[inner_placeholder] = inner_key
                attr_values[value_ph] = val
            else:
                placeholder = f"#k{idx}"
                value_ph = f":v{idx}"
                expr_parts.append(f"{placeholder} = {value_ph}")
                attr_names[placeholder] = key
                attr_values[value_ph] = val

        if not expr_parts:
            return get_registration(event_id, email)

        resp = table.update_item(
            Key={"PK": f"EVENT#{event_id}", "SK": f"REG#{email}"},
            UpdateExpression="SET " + ", ".join(expr_parts),
            ExpressionAttributeNames=attr_names,
            ExpressionAttributeValues=attr_values,
            ReturnValues="ALL_NEW",
        )
        dynamo_logger.info(f"Registration updated successfully: {event_id}/{email}", request_id=request_id)
        return _deserialize(resp.get("Attributes"))
    except Exception as e:
        dynamo_logger.error(f"Error updating registration {event_id}/{email}: {str(e)}", request_id=request_id, exc_info=True)
        raise


def delete_registration(event_id: str, email: str) -> bool:
    """Delete a registration record. Returns True if deleted, False if not found."""
    request_id = get_request_id()
    dynamo_logger.info(f"Deleting registration: {event_id}/{email}", request_id=request_id)
    try:
        table = _get_table()
        resp = table.delete_item(
            Key={"PK": f"EVENT#{event_id}", "SK": f"REG#{email}"},
            ReturnValues="ALL_OLD",
        )
        deleted = bool(resp.get("Attributes"))
        if deleted:
            dynamo_logger.info(f"Registration deleted successfully: {event_id}/{email}", request_id=request_id)
        else:
            dynamo_logger.warning(f"Registration not found for deletion: {event_id}/{email}", request_id=request_id)
        return deleted
    except Exception as e:
        dynamo_logger.error(f"Error deleting registration {event_id}/{email}: {str(e)}", request_id=request_id, exc_info=True)
        raise


def get_registration_by_phone(event_id: str, phone: str) -> Optional[Dict]:

    """Check if a phone number is already registered for an event."""
    request_id = get_request_id()
    dynamo_logger.debug(f"Checking phone duplicate for event: {event_id}, phone: {phone}", request_id=request_id)
    try:
        registrations = get_event_registrations(event_id)
        for reg in registrations:
            form_data = reg.get("form_data", {})
            if form_data.get("phone") == phone or reg.get("phone") == phone:
                dynamo_logger.info(f"Phone duplicate found for event: {event_id}, phone: {phone}", request_id=request_id)
                return reg
        return None
    except Exception as e:
        dynamo_logger.error(f"Error checking phone duplicate for event {event_id}: {str(e)}", request_id=request_id, exc_info=True)
        raise


# ─── Registration Counter ───────────────────────────────────────

def get_next_registration_id(event_id: str) -> str:
    """Generate next registration ID using an atomic counter."""
    request_id = get_request_id()
    dynamo_logger.debug(f"Generating next registration ID for event: {event_id}", request_id=request_id)
    try:
        table = _get_table()
        resp = table.update_item(
            Key={"PK": f"EVENT#{event_id}", "SK": "COUNTER"},
            UpdateExpression="ADD #cnt :inc",
            ExpressionAttributeNames={"#cnt": "count"},
            ExpressionAttributeValues={":inc": 1},
            ReturnValues="UPDATED_NEW",
        )
        count = int(resp["Attributes"]["count"]) # count fetch from backend
        reg_id = f"AHD-{event_id}-{count:05d}"
        dynamo_logger.info(f"Generated registration ID: {reg_id}", request_id=request_id)
        return reg_id
    except Exception as e:
        dynamo_logger.error(f"Error generating registration ID for event {event_id}: {str(e)}", request_id=request_id, exc_info=True)
        raise


# ─── Help Desk Operations ───────────────────────────────────────

def _get_helpdesk_table():
    """Return a boto3 Table resource for the help-desk-entries table."""
    if settings.DYNAMODB_ENDPOINT_URL:
        dynamodb = boto3.resource(
            "dynamodb",
            region_name=settings.AWS_REGION,
            endpoint_url=settings.DYNAMODB_ENDPOINT_URL,
            aws_access_key_id="dummy",
            aws_secret_access_key="dummy",
        )
    else:
        dynamodb = boto3.resource("dynamodb", region_name=settings.AWS_REGION)
    return dynamodb.Table(settings.HELPDESK_TABLE_NAME)


def list_helpdesk_entries() -> List[Dict]:
    """Scan all help-desk entries and return them sorted by sort_order ascending."""
    request_id = get_request_id()
    dynamo_logger.debug("Listing help-desk entries", request_id=request_id)
    try:
        table = _get_helpdesk_table()
        resp = table.scan()
        items = [_deserialize(i) for i in resp.get("Items", [])]
        # Continue scanning if results are paginated
        while "LastEvaluatedKey" in resp:
            resp = table.scan(ExclusiveStartKey=resp["LastEvaluatedKey"])
            items.extend([_deserialize(i) for i in resp.get("Items", [])])
        items.sort(key=lambda x: (x.get("sort_order", 0), x.get("created_at", "")))
        dynamo_logger.info(f"Found {len(items)} help-desk entries", request_id=request_id)
        return items
    except Exception as e:
        dynamo_logger.error(f"Error listing help-desk entries: {str(e)}", request_id=request_id, exc_info=True)
        raise


def create_helpdesk_entry(data: Dict) -> Dict:
    """Create a new help-desk entry. Generates a UUID entry_id automatically."""
    import uuid as _uuid
    request_id = get_request_id()
    entry_id = str(_uuid.uuid4())
    dynamo_logger.info(f"Creating help-desk entry: {entry_id}", request_id=request_id)
    try:
        table = _get_helpdesk_table()
        now = datetime.now(timezone.utc).isoformat()
        item = {
            "entry_id": entry_id,
            "body": data.get("body", ""),
            "course": data.get("course", ""),
            "eligibility": data.get("eligibility", ""),
            "start_date": data.get("start_date", ""),
            "end_date": data.get("end_date", ""),
            "link": data.get("link", ""),
            "link2": data.get("link2", ""),
            "sort_order": _serialize(data.get("sort_order", 0)),
            "created_at": now,
            "updated_at": now,
        }
        table.put_item(Item=item)
        dynamo_logger.info(f"Help-desk entry created: {entry_id}", request_id=request_id)
        return _deserialize(item)
    except Exception as e:
        dynamo_logger.error(f"Error creating help-desk entry: {str(e)}", request_id=request_id, exc_info=True)
        raise


def update_helpdesk_entry(entry_id: str, updates: Dict) -> Optional[Dict]:
    """Update an existing help-desk entry by entry_id."""
    request_id = get_request_id()
    dynamo_logger.info(f"Updating help-desk entry: {entry_id}", request_id=request_id)
    try:
        table = _get_helpdesk_table()
        now = datetime.now(timezone.utc).isoformat()
        updates["updated_at"] = now
        updates = _serialize(updates)

        expr_parts = []
        attr_names = {}
        attr_values = {}
        for idx, (key, val) in enumerate(updates.items()):
            placeholder = f"#k{idx}"
            value_ph = f":v{idx}"
            expr_parts.append(f"{placeholder} = {value_ph}")
            attr_names[placeholder] = key
            attr_values[value_ph] = val

        if not expr_parts:
            resp = table.get_item(Key={"entry_id": entry_id})
            item = resp.get("Item")
            return _deserialize(item) if item else None

        resp = table.update_item(
            Key={"entry_id": entry_id},
            UpdateExpression="SET " + ", ".join(expr_parts),
            ExpressionAttributeNames=attr_names,
            ExpressionAttributeValues=attr_values,
            ReturnValues="ALL_NEW",
        )
        dynamo_logger.info(f"Help-desk entry updated: {entry_id}", request_id=request_id)
        return _deserialize(resp.get("Attributes"))
    except Exception as e:
        dynamo_logger.error(f"Error updating help-desk entry {entry_id}: {str(e)}", request_id=request_id, exc_info=True)
        raise


def delete_helpdesk_entry(entry_id: str) -> bool:
    """Delete a help-desk entry. Returns True if deleted, False if not found."""
    request_id = get_request_id()
    dynamo_logger.info(f"Deleting help-desk entry: {entry_id}", request_id=request_id)
    try:
        table = _get_helpdesk_table()
        resp = table.delete_item(
            Key={"entry_id": entry_id},
            ReturnValues="ALL_OLD",
        )
        deleted = bool(resp.get("Attributes"))
        if deleted:
            dynamo_logger.info(f"Help-desk entry deleted: {entry_id}", request_id=request_id)
        else:
            dynamo_logger.warning(f"Help-desk entry not found for deletion: {entry_id}", request_id=request_id)
        return deleted
    except Exception as e:
        dynamo_logger.error(f"Error deleting help-desk entry {entry_id}: {str(e)}", request_id=request_id, exc_info=True)
        raise


# ─── Help Desk Settings ─────────────────────────────────────────

def get_helpdesk_settings() -> Dict[str, Any]:
    """Fetch global settings for the help-desk."""
    request_id = get_request_id()
    dynamo_logger.debug("Getting help-desk settings", request_id=request_id)
    try:
        table = _get_table()
        resp = table.get_item(Key={"PK": "SETTINGS", "SK": "HELPDESK"})
        item = resp.get("Item")
        if not item:
            # Default settings
            return {"default_sort": "custom"}
        return _deserialize(item)
    except Exception as e:
        dynamo_logger.error(f"Error getting help-desk settings: {str(e)}", request_id=request_id)
        return {"default_sort": "custom"}


def update_helpdesk_settings(updates: Dict[str, Any]) -> Dict[str, Any]:
    """Update global settings for the help-desk."""
    request_id = get_request_id()
    dynamo_logger.info("Updating help-desk settings", request_id=request_id)
    try:
        table = _get_table()
        now = datetime.now(timezone.utc).isoformat()
        
        # We use a simple put_item for now since it's a single record
        item = {
            "PK": "SETTINGS",
            "SK": "HELPDESK",
            "entity_type": "SETTING",
            "updated_at": now,
            **_serialize(updates),
        }
        table.put_item(Item=item)
        dynamo_logger.info("Help-desk settings updated successfully", request_id=request_id)
        return _deserialize(item)
    except Exception as e:
        dynamo_logger.error(f"Error updating help-desk settings: {str(e)}", request_id=request_id)
        raise
