# L2CS ERP — Phase 1 MVP

Internal ERP system for Level 2 Computer Solutions. Manages customers, support tickets, email integration (O365), activities timeline, and compliance tracking.

## Tech Stack

- **Backend:** FastAPI + SQLAlchemy 2.0 async + asyncpg + Pydantic v2
- **Frontend:** Next.js 15 (App Router) + Tailwind CSS + shadcn/ui components
- **Database:** PostgreSQL 16 (via Docker)
- **Auth:** JWT (simple internal auth)

## Quick Start

### 1. Start PostgreSQL

```bash
docker-compose up -d
```

### 2. Set up the Backend

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run migrations
python -m app.migrations.apply

# Start the API server
uvicorn app.main:app --reload --port 8000
```

### 3. Set up the Frontend

```bash
cd apps/web
npm install
npm run dev
```

### 4. Open the App

- **Frontend:** http://localhost:3000
- **API docs:** http://localhost:8000/docs
- **Login:** `admin@level2solutions.io` / `admin123`

## Project Structure

```
/apps
  /api                    FastAPI backend
    /app
      /core               Config, auth, database, UUID
      /migrations/sql     Raw SQL migration files
      /models             SQLAlchemy models
      /routes             API route handlers
      /schemas            Pydantic request/response models
      /services           Business logic + O365 provider
  /web                    Next.js frontend
    /src
      /app                App Router pages
      /components/ui      shadcn-style UI components
      /lib                API client, utilities
/packages
  /shared                 Shared types (reserved)
```

## API Endpoints

### Auth
- `POST /auth/login` — Login, returns JWT
- `GET /auth/me` — Current user info

### Customers
- `GET /customers` — List (search, risk_status, cmmc_status filters)
- `POST /customers` — Create
- `GET /customers/{id}` — Detail
- `PATCH /customers/{id}` — Update
- `POST /customers/{id}/domains` — Add domain
- `DELETE /customers/{id}/domains/{domain_id}` — Remove domain
- `GET /customers/{id}/mailbox-mappings` — List mailbox mappings
- `POST /customers/{id}/mailbox-mappings` — Create mapping
- `PATCH /customers/{id}/mailbox-mappings/{mapping_id}` — Update mapping
- `DELETE /customers/{id}/mailbox-mappings/{mapping_id}` — Delete mapping
- `GET /customers/{id}/activities` — Activity timeline
- `GET /customers/{id}/tickets` — Customer tickets
- `GET /customers/{id}/emails` — Emails from mapped folders

### Tickets
- `GET /tickets` — List (status, assigned_to, customer_id, unassigned filters)
- `POST /tickets` — Create (auto-calculates SLA)
- `GET /tickets/{id}` — Detail
- `PATCH /tickets/{id}` — Update status/priority/assignment
- `GET /tickets/{id}/messages` — Message thread
- `POST /tickets/{id}/messages` — Add reply or internal note

### Ingestion
- `POST /ingest/support-email` — Ingest support email (idempotent, auto-matches customer)

### Integrations
- `GET /integrations/o365/mailboxes` — List available mailboxes
- `GET /integrations/o365/folders?mailbox=...` — List folders for mailbox

### Lookups
- `GET /lookups` — All lookup types
- `GET /lookups/{type_key}` — Values for a lookup type

### Users
- `GET /users` — List internal users

## Database

All tables use UUID primary keys (UUIDv7 generated in Python). Lookup values use a flexible `lookup_types` + `lookup_values` pattern with system-lock fields.

### Seeded Data
- **User:** admin@level2solutions.io (password: admin123)
- **Lookup types:** ticket_status, ticket_priority, risk_status, cmmc_status, ticket_category
- **System settings:** internal_domains, support_inbox, default_week_start, activity_cache_minutes

## Phase 2 Roadmap
- Real Microsoft Graph API integration for email
- Azure Function deployment for email ingestion
- Meeting transcript processing
- Billing/sales/time-tracking UI
- Entra SSO (OIDC)
- Fine-grained RBAC
