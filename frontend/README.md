# GUJCET Platform — Frontend

React 18 + Vite frontend with CSS Modules/SCSS, deployed on Vercel.

## Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn

### Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API URL
```

### Development

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build → dist/
npm run preview   # Preview production build
npm run lint      # ESLint
```

## Project Structure

```
src/
├── main.jsx                    # React entry + QueryClient + Toaster
├── App.jsx                     # Router + ProtectedRoute + AdminRoute guards
├── styles/                     # Global SCSS (7-1 pattern)
│   ├── abstracts/              # _variables.scss, _mixins.scss, _functions.scss
│   ├── base/                   # _reset.scss, _typography.scss, _animations.scss
│   ├── layout/                 # _grid.scss, _containers.scss
│   ├── themes/                 # _default.scss (CSS custom properties)
│   └── main.scss               # Single import entry point
├── pages/                      # One folder per page
│   ├── Landing/                # Hero, stats, event cards, how-it-works, FAQ
│   ├── EventDetail/            # Two-column: details + sticky registration card
│   ├── RegisterForm/           # Phone entry → dynamic form (JSON or HTML iframe)
│   ├── RegisterSuccess/        # Animated checkmark, reg ID, PDF download
│   ├── Login/                  # Phone + 6-box OTP input
│   ├── Profile/                # Sidebar profile + registration cards
│   └── admin/                  # Admin dashboard, event management, registrations
├── components/
│   ├── layout/                 # Navbar, Footer, AdminSidebar
│   ├── events/                 # EventCard, EventBadge
│   ├── forms/                  # DynamicForm, DynamicField, HtmlFormRenderer, OtpInput
│   └── ui/                     # Button, Modal, Loader, Badge, EmptyState
├── hooks/                      # useAuth, useEvent, useRegistration
├── services/api.js             # Axios instance + interceptors + all API functions
├── store/authStore.js          # Zustand: user, token, isAdmin
├── constants/                  # routes.js, streams.js
└── utils/formatters.js         # Date formatting helpers
```

## Key Concepts

### State Management
- **Server state**: TanStack Query v5 — caching, background refetch, stale-while-revalidate
- **Auth state**: Zustand store (`authStore.js`) — token, user, isAdmin
- **Form state**: React Hook Form — per-field validation, error display

### Routing & Auth Guards
- `ProtectedRoute` — redirects to `/login` if not authenticated
- `AdminRoute` — redirects to `/admin/login` if not admin
- Navbar is hidden on admin pages (admin uses sidebar navigation)

### Dynamic Form System
Two rendering modes based on `event.form_type`:

1. **JSON Schema** (`DynamicForm` + `DynamicField`) — renders form fields from a JSON array. Supports: text, phone, email, number, date, select, radio, checkbox, textarea.

2. **Raw HTML** (`HtmlFormRenderer`) — renders admin-pasted HTML inside a sandboxed `<iframe sandbox="allow-scripts allow-forms">`. Form submission is intercepted via `postMessage`. No `allow-same-origin` — prevents XSS.

### SCSS Architecture
- **7-1 pattern**: abstracts, base, layout, themes + per-component `.module.scss`
- Variables and mixins are **auto-injected** via `vite.config.js` `additionalData` — do not manually `@use` them in module files
- Key mixins: `card`, `button-primary`, `button-secondary`, `input-base`, `flex-center`, `flex-between`, `respond-to`, `section-heading`, `container`

### API Integration
All API calls go through `services/api.js`:
- Axios interceptors auto-attach JWT token
- 401 responses trigger automatic logout
- Organized by domain: `authAPI`, `eventsAPI`, `registrationsAPI`, `adminAPI`

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `$color-primary` | `#1A3C6E` | Navy — headings, footer |
| `$color-primary-light` | `#2563EB` | Blue — CTAs, links, focus rings |
| `$color-accent` | `#F59E0B` | Amber — highlights, hero CTA |
| `$color-success` | `#10B981` | Green — confirmed badges |
| `$color-danger` | `#EF4444` | Red — errors, closed badges |

Breakpoints: `sm: 480px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`

## Deployment (Netlify)

```
Base directory: frontend
Build command:  npm run build
Publish dir:    dist
Node version:   20.x
Env variables:  VITE_API_BASE_URL, VITE_APP_NAME, VITE_CONTACT_EMAIL
```
