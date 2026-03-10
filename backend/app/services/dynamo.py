import boto3
import json
from decimal import Decimal
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

from app.config import get_settings
from app.logger import dynamo_logger, get_request_id

settings = get_settings()


def _get_table():
    dynamodb = boto3.resource(
        "dynamodb",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
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


# ─── Registration Counter ───────────────────────────────────────

def get_next_registration_id(event_id: str, year: int) -> str:
    """Generate next registration ID using an atomic counter."""
    request_id = get_request_id()
    dynamo_logger.debug(f"Generating next registration ID for event: {event_id}, year: {year}", request_id=request_id)
    try:
        table = _get_table()
        resp = table.update_item(
            Key={"PK": f"EVENT#{event_id}", "SK": "COUNTER"},
            UpdateExpression="ADD #cnt :inc",
            ExpressionAttributeNames={"#cnt": "count"},
            ExpressionAttributeValues={":inc": 1},
            ReturnValues="UPDATED_NEW",
        )
        count = int(resp["Attributes"]["count"])
        reg_id = f"GCK-{year}-{count:05d}"
        dynamo_logger.info(f"Generated registration ID: {reg_id}", request_id=request_id)
        return reg_id
    except Exception as e:
        dynamo_logger.error(f"Error generating registration ID for event {event_id}: {str(e)}", request_id=request_id, exc_info=True)
        raise
