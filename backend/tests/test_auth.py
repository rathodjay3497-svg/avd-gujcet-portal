import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app

client = TestClient(app)


class TestOTPSend:
    def test_send_otp_valid_phone(self):
        with patch("app.routers.auth.dynamo") as mock_dynamo, \
             patch("app.routers.auth.send_otp_sms"):
            mock_dynamo.save_otp = MagicMock()
            resp = client.post("/auth/otp/send", json={"phone": "9876543210"})
            assert resp.status_code == 200
            assert "expires_in" in resp.json()

    def test_send_otp_invalid_phone(self):
        resp = client.post("/auth/otp/send", json={"phone": "123"})
        assert resp.status_code == 422


class TestOTPVerify:
    def test_verify_otp_no_record(self):
        with patch("app.routers.auth.dynamo") as mock_dynamo:
            mock_dynamo.get_otp.return_value = None
            resp = client.post("/auth/otp/verify", json={"phone": "9876543210", "otp": "123456"})
            assert resp.status_code == 400

    def test_verify_otp_invalid_format(self):
        resp = client.post("/auth/otp/verify", json={"phone": "9876543210", "otp": "12"})
        assert resp.status_code == 422


class TestAdminLogin:
    def test_admin_login_wrong_username(self):
        resp = client.post("/auth/admin/login", json={"username": "wrong", "password": "pass"})
        assert resp.status_code == 401


class TestHealthCheck:
    def test_health(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
