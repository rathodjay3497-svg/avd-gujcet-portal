import boto3
import json
from decimal import Decimal
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

from app.config import get_settings

settings = get_settings()


def _get_table():
    dynamodb = boto3.resource(
        "dynamodb",
        region_name=settings.AWS_REGION,
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

def get_user(phone: str) -> Optional[Dict]:
    table = _get_table()
    resp = table.get_item(Key={"PK": f"USER#{phone}", "SK": "PROFILE"})
    item = resp.get("Item")
    return _deserialize(item) if item else None


def upsert_user(phone: str, data: Dict) -> Dict:
    table = _get_table()
    now = datetime.now(timezone.utc).isoformat()
    item = {
        "PK": f"USER#{phone}",
        "SK": "PROFILE",
        "entity_type": "USER",
        "phone": phone,
        "created_at": now,
        **_serialize(data),
    }
    table.put_item(Item=item)
    return _deserialize(item)


# ─── OTP Operations ─────────────────────────────────────────────

def save_otp(phone: str, otp_hash: str, expires_at: int):
    table = _get_table()
    table.put_item(Item={
        "PK": f"OTP#{phone}",
        "SK": "OTP",
        "otp_hash": otp_hash,
        "expires_at": expires_at,
        "attempts": 0,
    })


def get_otp(phone: str) -> Optional[Dict]:
    table = _get_table()
    resp = table.get_item(Key={"PK": f"OTP#{phone}", "SK": "OTP"})
    item = resp.get("Item")
    return _deserialize(item) if item else None


def increment_otp_attempts(phone: str):
    table = _get_table()
    table.update_item(
        Key={"PK": f"OTP#{phone}", "SK": "OTP"},
        UpdateExpression="ADD attempts :inc",
        ExpressionAttributeValues={":inc": 1},
    )


def delete_otp(phone: str):
    table = _get_table()
    table.delete_item(Key={"PK": f"OTP#{phone}", "SK": "OTP"})


# ─── Event Operations ───────────────────────────────────────────

def create_event(data: Dict) -> Dict:
    table = _get_table()
    now = datetime.now(timezone.utc).isoformat()
    event_id = data["event_id"]
    item = {
        "PK": f"EVENT#{event_id}",
        "SK": "METADATA",
        "entity_type": "EVENT",
        "seat_filled": 0,
        "created_at": now,
        **_serialize(data),
    }
    table.put_item(Item=item)
    return _deserialize(item)


def get_event(event_id: str) -> Optional[Dict]:
    table = _get_table()
    resp = table.get_item(Key={"PK": f"EVENT#{event_id}", "SK": "METADATA"})
    item = resp.get("Item")
    return _deserialize(item) if item else None


def list_events(status: Optional[str] = None) -> List[Dict]:
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
    return items


def update_event(event_id: str, updates: Dict) -> Optional[Dict]:
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
    return _deserialize(resp.get("Attributes"))


def increment_seat(event_id: str) -> int:
    """Atomically increment seat_filled. Returns the new count."""
    table = _get_table()
    resp = table.update_item(
        Key={"PK": f"EVENT#{event_id}", "SK": "METADATA"},
        UpdateExpression="ADD seat_filled :inc",
        ExpressionAttributeValues={":inc": 1},
        ReturnValues="UPDATED_NEW",
    )
    return int(resp["Attributes"]["seat_filled"])


# ─── Registration Operations ────────────────────────────────────

def create_registration(event_id: str, phone: str, data: Dict) -> Dict:
    table = _get_table()
    now = datetime.now(timezone.utc).isoformat()
    item = {
        "PK": f"EVENT#{event_id}",
        "SK": f"REG#{phone}",
        "entity_type": "REGISTRATION",
        "event_id": event_id,
        "phone": phone,
        "registered_at": now,
        "status": "confirmed",
        # GSI1: query registrations by user
        "GSI1PK": f"USER#{phone}",
        "GSI1SK": f"REG#{event_id}",
        **_serialize(data),
    }
    table.put_item(Item=item)
    return _deserialize(item)


def get_registration(event_id: str, phone: str) -> Optional[Dict]:
    table = _get_table()
    resp = table.get_item(Key={"PK": f"EVENT#{event_id}", "SK": f"REG#{phone}"})
    item = resp.get("Item")
    return _deserialize(item) if item else None


def get_user_registrations(phone: str) -> List[Dict]:
    table = _get_table()
    resp = table.query(
        IndexName="GSI1",
        KeyConditionExpression="GSI1PK = :pk",
        ExpressionAttributeValues={":pk": f"USER#{phone}"},
    )
    return [_deserialize(i) for i in resp.get("Items", [])]


def get_event_registrations(event_id: str) -> List[Dict]:
    table = _get_table()
    resp = table.query(
        KeyConditionExpression="PK = :pk AND begins_with(SK, :prefix)",
        ExpressionAttributeValues={
            ":pk": f"EVENT#{event_id}",
            ":prefix": "REG#",
        },
    )
    return [_deserialize(i) for i in resp.get("Items", [])]


# ─── Registration Counter ───────────────────────────────────────

def get_next_registration_id(event_id: str, year: int) -> str:
    """Generate next registration ID using an atomic counter."""
    table = _get_table()
    resp = table.update_item(
        Key={"PK": f"EVENT#{event_id}", "SK": "COUNTER"},
        UpdateExpression="ADD #cnt :inc",
        ExpressionAttributeNames={"#cnt": "count"},
        ExpressionAttributeValues={":inc": 1},
        ReturnValues="UPDATED_NEW",
    )
    count = int(resp["Attributes"]["count"])
    return f"GCK-{year}-{count:05d}"
