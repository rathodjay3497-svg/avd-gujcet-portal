# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A free online counseling registration platform for GUJCET (Gujarat) students, architected to support multiple future events. See `planning.md` for full specifications.

**Stack:** React 18 + Vite + CSS Modules/SCSS (frontend) · FastAPI + Mangum (backend) · AWS DynamoDB · AWS Lambda · Vercel

---

## Repository Structure

```
gujcet-platform/
├── frontend/        # React 18 + Vite app
├── backend/         # FastAPI app deployed as Lambda
└── planning.md      # Full project planning document (source of truth for architecture)
```

---

## Commands

### Frontend (`frontend/`)
```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # Production build → dist/
npm run preview      # Preview production build
```

### Backend (`backend/`)
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload          # Local dev server
pytest                                  # Run all tests
pytest tests/test_auth.py              # Run a single test file
serverless deploy                      # Deploy to AWS Lambda
```

---

## Architecture

### Backend (FastAPI + Lambda)

- `app/main.py` — FastAPI app, CORS middleware, Mangum handler (`handler = Mangum(app)`)
- `app/config.py` — pydantic-settings for all env vars
- `app/dependencies.py` — `get_current_user` and `require_admin` JWT guards used on protected routes
- `app/routers/` — `auth.py`, `events.py`, `registrations.py`, `admin.py`
- `app/services/dynamo.py` — all DynamoDB access (single-table design, see below)
- `app/services/` — `twilio_service.py`, `email_service.py`, `pdf_service.py`, `s3_service.py`, `id_generator.py`
- `app/utils/form_validator.py` — validates submitted `form_data` against a JSON `form_schema`

CORS is configured at **two levels**: FastAPI `CORSMiddleware` (runtime) and `serverless.yml` HTTP API (preflight). The `FRONTEND_URL` env var drives the allow-list — add new origins there only.

### Frontend (React + Vite)

- `src/App.jsx` — Router + auth guards (protected routes for `/profile` and `/admin/*`)
- `src/services/api.js` — Axios instance with auth interceptors
- `src/store/authStore.js` — Zustand: `user`, `token`, `isAdmin`
- `src/pages/` — One folder per page, each with `Page.jsx` + `Page.module.scss`
- `src/components/forms/DynamicForm/` — Renders JSON schema forms; `DynamicField.jsx` switches on `field.type`
- `src/components/forms/HtmlFormRenderer/` — Renders raw HTML forms in a sandboxed `<iframe sandbox="allow-scripts allow-forms">` (no `allow-same-origin`); form submission intercepted via `postMessage`
- `src/styles/` — Global SCSS using 7-1 pattern; `main.scss` is the single entry point

**SCSS imports:** Variables and mixins are globally injected via `vite.config.js` `additionalData` — do not manually `@use` them in `.module.scss` files.

### Database (DynamoDB — Single-Table Design)

Table name: `gujcet-platform`

| Entity | PK | SK |
|---|---|---|
| User | `USER#<phone>` | `PROFILE` |
| OTP | `OTP#<phone>` | `OTP` |
| Event | `EVENT#<event_id>` | `METADATA` |
| Registration | `EVENT#<event_id>` | `REG#<phone>` |

GSIs: `GSI1` (user's registrations), `GSI2` (list all entities by type), `GSI3` (registrations by status).

Registration IDs are generated atomically via DynamoDB `UpdateItem ADD` on a counter attribute. Format: `GCK-{YEAR}-{5-digit zero-padded}`.

OTP records use DynamoDB TTL on `expires_at` (Unix epoch, 5-min expiry). OTPs are bcrypt-hashed before storage.

### Event & Form System

Events have two orthogonal settings:

- **`registration_type`**: `"form"` (student fills a form) or `"click_to_register"` (logged-in student confirms with existing profile — no form)
- **`form_type`**: `"json_schema"` (rendered by `DynamicForm`) or `"html"` (rendered by `HtmlFormRenderer` in sandboxed iframe)

The frontend automatically selects the correct renderer based on these event attributes. Adding new events requires no code changes — admin configures via the dashboard.

### Authentication

- **Students:** Phone OTP via Twilio → JWT (24h) stored in httpOnly cookie + Zustand
- **Admin:** Username + bcrypt password → JWT (8h, role: admin)
- JWT validation via FastAPI dependencies (`get_current_user`, `require_admin`)

### Registration Flow (Full Form)

`POST /registrations/{event_id}` → validate event active → validate form data → check duplicate → atomic seat increment (if limit set) → upsert User → generate Reg ID → save Registration → generate PDF (ReportLab) → upload to S3 → trigger async SMS (Twilio) + Email (SES) → return `{ registration_id, pdf_url }`

---

## Key Environment Variables

### Backend (`.env`)
```
AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
DYNAMODB_TABLE_NAME=gujcet-platform
S3_BUCKET_NAME=gujcet-platform-pdfs
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
SES_SENDER_EMAIL
JWT_SECRET_KEY, JWT_ALGORITHM=HS256
ADMIN_USERNAME, ADMIN_PASSWORD_HASH   # bcrypt hash
FRONTEND_URL, FRONTEND_CUSTOM_URL
```

### Frontend (`.env`)
```
VITE_API_BASE_URL
VITE_APP_NAME
VITE_CONTACT_EMAIL
```

---

## Design System

All design tokens live in `src/styles/abstracts/_variables.scss`. Key values:
- Primary: `#1A3C6E` (navy), `#2563EB` (bright blue CTAs), `#F59E0B` (amber accent)
- Font: `Inter`, 8px base spacing scale
- Breakpoints: `$bp-sm: 480px`, `$bp-md: 768px`, `$bp-lg: 1024px`

Use `@include respond-to(md)` for mobile breakpoints. Use `@mixin card`, `@mixin button-primary`, `@mixin input-base` from `_mixins.scss` for consistent component styles.

UI targets a clean gov-tech/edtech aesthetic (not dark/gaming). Every page must be fully mobile-responsive.
