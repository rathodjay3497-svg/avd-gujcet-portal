from app.utils.validators import validate_form_data


def test_valid_form_data():
    schema = [
        {"field_id": "name", "label": "Full Name", "type": "text", "required": True},
        {"field_id": "phone", "label": "Phone", "type": "phone", "required": True},
        {"field_id": "stream", "label": "Stream", "type": "select", "options": ["Science", "Commerce"], "required": True},
    ]
    data = {"name": "Ravi Patel", "phone": "9876543210", "stream": "Science"}
    errors = validate_form_data(data, schema)
    assert errors == []


def test_missing_required_field():
    schema = [
        {"field_id": "name", "label": "Full Name", "type": "text", "required": True},
    ]
    data = {"name": ""}
    errors = validate_form_data(data, schema)
    assert len(errors) == 1
    assert "required" in errors[0].lower()


def test_invalid_phone():
    schema = [
        {"field_id": "phone", "label": "Phone", "type": "phone", "required": True},
    ]
    data = {"phone": "123"}
    errors = validate_form_data(data, schema)
    assert len(errors) == 1


def test_invalid_select_option():
    schema = [
        {"field_id": "stream", "label": "Stream", "type": "select", "options": ["Science", "Commerce"], "required": True},
    ]
    data = {"stream": "Invalid"}
    errors = validate_form_data(data, schema)
    assert len(errors) == 1


def test_optional_field_empty():
    schema = [
        {"field_id": "score", "label": "Score", "type": "number", "required": False},
    ]
    data = {"score": ""}
    errors = validate_form_data(data, schema)
    assert errors == []
