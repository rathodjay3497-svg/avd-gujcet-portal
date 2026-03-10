import uuid
import time
import json
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from mangum import Mangum

from app.config import get_settings
from app.routers import auth, events, registrations, admin, users
from app.logger import setup_logging, api_logger, generate_request_id, clear_request_id, set_request_id

# Initialize logging at startup
setup_logging()

settings = get_settings()

app = FastAPI(
    title="GUJCET Platform API",
    description="Free GUJCET Counseling Registration Platform",
    version="1.0.0",
)

# CORS — configured at both FastAPI and API Gateway levels
allowed_origins = [
    "https://gujcet-session.netlify.app",  # production frontend
    "http://localhost:5173",
    "http://localhost:3000",
]
# Add any extra URLs from env vars (avoids duplicates)
for url in [settings.FRONTEND_URL, settings.FRONTEND_CUSTOM_URL]:
    if url and url not in allowed_origins:
        allowed_origins.append(url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging all API requests and responses."""
    
    async def dispatch(self, request: Request, call_next):
        # Generate request ID
        request_id = generate_request_id()
        set_request_id(request_id)
        
        # Start timing
        start_time = time.time()
        
        # Log incoming request
        api_logger.info(
            f"Incoming request: {request.method} {request.url.path}",
            request_id=request_id,
            extra={
                "method": request.method,
                "path": request.url.path,
                "client_ip": request.client.host if request.client else "unknown",
                "user_agent": request.headers.get("user-agent", "unknown"),
            }
        )
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Log response
            api_logger.info(
                f"Request completed: {request.method} {request.url.path} - Status: {response.status_code} - Duration: {duration:.3f}s",
                request_id=request_id,
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration": f"{duration:.3f}",
                }
            )
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            api_logger.error(
                f"Request failed: {request.method} {request.url.path} - Error: {str(e)} - Duration: {duration:.3f}s",
                request_id=request_id,
                exc_info=True,
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "error": str(e),
                    "duration": f"{duration:.3f}",
                }
            )
            raise
        finally:
            clear_request_id()


# Add logging middleware
app.add_middleware(LoggingMiddleware)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(events.router, prefix="/events", tags=["Events"])
app.include_router(
    registrations.router, prefix="/registrations", tags=["Registrations"]
)
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(users.router, prefix="/users", tags=["Users"])


@app.get("/health")
def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}


# AWS Lambda handler via Mangum
# lifespan="off" is required for Lambda Function URLs to correctly
# handle CORS preflight (OPTIONS) requests without dropping headers.
handler = Mangum(app, lifespan="off")
