# GUJCET Free Counseling Platform

A free online counseling registration platform for GUJCET students, built to support multiple events with dynamic forms and zero-code event creation.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + CSS Modules/SCSS |
| Backend | FastAPI + Mangum (AWS Lambda) |
| Database | AWS DynamoDB (single-table design) |
| Storage | AWS S3 (PDF admit cards) |
| SMS | Twilio (OTP + notifications) |
| Email | AWS SES |
| Hosting | Vercel (frontend) + AWS Lambda (backend) |

## Quick Start

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # configure credentials
uvicorn app.main:app --reload
```

API docs: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_BASE_URL
npm run dev
```

App: `http://localhost:5173`

## Features

- **Public registration** — no login required, dynamic forms from JSON schema or raw HTML
- **One-click registration** — logged-in students register with a single click
- **Phone OTP login** — Twilio SMS, 6-digit code, bcrypt-hashed storage
- **PDF admit cards** — auto-generated with QR code, uploaded to S3
- **Admin dashboard** — KPI stats, registration tables, CSV export, bulk notifications
- **Event system** — create events with custom forms via admin panel, no code changes needed
- **Mobile responsive** — every page works on phone screens

## Project Structure

```
├── frontend/          # React + Vite app (see frontend/README.md)
├── backend/           # FastAPI Lambda app (see backend/README.md)
├── planning.md        # Full project planning document
└── CLAUDE.md          # AI assistant context file
```

See [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md) for detailed setup and architecture.
