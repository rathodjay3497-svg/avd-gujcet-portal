# GUJCET Free Counseling Platform — Full Project Planning

> **Stack:** React 18 + Vite + CSS Modules/SCSS · FastAPI · AWS DynamoDB · AWS Lambda · Vercel  
> **Date:** March 2026  
> **Version:** 2.0  
> **Scope:** GUJCET counseling platform with extensible event architecture

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Key Functional Requirements](#2-key-functional-requirements)
3. [System Architecture](#3-system-architecture)
4. [DynamoDB Schema Design](#4-dynamodb-schema-design)
5. [Backend Planning (FastAPI + Lambda)](#5-backend-planning-fastapi--lambda)
6. [Frontend Planning (React + Vite)](#6-frontend-planning-react--vite)
7. [Authentication Flow (Twilio OTP)](#7-authentication-flow-twilio-otp)
8. [Admin Dashboard](#8-admin-dashboard)
9. [Notification System](#9-notification-system)
10. [Extensibility — Future Events](#10-extensibility--future-events)
11. [Deployment Strategy](#11-deployment-strategy)
12. [Folder Structure](#12-folder-structure)
13. [Development Phases & Milestones](#13-development-phases--milestones)
14. [Environment Variables](#14-environment-variables)
15. [Open Decisions / Future Considerations](#15-open-decisions--future-considerations)

---

## 1. Project Overview

A free online counseling registration platform, starting with **GUJCET exam preparation counseling** (Gujarat, English medium). The platform is architected to support **multiple future events** with differing structures, optional paid registrations, and fully custom HTML forms — without requiring backend rewrites.

### Core Goals
- Allow students to register for counseling **without needing to log in**
- Some events support **one-click registration after login** (no full form required)
- Phone-number-based login (OTP via Twilio) for students who want to view their profile
- Single admin with full dashboard: view, export, notify students
- Students receive **SMS confirmation + Email confirmation + PDF admit card** on registration
- Fully serverless backend (FastAPI on AWS Lambda) + Vercel frontend
- Professional, visually attractive UI using CSS Modules + SCSS

---

## 2. Key Functional Requirements

### 2.1 Public (No Login Required)
- [ ] View the home/landing page with active events — professional hero section, event cards
- [ ] Register for an event (GUJCET counseling) directly from the dashboard
- [ ] Registration form rendered dynamically from event's `form_schema` or `form_html`
- [ ] On successful registration → SMS + Email confirmation + PDF admit card download
- [ ] View event details (date, venue, description, medium, stream)

### 2.2 Student (Logged In via OTP)
- [ ] Login with phone number (Twilio OTP, 6-digit code)
- [ ] **One-click registration** for events with `registration_type: "click_to_register"` — no form, just confirm with existing profile data
- [ ] View own registration details (read-only, no edits after submit)
- [ ] Download PDF admit card again from profile
- [ ] View all events they are registered for

### 2.3 Admin (Separate Login)
- [ ] Secure admin login (username + password, JWT-protected)
- [ ] Dashboard: view all registrations per event with charts and stats
- [ ] Filter/search registrations by name, phone, school, stream, district
- [ ] Export registrations as CSV / Excel
- [ ] Send bulk SMS or Email notifications to registered students
- [ ] Create / edit / deactivate events
- [ ] Configure event form: choose **JSON schema** (Form Builder) or **raw HTML** per event
- [ ] Set event `registration_type`: `"form"` or `"click_to_register"`
- [ ] Set seat limits per event (optional, toggleable)
- [ ] View registration stats: total, stream-wise, district-wise breakdown

### 2.4 System / Automated
- [ ] Auto-generate unique Registration ID (e.g. `GCK-2026-00423`)
- [ ] Auto-send SMS via Twilio on successful registration
- [ ] Auto-send Email via AWS SES
- [ ] Auto-generate PDF admit card with student details + QR code
- [ ] OTP expiry (5 minutes)

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     VERCEL (Frontend)                    │
│         React 18 + Vite + CSS Modules + SCSS             │
│   Public Pages | Student Portal | Admin Dashboard        │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS / REST + CORS headers
┌──────────────────────────▼──────────────────────────────┐
│              AWS API Gateway + Lambda                    │
│         FastAPI (Mangum adapter) + CORS Middleware       │
│                                                          │
│  /auth/*   /events/*   /registrations/*   /admin/*      │
└──────┬──────────┬──────────────┬───────────────┬────────┘
       │          │              │               │
  ┌────▼───┐ ┌───▼────┐  ┌──────▼──────┐  ┌────▼──────┐
  │ Twilio │ │  AWS   │  │  DynamoDB   │  │  AWS SES  │
  │  SMS   │ │   S3   │  │  (Database) │  │  / Email  │
  │  OTP   │ │(PDFs)  │  │             │  │           │
  └────────┘ └────────┘  └─────────────┘  └───────────┘
```

### Key Services
| Service | Purpose |
|---|---|
| **Vercel** | Host React frontend, global CDN |
| **AWS Lambda** | Serverless FastAPI backend |
| **AWS API Gateway** | Route HTTP requests to Lambda, enforce CORS |
| **AWS DynamoDB** | Primary database (NoSQL, single-table design) |
| **AWS S3** | Store generated PDF admit cards |
| **AWS SES** | Send transactional emails |
| **Twilio** | SMS OTP + registration SMS confirmation |

---

## 4. DynamoDB Schema Design

DynamoDB uses a **single-table design** with `PK` (Partition Key) and `SK` (Sort Key). GSIs cover all secondary query patterns.

---

### Table: `gujcet-platform`

#### Entity: User (Student)

| Attribute | Value Example | Notes |
|---|---|---|
| `PK` | `USER#9876543210` | Phone number as unique key |
| `SK` | `PROFILE` | |
| `entity_type` | `USER` | |
| `user_id` | `usr_abc123` | UUID |
| `name` | `Ravi Patel` | |
| `phone` | `9876543210` | |
| `email` | `ravi@gmail.com` | |
| `dob` | `2005-03-15` | |
| `gender` | `Male` | |
| `guardian_name` | `Suresh Patel` | |
| `guardian_phone` | `9812345678` | |
| `school_college` | `DPS Ahmedabad` | |
| `stream` | `Science` | Science / Commerce / Arts |
| `district` | `Ahmedabad` | |
| `state` | `Gujarat` | |
| `pin_code` | `380015` | |
| `created_at` | `2026-03-09T10:00:00Z` | ISO timestamp |

---

#### Entity: OTP Record

| Attribute | Value Example | Notes |
|---|---|---|
| `PK` | `OTP#9876543210` | |
| `SK` | `OTP` | |
| `otp_hash` | `hashed_otp` | bcrypt hashed |
| `expires_at` | `1741520400` | Unix epoch — **TTL field**, auto-deleted by DynamoDB |
| `attempts` | `0` | Max 3 attempts |

---

#### Entity: Event

| Attribute | Value Example | Notes |
|---|---|---|
| `PK` | `EVENT#gujcet-2026` | slug-based |
| `SK` | `METADATA` | |
| `entity_type` | `EVENT` | |
| `event_id` | `gujcet-2026` | URL-safe slug |
| `title` | `GUJCET Free Counseling 2026` | |
| `description` | `...` | Rich text / markdown |
| `medium` | `English` | English / Gujarati / Both |
| `event_type` | `counseling` | counseling / workshop / seminar |
| `registration_type` | `"form"` | **`"form"`** = full form · **`"click_to_register"`** = login + 1-click |
| `is_paid` | `false` | For future paid events |
| `fee_amount` | `0` | 0 for free |
| `streams` | `["Science","Commerce","Arts"]` | |
| `venue` | `Ahmedabad Community Hall` | |
| `event_date` | `2026-04-15` | |
| `registration_deadline` | `2026-04-10` | |
| `seat_limit` | `null` | null = unlimited |
| `seat_filled` | `0` | Atomic counter |
| `status` | `active` | active / draft / closed |
| `form_type` | `"json_schema"` | **`"json_schema"`** or **`"html"`** |
| `form_schema` | `[{...}]` | Used when `form_type = "json_schema"` |
| `form_html` | `"<div>...</div>"` | Used when `form_type = "html"` — raw HTML string |
| `created_at` | `2026-03-09T10:00:00Z` | |

---

#### form_schema Example (JSON Schema type)
```json
[
  { "field_id": "name",         "label": "Full Name",        "type": "text",   "required": true },
  { "field_id": "phone",        "label": "Phone Number",     "type": "phone",  "required": true },
  { "field_id": "stream",       "label": "Stream",           "type": "select", "options": ["Science","Commerce","Arts"], "required": true },
  { "field_id": "school",       "label": "School / College", "type": "text",   "required": true },
  { "field_id": "district",     "label": "District",         "type": "text",   "required": true },
  { "field_id": "gujcet_score", "label": "GUJCET Score",     "type": "number", "required": false }
]
```

#### form_html Example (HTML type — for future custom events)
```html
<!-- Stored as a string in DynamoDB. Rendered in a sandboxed iframe on the frontend. -->
<form>
  <label>Workshop Topic Preference</label>
  <select name="topic">
    <option value="maths">Mathematics</option>
    <option value="physics">Physics</option>
  </select>
  <label>Do you have a laptop?</label>
  <input type="checkbox" name="has_laptop" value="yes" />
  <button type="submit">Register</button>
</form>
```

> **Security:** HTML forms are rendered in a **sandboxed `<iframe>`** (without `allow-same-origin`). Submission is intercepted via `postMessage` — the iframe cannot access cookies, make API calls, or reach the DOM. Zero XSS risk.

---

#### Entity: Registration

| Attribute | Value Example | Notes |
|---|---|---|
| `PK` | `EVENT#gujcet-2026` | Links to event |
| `SK` | `REG#9876543210` | Phone = unique per event |
| `entity_type` | `REGISTRATION` | |
| `registration_id` | `GCK-2026-00423` | Human-readable unique ID |
| `user_id` | `usr_abc123` | |
| `event_id` | `gujcet-2026` | |
| `phone` | `9876543210` | |
| `form_data` | `{...}` | JSON blob — works for both form types |
| `pdf_url` | `s3://...` | S3 pre-signed URL |
| `status` | `confirmed` | confirmed / cancelled / waitlisted |
| `registered_at` | `2026-03-09T10:00:00Z` | |

---

#### GSI (Global Secondary Indexes)

| GSI Name | PK | SK | Query Use Case |
|---|---|---|---|
| `GSI1` | `USER#<phone>` | `REG#<event_id>` | All registrations by a student |
| `GSI2` | `entity_type` | `created_at` | List all events / all users |
| `GSI3` | `EVENT#<event_id>` | `status` | Filter registrations by status |

---

## 5. Backend Planning (FastAPI + Lambda)

### 5.1 Project Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app + CORS middleware + Mangum handler
│   ├── config.py                # pydantic-settings: env vars
│   ├── dependencies.py          # get_current_user, require_admin
│   │
│   ├── routers/
│   │   ├── auth.py              # OTP send/verify, admin login
│   │   ├── events.py            # CRUD for events
│   │   ├── registrations.py     # Register (form + click-to-register)
│   │   └── admin.py             # Admin-only: export, notify, stats
│   │
│   ├── models/
│   │   ├── user.py
│   │   ├── event.py             # Includes form_type, form_html, registration_type
│   │   └── registration.py
│   │
│   ├── services/
│   │   ├── dynamo.py            # DynamoDB client + helpers
│   │   ├── twilio_service.py    # OTP SMS + confirmation SMS
│   │   ├── email_service.py     # AWS SES
│   │   ├── pdf_service.py       # ReportLab PDF generation
│   │   ├── s3_service.py        # S3 upload + pre-signed URLs
│   │   └── id_generator.py      # Registration ID generator
│   │
│   └── utils/
│       ├── jwt.py
│       ├── otp.py
│       ├── form_validator.py    # Validates form_data vs json_schema
│       └── validators.py
│
├── tests/
├── requirements.txt
├── serverless.yml
└── .env.example
```

---

### 5.2 CORS Configuration

CORS is configured at **two levels**: FastAPI middleware (runtime) and API Gateway (preflight OPTIONS).

#### FastAPI `main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from app.config import settings

app = FastAPI(title="GUJCET Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,          # e.g. https://yourdomain.vercel.app
        settings.FRONTEND_CUSTOM_URL,   # e.g. https://yourdomain.com
        "http://localhost:5173",         # Vite dev server
    ],
    allow_credentials=True,             # Required for httpOnly cookies
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

handler = Mangum(app)
```

#### serverless.yml (API Gateway CORS)
```yaml
provider:
  httpApi:
    cors:
      allowedOrigins:
        - https://yourdomain.vercel.app
        - https://yourdomain.com
      allowedHeaders:
        - Content-Type
        - Authorization
      allowedMethods:
        - GET
        - POST
        - PUT
        - PATCH
        - DELETE
        - OPTIONS
      allowCredentials: true
```

> **Rule:** `FRONTEND_URL` env var drives the allow-list. Add new origins there — no code changes needed.

---

### 5.3 API Endpoints

#### Auth — `/auth`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/otp/send` | Public | Send OTP via Twilio |
| `POST` | `/auth/otp/verify` | Public | Verify OTP → JWT token |
| `POST` | `/auth/admin/login` | Public | Admin password login |
| `POST` | `/auth/logout` | Student | Client-side token clear |

#### Events — `/events`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/events` | Public | List active events |
| `GET` | `/events/{event_id}` | Public | Event details + form_schema / form_html |
| `POST` | `/events` | Admin | Create event |
| `PUT` | `/events/{event_id}` | Admin | Update event |
| `PATCH` | `/events/{event_id}/status` | Admin | Toggle status |
| `DELETE` | `/events/{event_id}` | Admin | Soft-delete |

#### Registrations — `/registrations`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/registrations/{event_id}` | Public | Submit full form registration |
| `POST` | `/registrations/{event_id}/click` | Student | One-click registration (uses profile) |
| `GET` | `/registrations/me` | Student | Own registrations |
| `GET` | `/registrations/{event_id}/check` | Public | Check if phone already registered |
| `GET` | `/registrations/{reg_id}/pdf` | Public | Download admit card |

#### Admin — `/admin`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/admin/registrations/{event_id}` | Admin | All registrations |
| `GET` | `/admin/registrations/{event_id}/export` | Admin | CSV / Excel export |
| `GET` | `/admin/stats/{event_id}` | Admin | Stats & breakdown |
| `POST` | `/admin/notify/{event_id}` | Admin | Bulk SMS/Email |
| `GET` | `/admin/users` | Admin | All users |

---

### 5.4 Key Backend Logic

#### Full Form Registration Flow
```
POST /registrations/{event_id}
  ├── Fetch event → check status = "active"
  ├── Check registration_type = "form" (else 400)
  ├── If form_type = "json_schema": validate form_data vs form_schema
  ├── If form_type = "html": accept all submitted key-value pairs as-is
  ├── Check phone not already registered for this event
  ├── Check seat_limit (atomic increment if set)
  ├── Upsert User record in DynamoDB
  ├── Generate Registration ID → GCK-2026-XXXXX (atomic counter per event)
  ├── Save Registration to DynamoDB
  ├── Generate PDF (ReportLab) → Upload to S3 → Get pre-signed URL
  ├── Send SMS via Twilio (async BackgroundTask)
  ├── Send Email via SES (async BackgroundTask)
  └── Return { registration_id, pdf_url, message: "Registered successfully" }
```

#### Click-to-Register Flow
```
POST /registrations/{event_id}/click   [Requires JWT]
  ├── Fetch event → check registration_type = "click_to_register"
  ├── Fetch student profile from DynamoDB
  ├── Check phone not already registered
  ├── Check seat_limit (atomic increment if set)
  ├── Auto-build form_data from student profile fields
  ├── Generate Registration ID → Save → PDF → SMS → Email (async)
  └── Return { registration_id, pdf_url, message }
```

#### Registration ID Generation
```
Format:  GCK-{YEAR}-{5-digit zero-padded sequence}
Example: GCK-2026-00001, GCK-2026-00423
Method:  DynamoDB UpdateItem with ADD on counter attribute (atomic, no race conditions)
```

---

## 6. Frontend Planning (React + Vite)

### 6.1 Tech Stack

| Package | Purpose |
|---|---|
| **React 18 + Vite** | Core framework and build tool |
| **CSS Modules + SASS/SCSS** | `.module.scss` per component — no class collisions, CSS strictly separated from logic |
| **React Router v6** | Navigation, protected routes |
| **TanStack Query v5** | Server state, caching, background refetch |
| **React Hook Form + Zod** | Form handling + schema validation |
| **Zustand** | Global state: auth session, UI |
| **Axios** | HTTP client with auth interceptors |
| **i18next** | i18n — English now, Gujarati-ready |
| **react-pdf / pdf-lib** | PDF preview and download in browser |

---

#### SCSS Architecture (7-1 Pattern)
```
src/styles/
├── abstracts/
│   ├── _variables.scss     # All design tokens
│   ├── _mixins.scss        # Reusable mixins
│   └── _functions.scss     # rem(), px-to-em()
├── base/
│   ├── _reset.scss
│   ├── _typography.scss
│   └── _animations.scss    # Keyframes: fade, slide, pulse, shimmer
├── layout/
│   ├── _grid.scss
│   └── _containers.scss
├── themes/
│   └── _default.scss       # CSS custom properties on :root
└── main.scss               # Single import entry point
```

#### Design Tokens (`_variables.scss`)
```scss
// Colors — professional, education-focused
$color-primary:        #1A3C6E;   // Deep Navy Blue
$color-primary-light:  #2563EB;   // Bright Blue — CTAs
$color-primary-pale:   #EFF6FF;   // Section backgrounds
$color-accent:         #F59E0B;   // Amber — highlights, badges
$color-success:        #10B981;
$color-danger:         #EF4444;
$color-bg:             #F8FAFC;
$color-surface:        #FFFFFF;
$color-border:         #E2E8F0;
$color-text:           #1E293B;
$color-text-muted:     #64748B;
$color-text-light:     #94A3B8;

// Typography
$font-primary:   'Inter', 'Segoe UI', system-ui, sans-serif;
$font-size-xs:   0.75rem;   $font-size-sm:   0.875rem;
$font-size-base: 1rem;      $font-size-lg:   1.125rem;
$font-size-xl:   1.25rem;   $font-size-2xl:  1.5rem;
$font-size-3xl:  1.875rem;  $font-size-4xl:  2.25rem;
$font-size-5xl:  3rem;

// Spacing (8px base)
$space-1: 0.25rem;  $space-2: 0.5rem;   $space-3: 0.75rem;
$space-4: 1rem;     $space-6: 1.5rem;   $space-8: 2rem;
$space-10: 2.5rem;  $space-12: 3rem;    $space-16: 4rem;
$space-20: 5rem;    $space-24: 6rem;

// Shadows
$shadow-sm:   0 1px 3px rgba(0,0,0,0.08);
$shadow-md:   0 4px 16px rgba(0,0,0,0.08);
$shadow-lg:   0 8px 32px rgba(0,0,0,0.12);
$shadow-card: 0 2px 8px rgba(26,60,110,0.08);
$shadow-blue: 0 4px 20px rgba(37,99,235,0.25);

// Border Radius
$radius-sm: 6px;  $radius-md: 12px;
$radius-lg: 20px; $radius-full: 9999px;

// Transitions
$transition-fast: all 0.15s ease;
$transition-base: all 0.25s ease;

// Breakpoints
$bp-sm: 480px;  $bp-md: 768px;
$bp-lg: 1024px; $bp-xl: 1280px;
```

#### Key Mixins (`_mixins.scss`)
```scss
@mixin respond-to($bp) {
  @if $bp == sm  { @media (max-width: $bp-sm)  { @content; } }
  @if $bp == md  { @media (max-width: $bp-md)  { @content; } }
  @if $bp == lg  { @media (max-width: $bp-lg)  { @content; } }
}
@mixin flex-center  { display: flex; align-items: center; justify-content: center; }
@mixin flex-between { display: flex; align-items: center; justify-content: space-between; }
@mixin card {
  background: $color-surface;
  border-radius: $radius-md;
  box-shadow: $shadow-card;
  border: 1px solid $color-border;
}
@mixin glass-card {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.6);
  border-radius: $radius-lg;
}
@mixin button-primary {
  background: $color-primary-light;
  color: #fff;
  border-radius: $radius-sm;
  font-weight: 600;
  transition: $transition-base;
  box-shadow: $shadow-blue;
  &:hover  { background: $color-primary; transform: translateY(-1px); }
  &:active { transform: translateY(0); }
}
@mixin input-base {
  width: 100%;
  padding: $space-3 $space-4;
  border: 1.5px solid $color-border;
  border-radius: $radius-sm;
  font-size: $font-size-base;
  color: $color-text;
  transition: $transition-base;
  &:focus {
    outline: none;
    border-color: $color-primary-light;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
  }
  &::placeholder { color: $color-text-light; }
}
```

---

### 6.2 UI Design Language — Opus Generation Guide

> **This section guides Claude Opus when generating each page and component. Follow every rule precisely to produce a professional, consistent UI.**

#### Visual Identity
- **Style:** Clean, modern, professional — gov-tech + edtech aesthetic (think NIC, Notion, Linear)
- **Feel:** Trustworthy, premium but approachable for students aged 16–22
- **NOT:** Cluttered, over-animated, dark/gaming, childish, generic bootstrap look

#### Global Layout Rules
- Content max-width: `1200px`, centered, horizontal padding `24px`
- Navbar: **fixed top**, white bg, subtle `box-shadow` on scroll, logo left + nav links right, "Login" button top-right
- Every section uses alternating backgrounds: `$color-surface` (white) → `$color-primary-pale` (light blue) → `$color-surface`
- Footer: dark navy bg (`$color-primary`), white text, 3-column layout (brand, links, contact)
- All pages are **fully mobile-responsive** using `@include respond-to(md)` breakpoints

#### Component Visual Rules
| Component | Style Rules |
|---|---|
| **Cards** | white bg, `border-radius: $radius-md`, `box-shadow: $shadow-card`, `border: 1px solid $color-border`, `padding: 24px` |
| **Primary Button** | `background: $color-primary-light`, white text, bold, hover lifts with shadow |
| **Secondary Button** | white bg, `border: 1.5px solid $color-primary-light`, primary-color text |
| **Form Inputs** | rounded, blue focus ring, label above each input |
| **Status Badges** | pill shape, color-coded: green=confirmed, amber=pending, red=closed/full |
| **Section Headings** | `$color-primary`, `font-weight: 700`, decorative underline accent in `$color-accent` |
| **Icons** | Use inline SVGs or a single icon set consistently |

#### Page-by-Page Specs

**Landing Page (`/`)**
- **Hero:** Full-width, navy→blue diagonal gradient, white text, large heading "Free GUJCET Counseling 2026", subtitle line, two CTAs side by side ("Register Now" primary + "Learn More" outline)
- **Stats Strip:** 3 animated counters — total registered students, events available, expert counselors — each with an amber accent icon
- **Active Events:** 3-column card grid. Each card: colored top accent border (by stream), event title, date chip, venue with location icon, stream badges, "Register Now" button. Card lifts on hover.
- **How It Works:** 3-step horizontal flow: numbered circles (navy) + step title + description
- **FAQ:** Accordion with smooth open/close animation
- **CTA Banner:** Full-width navy strip with "Ready to get counseled? Register for free today" + button

**Event Detail Page (`/events/:id`)**
- Two-column layout (65/35): details left, sticky registration card right
- Details: event banner, description, date/venue info, stream chips, what to bring list
- Sticky card: white `$shadow-lg` card, event name, date, seats bar (if set), "Register Now" button, "Already registered? Check status" link

**Registration Form (`/events/:id/register`)**
- Centered single-column, max-width `600px`
- White card container with `$shadow-md`
- Section dividers with labels (Personal Info / Academic Info / etc.)
- Each field: label on top, `@mixin input-base` styled input, inline error in red
- Submit button: full-width, primary style, loading spinner state

**Registration Success (`/register/success`)**
- Centered, large animated green checkmark (CSS keyframe)
- Registration ID in large monospace font in a highlighted box with "Copy" icon button
- PDF download card with document icon and blue "Download Admit Card" button
- "Share on WhatsApp" link
- "Back to Events" secondary link

**Student Login (`/login`)**
- Centered card, max-width `440px`, `$shadow-lg`
- Platform logo at top of card
- Phone input → "Send OTP" button
- 6-box OTP input (individual `<input>` per digit, auto-focus next on entry)
- "Resend OTP" countdown timer

**Student Profile (`/profile`)**
- Two-column: left sidebar (avatar initial circle, name, phone, stream) + right main area
- Main: "My Registrations" heading + cards per registration (event name, date, Reg ID, status badge, PDF download link)
- Empty state illustration if no registrations

**Admin Dashboard (`/admin`)**
- Sidebar: fixed left, collapsible, navy bg, white icons + labels, active state highlight
- Top area: 4 KPI stat cards (Total Registrations, Science, Commerce, Arts) with icons
- Charts row: registration trend line chart (area fill) + stream donut chart
- Recent registrations mini-table below charts

---

### 6.3 Page & Route Structure

```
/                              → Landing Page
/events/:eventId               → Event Detail Page
/events/:eventId/register      → Registration Form (public — form type events)
/events/:eventId/confirm       → Click-to-register confirm page (login required)
/register/success              → Success Page + PDF download

/login                         → Student Login (OTP)
/profile                       → Student Profile (protected)

/admin/login                   → Admin Login
/admin                         → Admin Dashboard
/admin/events                  → Manage Events
/admin/events/new              → Create Event
/admin/events/:id/edit         → Edit Event + Form Builder
/admin/events/:id/registrations → Registrations Table
/admin/notify/:eventId         → Bulk Notifications
```

---

### 6.4 Component Architecture

```
src/
├── main.jsx
├── App.jsx                          # Router + auth guards
│
├── styles/                          # Global SCSS (7-1 pattern)
│
├── pages/
│   ├── Landing/
│   │   ├── Landing.jsx
│   │   └── Landing.module.scss
│   ├── EventDetail/
│   │   ├── EventDetail.jsx
│   │   └── EventDetail.module.scss
│   ├── RegisterForm/
│   │   ├── RegisterForm.jsx
│   │   └── RegisterForm.module.scss
│   ├── RegisterSuccess/
│   │   ├── RegisterSuccess.jsx
│   │   └── RegisterSuccess.module.scss
│   ├── Login/
│   │   ├── Login.jsx
│   │   └── Login.module.scss
│   ├── Profile/
│   │   ├── Profile.jsx
│   │   └── Profile.module.scss
│   └── admin/
│       ├── AdminLogin/
│       ├── AdminDashboard/
│       ├── ManageEvents/
│       ├── EventForm/
│       ├── Registrations/
│       └── Notify/
│
├── components/
│   ├── layout/
│   │   ├── Navbar/            Navbar.jsx + .module.scss
│   │   ├── Footer/            Footer.jsx + .module.scss
│   │   └── AdminSidebar/      AdminSidebar.jsx + .module.scss
│   ├── events/
│   │   ├── EventCard/         EventCard.jsx + .module.scss
│   │   └── EventBadge/        EventBadge.jsx + .module.scss
│   ├── forms/
│   │   ├── DynamicForm/       DynamicForm.jsx + .module.scss
│   │   ├── DynamicField/      DynamicField.jsx + .module.scss
│   │   ├── HtmlFormRenderer/  HtmlFormRenderer.jsx + .module.scss  ← iframe sandbox
│   │   └── OtpInput/          OtpInput.jsx + .module.scss
│   ├── admin/
│   │   ├── RegistrationTable/ RegistrationTable.jsx + .module.scss
│   │   ├── StatsCard/         StatsCard.jsx + .module.scss
│   │   ├── ExportButton/      ExportButton.jsx + .module.scss
│   │   └── FormBuilder/       FormBuilder.jsx + .module.scss
│   └── ui/
│       ├── Button/            Button.jsx + .module.scss
│       ├── Modal/             Modal.jsx + .module.scss
│       ├── Toast/             Toast.jsx + .module.scss
│       ├── Loader/            Loader.jsx + .module.scss
│       ├── Badge/             Badge.jsx + .module.scss
│       └── EmptyState/        EmptyState.jsx + .module.scss
│
├── hooks/
│   ├── useAuth.js
│   ├── useEvent.js
│   └── useRegistration.js
│
├── services/
│   └── api.js                 # Axios + interceptors
│
├── store/
│   └── authStore.js           # Zustand: user, token, isAdmin
│
├── utils/
│   ├── validators.js
│   └── formatters.js
│
└── constants/
    ├── streams.js
    └── routes.js
```

---

### 6.5 Dynamic Form System

#### Mode 1: JSON Schema
```jsx
// DynamicField.jsx
const DynamicField = ({ field, register, errors, control }) => {
  switch (field.type) {
    case 'text':     return <TextInput     {...field} register={register} errors={errors} />;
    case 'phone':    return <PhoneInput    {...field} register={register} errors={errors} />;
    case 'email':    return <EmailInput    {...field} register={register} errors={errors} />;
    case 'select':   return <SelectInput   {...field} control={control} />;
    case 'number':   return <NumberInput   {...field} register={register} errors={errors} />;
    case 'date':     return <DateInput     {...field} register={register} errors={errors} />;
    case 'radio':    return <RadioGroup    {...field} control={control} />;
    case 'checkbox': return <CheckboxGroup {...field} control={control} />;
    case 'textarea': return <TextArea      {...field} register={register} errors={errors} />;
    default:         return <TextInput     {...field} register={register} errors={errors} />;
  }
};
```

#### Mode 2: Raw HTML Form (Sandboxed iframe)
```jsx
// HtmlFormRenderer.jsx
const HtmlFormRenderer = ({ htmlString, onSubmit }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    // Inject postMessage intercept before rendering
    const intercept = `
      <script>
        document.querySelector('form')?.addEventListener('submit', function(e) {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(e.target));
          window.parent.postMessage({ type: 'FORM_SUBMIT', data }, '*');
        });
      </script>
    `;
    const doc = iframeRef.current?.contentDocument;
    doc.open(); doc.write(htmlString + intercept); doc.close();
  }, [htmlString]);

  useEffect(() => {
    const handler = (e) => { if (e.data?.type === 'FORM_SUBMIT') onSubmit(e.data.data); };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onSubmit]);

  return (
    <iframe
      ref={iframeRef}
      // allow-same-origin intentionally EXCLUDED — prevents cookie/API access
      sandbox="allow-scripts allow-forms"
      title="Event Registration Form"
      className={styles.formIframe}
    />
  );
};
```

---

### 6.6 Click-to-Register Flow

Events with `registration_type: "click_to_register"` skip the form entirely.

```
Event Card → "Login to Register" (if not logged in)
           → "Register Now — 1 Click" (if logged in)

Logged-in click → /events/:id/confirm
Confirm page:
  - Show event details + student's profile summary
  - "Confirm Registration" button → POST /registrations/:id/click
  - On success → /register/success
```

---

## 7. Authentication Flow (Twilio OTP)

### Student Login
```
1. Enter phone → POST /auth/otp/send
2. Backend: generate OTP → bcrypt hash → DynamoDB (5-min TTL) → Twilio SMS
3. Enter 6-digit OTP in animated 6-box input
4. POST /auth/otp/verify → Backend validates → Issues JWT (24h)
5. JWT stored in Zustand + httpOnly cookie
6. Redirect to /profile (or back to event page)
```

### Admin Login
```
POST /auth/admin/login { username, password }
Backend: bcrypt verify → issue JWT (8h, role: admin)
Redirect to /admin
```

### JWT Strategy
- Stored in **httpOnly cookies** — not localStorage (prevents XSS theft)
- Axios interceptor attaches `Authorization: Bearer <token>` on all requests
- FastAPI `get_current_user` + `require_admin` dependencies validate on protected routes

---

## 8. Admin Dashboard

### Event Management
- Create/edit events with all metadata
- Choose form type (JSON schema with Form Builder, or paste raw HTML)
- Choose registration type (Full Form or Click to Register)
- Toggle status: Draft → Active → Closed

### Registration Management
- Paginated, searchable, filterable table
- Slide-out panel on row click for full registration detail
- Export CSV / Excel (respects active filters)

### Statistics
- 4 KPI stat cards
- Stream donut chart, district bar chart, daily trend line chart (area fill)
- Seat fill rate indicator if seat limit configured

### Bulk Notifications
- Compose custom message
- Select recipients (all / by stream / by district) with live count preview
- Send via Twilio SMS + SES Email
- Notification history log

---

## 9. Notification System

### Automated (On Registration)
| Channel | Content |
|---|---|
| **SMS** | "Hi [Name]! Registered for [Event]. Reg ID: GCK-2026-XXXXX. Date: [Date], [Venue]." |
| **Email** | Branded HTML email with event details + PDF admit card attached |
| **PDF** | Generated by ReportLab: name, Reg ID (large), QR code, event details, instructions |

### Admin Bulk Notifications
- Async Lambda background tasks — no timeout on large lists
- Supports SMS (Twilio) + Email (SES) in a single send action

---

## 10. Extensibility — Future Events

### Three Registration Modes (All Supported in v1)

| Mode | `registration_type` | `form_type` | Use Case |
|---|---|---|---|
| Full JSON Form | `form` | `json_schema` | Standard counseling — admin-configured fields |
| Full HTML Form | `form` | `html` | Custom-designed form pasted as raw HTML |
| Click to Register | `click_to_register` | n/a | Webinars, quick-signup — login required |

### Adding a New Event — Zero Code Change
1. Admin creates event → sets metadata, registration type, form type
2. JSON schema: drag-and-drop Form Builder
3. HTML form: paste raw HTML → stored in `form_html` DynamoDB field
4. Publish → event appears on landing page automatically
5. Frontend dynamically selects correct renderer (DynamicForm vs HtmlFormRenderer)
6. Backend validates accordingly

### Future Paid Events
- `is_paid` + `fee_amount` already in Event schema
- Add `payment_gateway` field + Razorpay integration later
- Add `payment_status` to Registration

### Future Slots / Batches
- Add `slots` array to Event schema
- Frontend shows slot selector, backend checks capacity atomically

### Future Gujarati UI
- i18next already configured
- Add `src/locales/gu.json` + language toggle in Navbar

---

## 11. Deployment Strategy

### Frontend — Vercel
```
Build: npm run build  |  Output: dist  |  Node: 20.x
Env: VITE_API_BASE_URL, VITE_APP_NAME, VITE_CONTACT_EMAIL
```

### Backend — AWS Lambda + API Gateway
```
Framework:  Serverless Framework
Runtime:    Python 3.11
Handler:    app.main.handler (Mangum)
Memory:     512MB  |  Timeout: 30s
Region:     ap-south-1 (Mumbai)
API type:   HTTP API v2
```

### DynamoDB
```
Billing: On-demand (PAY_PER_REQUEST)
Region:  ap-south-1
Backup:  Point-in-time recovery enabled
TTL:     Enabled on expires_at (OTP records)
```

### S3
```
Bucket: gujcet-platform-pdfs
Access: Private, pre-signed URLs (1-hour expiry)
```

---

## 12. Folder Structure

```
gujcet-platform/
├── frontend/
│   ├── src/                     # See section 6.4
│   ├── public/
│   │   └── fonts/               # Self-hosted Inter
│   ├── index.html
│   ├── vite.config.js           # SCSS auto-imports, @ alias
│   └── package.json
│
├── backend/
│   ├── app/                     # See section 5.1
│   ├── tests/
│   ├── requirements.txt
│   ├── serverless.yml
│   └── .env.example
│
└── README.md
```

#### Vite Config (SCSS auto-import)
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  css: {
    modules: { localsConvention: 'camelCase' },
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "@/styles/abstracts/variables" as *;
          @use "@/styles/abstracts/mixins" as *;
        `
      }
    }
  }
});
```

---

## 13. Development Phases & Milestones

### Phase 1 — Foundation (Week 1–2)
- [ ] Monorepo setup: Vite + React + SCSS 7-1 architecture
- [ ] FastAPI boilerplate + Mangum + CORS config
- [ ] DynamoDB table creation (local dev with DynamoDB Local)
- [ ] Global SCSS design system: variables, mixins, reset, typography, animations
- [ ] Auth APIs: Twilio OTP + JWT (student + admin)
- [ ] Navbar, Footer, Button, Badge, Loader, Toast UI components

### Phase 2 — Registration Core (Week 3–4)
- [ ] JSON schema dynamic form (DynamicForm + all DynamicField types)
- [ ] HTML form renderer (HtmlFormRenderer, sandboxed iframe + postMessage)
- [ ] Registration API: full flow (validate → save → PDF → SMS → Email)
- [ ] PDF admit card generation (ReportLab + QR code) + S3 upload
- [ ] Landing page (hero, stats, event cards, how-it-works, FAQ)
- [ ] Event detail page + Registration form page + Success page

### Phase 3 — Auth + Student Portal (Week 5)
- [ ] Student OTP login page (animated 6-box input)
- [ ] Student profile page
- [ ] Click-to-register flow + confirmation page
- [ ] Protected route guards (student + admin)

### Phase 4 — Admin Dashboard (Week 6–7)
- [ ] Admin login page + sidebar layout
- [ ] Stats dashboard with charts
- [ ] Registration table with filters, search, pagination, slide-out detail panel
- [ ] Export CSV / Excel
- [ ] Event form builder (JSON schema drag-and-drop + HTML paste mode)
- [ ] Bulk notification composer

### Phase 5 — Polish & Deploy (Week 8)
- [ ] Full mobile responsiveness across all pages
- [ ] Error boundaries, 404 page, loading skeletons, empty states
- [ ] Lambda + API Gateway production deploy
- [ ] Vercel production deploy
- [ ] CORS final config (production origins only)
- [ ] End-to-end smoke testing

---

## 14. Environment Variables

### Backend (`.env`)
```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
DYNAMODB_TABLE_NAME=gujcet-platform
S3_BUCKET_NAME=gujcet-platform-pdfs

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

SES_SENDER_EMAIL=noreply@yourdomain.com

JWT_SECRET_KEY=
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24
ADMIN_JWT_EXPIRY_HOURS=8

ADMIN_USERNAME=
ADMIN_PASSWORD_HASH=         # bcrypt hash

FRONTEND_URL=https://yourdomain.vercel.app
FRONTEND_CUSTOM_URL=https://yourdomain.com
ENVIRONMENT=production
```

### Frontend (`.env`)
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_NAME=GUJCET Free Counseling
VITE_CONTACT_EMAIL=support@yourdomain.com
```

---

## 15. Open Decisions / Future Considerations

| Topic | Current Plan | Notes |
|---|---|---|
| Seat limits | Optional, off by default | Toggle per event; atomic DynamoDB counter |
| Payment | Not in v1 | `is_paid` + `fee_amount` in schema — add Razorpay later |
| Gujarati UI | Not in v1 | i18next wired in, add `gu.json` + toggle when ready |
| WhatsApp OTP | Not in v1 | Easy swap in `twilio_service.py` |
| Waitlist | Not in v1 | Add `waitlisted` status to Registration |
| GUJCET score field | Not in base form | Admin adds via Form Builder per event |
| Monitoring | CloudWatch (default) | Add Sentry to frontend later |
| Custom domain | Optional | Route53 + ACM + Vercel custom domain |

---

*Planning document version 2.0 — March 2026*  
*All 9 changes incorporated. Ready for development kickoff.*
