from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # AWS
    AWS_REGION: str = "ap-south-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    DYNAMODB_TABLE_NAME: str = "gujcet-platform"

    # Twilio
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    # Email
    SES_SENDER_EMAIL: str = "noreply@yourdomain.com"

    # JWT
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 24
    ADMIN_JWT_EXPIRY_HOURS: int = 8

    # Cookies
    # Use "none" if frontend and backend are on different sites (e.g. Netlify + API Gateway).
    COOKIE_SAMESITE: str = "none"

    # Admin
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD_HASH: str = ""

    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"
    FRONTEND_CUSTOM_URL: str = ""
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        extra = "allow"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
