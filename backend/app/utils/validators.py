from typing import List, Dict, Any


def validate_form_data(form_data: Dict[str, Any], form_schema: List[Dict]) -> List[str]:
    """
    Validate submitted form_data against the event's JSON form_schema.
    Returns a list of error messages (empty if valid).
    """
    errors = []

    for field in form_schema:
        field_id = field.get("field_id")
        required = field.get("required", False)
        field_type = field.get("type", "text")
        options = field.get("options", [])

        value = form_data.get(field_id)

        # Check required fields
        if required and (value is None or str(value).strip() == ""):
            errors.append(f"{field.get('label', field_id)} is required.")
            continue

        if value is None or str(value).strip() == "":
            continue

        # Type-specific validation
        if field_type == "phone":
            if not str(value).isdigit() or len(str(value)) != 10:
                errors.append(f"{field.get('label', field_id)} must be a 10-digit number.")

        elif field_type == "email":
            if "@" not in str(value) or "." not in str(value):
                errors.append(f"{field.get('label', field_id)} must be a valid email.")

        elif field_type == "number":
            try:
                float(value)
            except (ValueError, TypeError):
                errors.append(f"{field.get('label', field_id)} must be a number.")

        elif field_type == "select" and options:
            if str(value) not in [str(o) for o in options]:
                errors.append(f"{field.get('label', field_id)} must be one of: {', '.join(str(o) for o in options)}.")

    return errors
