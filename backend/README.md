# GUJCET Platform — Backend

FastAPI backend deployed as an AWS Lambda function via Mangum.

## Quick Start

### Prerequisites
- Python 3.11+
- AWS account (for DynamoDB, S3, SES)
- Twilio account (for OTP SMS)
- Node.js 20+ (for Serverless Framework)
- Docker Desktop (recommended on Windows to package Linux wheels)

### Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate    # Linux/Mac
venv\Scripts\activate       # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials
```

### Run Locally

```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

### Run Tests

```bash
pytest                        # all tests
pytest tests/test_auth.py     # single file
pytest -v                     # verbose output
```

### Deploy to AWS

```bash
cd backend

# Install Serverless + packaging plugin (once)
npm install

# Deploy
npx serverless deploy --stage dev
```

Notes:
- Lambda should use IAM roles. Do not set `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` as Lambda env vars.
- `serverless.yml` reads config from your deploy-time environment (or CI). Locally, you can keep values in `.env`, but you must export them into your shell before `deploy` if you want them applied to Lambda.

## Project Structure

```
app/
├── main.py              # FastAPI app + CORS + Mangum handler
├── config.py            # pydantic-settings env configuration
├── dependencies.py      # JWT auth guards (get_current_user, require_admin)
├── routers/
│   ├── auth.py          # OTP send/verify, admin login
│   ├── events.py        # CRUD for events (admin-protected create/update/delete)
│   ├── registrations.py # Register (form + click-to-register), check status
│   └── admin.py         # Registrations export, stats, bulk notifications
├── models/
│   ├── user.py          # User, OTP, Admin request/response models
│   ├── event.py         # Event CRUD models with form_type/registration_type
│   └── registration.py  # Registration create/response models
├── services/
│   ├── dynamo.py        # DynamoDB single-table operations
│   ├── twilio_service.py # OTP + registration confirmation SMS
│   ├── email_service.py  # AWS SES transactional emails
│   ├── pdf_service.py    # ReportLab admit card PDF generation
│   ├── s3_service.py     # S3 upload + pre-signed URLs
│   └── id_generator.py   # Atomic registration ID generator
└── utils/
    ├── jwt.py           # JWT create/decode
    ├── otp.py           # OTP generation + bcrypt hashing
    └── validators.py    # Form data validation against JSON schema
```

## API Endpoints

| Group | Endpoint | Auth | Description |
|-------|----------|------|-------------|
| Auth | `POST /auth/otp/send` | Public | Send OTP to phone |
| Auth | `POST /auth/otp/verify` | Public | Verify OTP, get JWT |
| Auth | `POST /auth/admin/login` | Public | Admin password login |
| Events | `GET /events` | Public | List active events |
| Events | `GET /events/{id}` | Public | Event details + form schema |
| Events | `POST /events` | Admin | Create event |
| Events | `PUT /events/{id}` | Admin | Update event |
| Events | `PATCH /events/{id}/status` | Admin | Toggle event status |
| Registrations | `POST /registrations/{id}` | Public | Full form registration |
| Registrations | `POST /registrations/{id}/click` | Student | One-click registration |
| Registrations | `GET /registrations/me` | Student | My registrations |
| Registrations | `GET /registrations/{id}/check` | Public | Check if already registered |
| Admin | `GET /admin/registrations/{id}` | Admin | All registrations for event |
| Admin | `GET /admin/registrations/{id}/export` | Admin | CSV export |
| Admin | `GET /admin/stats/{id}` | Admin | Registration statistics |
| Admin | `POST /admin/notify/{id}` | Admin | Bulk SMS/Email notifications |

## DynamoDB Single-Table Design

Table: `gujcet-platform`

| Entity | PK | SK |
|--------|----|----|
| User | `USER#<phone>` | `PROFILE` |
| OTP | `OTP#<phone>` | `OTP` (TTL auto-delete) |
| Event | `EVENT#<event_id>` | `METADATA` |
| Registration | `EVENT#<event_id>` | `REG#<phone>` |
| Counter | `EVENT#<event_id>` | `COUNTER` |

GSIs:
- **GSI1** — `GSI1PK` (user) + `GSI1SK` (event): query user's registrations
- **GSI2** — `entity_type` + `created_at`: list all events/users by type

## Key Design Decisions

- **CORS** is enforced at both FastAPI middleware and API Gateway levels
- **OTPs** are bcrypt-hashed and stored with TTL for auto-expiry
- **Registration IDs** use DynamoDB atomic counters (no race conditions)
- **PDF generation** uses ReportLab with QR codes, uploaded to S3 with pre-signed URLs
- **SMS/Email notifications** are sent as FastAPI `BackgroundTasks` to avoid blocking responses
