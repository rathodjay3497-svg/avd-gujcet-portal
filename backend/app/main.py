from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from app.config import get_settings
from app.routers import auth, events, registrations, admin, users

settings = get_settings()

app = FastAPI(
    title="GUJCET Platform API",
    description="Free GUJCET Counseling Registration Platform",
    version="1.0.0",
)

# CORS — configured at both FastAPI and API Gateway levels
allowed_origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
]
if settings.FRONTEND_CUSTOM_URL:
    allowed_origins.append(settings.FRONTEND_CUSTOM_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(events.router, prefix="/events", tags=["Events"])
app.include_router(registrations.router, prefix="/registrations", tags=["Registrations"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(users.router, prefix="/users", tags=["Users"])


@app.get("/health")
def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}


# AWS Lambda handler via Mangum
handler = Mangum(app)
