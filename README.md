# Customer Feedback Insights

A production-grade, full-stack application built for **Customer Support Teams** and **Support Managers** to view, triage, and manage customer feedback with the assistance of Generative AI.

The application incorporates a **Human-in-the-Loop** AI architecture: LLM models analyze customer sentiment, suggest categories, and generate concise summaries, while support managers retain full authority to review, override, and accept recommendations before any data is permanently stored.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
  - [Key Technical Decisions](#key-technical-decisions)
- [Core Features](#core-features)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Human-in-the-Loop GenAI Workflow](#human-in-the-loop-genai-workflow)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Option A: Running with Docker Compose (Recommended)](#option-a-running-with-docker-compose-recommended)
  - [Option B: Running Locally (Bare Metal)](#option-b-running-locally-bare-metal)
- [Default Seed & Credentials](#default-seed--credentials)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Tickets](#tickets)
  - [GenAI Triage](#genai-triage)
- [GenAI Provider Strategy](#genai-provider-strategy)
- [Frontend Architecture & State Flow](#frontend-architecture--state-flow)
- [Environment Variables](#environment-variables)
- [Observability & Health Checks](#observability--health-checks)
- [Production Roadmap](#production-roadmap)

---

## Architecture Overview

### Key Technical Decisions

| Decision Area | Chosen Solution | Rationale |
|---|---|---|
| **Data Layer** | SQLModel (SQLAlchemy + Pydantic) | Eliminates schema drift by unifying database models and API response contracts in a single declarative definition. |
| **Database** | SQLite via `aiosqlite` | Zero external setup for local evaluation, isolated container volumes, and an asynchronous engine ready to switch to PostgreSQL by changing `DATABASE_URL`. |
| **Frontend Framework** | Next.js 16 (App Router) + React 19 | Server Component rendering for immediate queue loads and SSR security, paired with Client Components for rich reactive interactions and cache invalidation. |
| **Authentication & Session** | JWT + HttpOnly Cookies (BFF Pattern) | Avoids storing authentication tokens in browser `localStorage`. Next.js API route handlers act as a Backend-For-Frontend (BFF), forwarding Bearer tokens while keeping cookies secure and `httpOnly`. |
| **Password Security** | Argon2 (`pwdlib[argon2]`) | Modern, memory-hard hashing standard replacing legacy bcrypt/passlib algorithms. |
| **Non-Authoritative AI** | Dual-phase `/analyze` & `/accept` | Generative AI is strictly advisory. The `/analyze` endpoint outputs transient suggestions, and only an explicit `/accept` call with human oversight persists data to the database. |
| **LLM Strategy** | Protocol-based Strategy Pattern | Clean abstraction layer (`LLMProvider`) that supports switching between deterministic offline mock inferences and live OpenAI models without changing business logic. |
| **Observability** | `structlog` + Request Tracing | Structured JSON logs in production, pretty formatted logs in development, and end-to-end request tracing via `X-Request-ID`. |

---

## Core Features

- **Queue Management & Analytics**:
  - Live metric summary cards for total inquiries, pending triages, analyzed tickets, and complex tickets.
  - Multi-dimensional filtering by ticket status (`open`, `pending_analysis`, `analyzed`, `resolved`, `closed`) and complexity (`is_complex`).
  - Server-paginated data table with instant URL state reflection.
- **Human-in-the-Loop AI Triage**:
  - On-demand AI analysis calculating issue category, sentiment polarity, confidence score, and concise summary.
  - Interactive manager review card allowing field-level edits prior to committing to the database.
  - Audit trail tracking which manager reviewed and approved the analysis.
- **Ticket Lifecycle & Complexity Controls**:
  - Dedicated ticket detail view displaying customer email, creation timestamp, and original inquiry text.
  - In-place status transitions and a one-click toggle for marking tickets as complex for senior escalation.
- **Role-Based Access Control & Team Management**:
  - Distinct capabilities for `support_manager` and `support_agent`.
  - Next.js edge middleware enforcing route guards and role restrictions.
  - Manager-only interface to provision new team members with granular roles.

---

## Role-Based Access Control (RBAC)

The system enforces permissions at both the **FastAPI dependency level** and the **Next.js middleware level**:

| Capability | Support Agent | Support Manager | Enforced At |
|---|:---:|:---:|---|
| View Ticket Queue (`/tickets`) | ✅ | ✅ | Backend (`require_auth`) & Middleware |
| View Ticket Details (`/tickets/[id]`) | ✅ | ✅ | Backend (`require_auth`) & Middleware |
| Create New Tickets (`/tickets/new`) | ❌ | ✅ | Backend (`require_support_manager`) & Middleware |
| Change Ticket Status & Complexity | ❌ | ✅ | Backend (`require_support_manager`) & UI Guard |
| Trigger GenAI Analysis (`/analyze`) | ❌ | ✅ | Backend (`require_support_manager`) & BFF Route |
| Edit & Accept AI Analysis (`/accept`) | ❌ | ✅ | Backend (`require_support_manager`) & BFF Route |
| Access Team Management (`/team`) | ❌ | ✅ | Backend (`require_support_manager`) & Middleware |
| Provision New Users (`/api/v1/auth/signup`) | ❌ | ✅ | Backend (`require_support_manager`) |

---

## Human-in-the-Loop GenAI Workflow

```
1. Ticket Ingested ────▶ [Status: OPEN]
                               │
2. Manager clicks              │
   "Analyze with AI" ──────────▶ POST /api/v1/tickets/{id}/analyze
                               │  (Transient inference — nothing is written to DB)
                               ▼
3. Review Interface ◀─── Returns AnalysisResult:
   Displays:                   • suggested_category (e.g. "billing")
                               • suggested_sentiment (e.g. "negative")
                               • summary (1-2 sentence overview)
                               • confidence_score (e.g. 0.94)
                               │
4. Manager Decision            ├─ Option A: Keep suggestions as-is
                               └─ Option B: Override category, sentiment, or summary
                               │
5. Manager clicks              │
   "Accept & Save" ────────────▶ POST /api/v1/tickets/{id}/accept
                               │  (Deterministic DB write)
                               ▼
                        [Status: ANALYZED]
                        • TicketAnalysis record created & linked
                        • reviewed_by stamped with manager ID
                        • Audit trail visible to entire team
```

---

## Project Structure

```
pwc-case-study/
├── .env.example                  # Environment configuration template
├── docker-compose.yml            # Multi-container orchestration (FastAPI + Next.js)
├── README.md                     # Project documentation
│
├── backend/
│   ├── Dockerfile                # Multi-stage Python 3.11 slim image (non-root runner)
│   ├── requirements.txt          # Pinned backend dependencies
│   ├── pyrefly.toml              # Type checking & linter configuration
│   └── app/
│       ├── main.py               # FastAPI app factory, CORS, request tracing, health probes
│       ├── api/v1/
│       │   ├── __init__.py       # API v1 router mounting /auth and /tickets
│       │   ├── auth.py           # Endpoints: POST /login, POST /signup
│       │   └── tickets.py        # Endpoints: CRUD, POST /analyze, POST /accept
│       ├── core/
│       │   ├── config.py         # Pydantic Settings loaded from env vars
│       │   ├── database.py       # Async SQLAlchemy engine, session generator & DB seeder
│       │   ├── logging.py        # Structlog configuration (JSON for prod, colored for dev)
│       │   └── security.py       # Password hashing, token generation & auth dependencies
│       ├── models/
│       │   ├── __init__.py       # Models export
│       │   ├── ticket.py         # Ticket, TicketAnalysis, Enums, and Pydantic schemas
│       │   └── user.py           # User SQLModel, UserRole, UserCreate, and UserLogin
│       └── services/
│           ├── auth_service.py   # JWT decoding, user context, and RBAC guards
│           ├── genai.py          # LLMProvider Protocol, MockLLMProvider, and OpenAIProvider
│           └── ticket_service.py # Business logic, pagination queries, and persistence
│
└── frontend/
    ├── Dockerfile                # Multi-stage Node.js 22 alpine image (non-root runner)
    ├── package.json              # Next.js 16, React 19, TanStack Query, Tailwind v4
    ├── next.config.ts            # Next.js runtime settings
    └── src/
        ├── middleware.ts         # Edge route guard for authentication & manager RBAC
        ├── app/
        │   ├── layout.tsx        # Global HTML shell & TanStack Query Provider
        │   ├── globals.css       # Tailwind CSS styles and custom utilities
        │   ├── not-found.tsx     # 404 handler
        │   ├── (auth)/
        │   │   └── login/        # Sign-in page with prefill shortcuts
        │   ├── (dashboard)/
        │   │   ├── layout.tsx    # Protected shell with sticky navigation & AuthProvider
        │   │   ├── error.tsx     # Error boundary for unexpected exceptions
        │   │   ├── team/         # Team member registration page (Manager-only)
        │   │   └── tickets/
        │   │       ├── page.tsx  # Feedback queue dashboard with KPI stats & filters
        │   │       ├── new/      # Ticket creation form (Manager-only)
        │   │       └── [id]/     # Detail view with status controls & AI triage card
        │   └── api/              # BFF route handlers (manages httpOnly session cookies)
        │       ├── auth/login/   # Proxies credentials to backend & sets session cookie
        │       ├── auth/logout/  # Clears authentication cookies
        │       ├── team/signup/  # Proxies user creation with manager bearer token
        │       └── tickets/      # Proxies list, create, patch, analyze, and accept
        ├── components/
        │   ├── auth/             # LoginForm with loading states & error callouts
        │   ├── common/           # Curated badges for status, category, sentiment & complexity
        │   ├── layout/           # Responsive TopNav with role pills & mobile drawer
        │   ├── team/             # UserCreateForm with role selection & validation
        │   └── tickets/          # AIAnalysisCard, TicketTable, TicketFilters, TicketForm...
        ├── context/
        │   └── AuthContext.tsx   # Client session context: useAuth() and useManager()
        ├── lib/
        │   ├── apiClient.ts      # Dual-mode HTTP client (browser vs SSR container network)
        │   └── auth.ts           # Server-side JWT decoding and cookie utilities
        └── types/
            └── index.ts          # TypeScript interfaces mirroring API contracts
```

---

## Quick Start

### Prerequisites

- **Docker & Docker Compose** (v2+) installed, **OR**
- **Node.js** (v20+) & **Python** (3.11+) for local bare-metal execution.

---

### Option A: Running with Docker Compose (Recommended)

1. **Clone the repository and enter the directory**:
   ```bash
   git clone <repo-url>
   cd pwc-case-study
   ```

2. **Create the environment file**:
   ```bash
   cp .env.example .env
   ```
   *(The default settings work immediately out-of-the-box using the mock GenAI provider).*

3. **Build and launch both containers**:
   ```bash
   docker compose up --build
   ```

4. **Access the application**:
   - **Frontend UI**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:8000](http://localhost:8000)
   - **Interactive API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Alternative API Docs (ReDoc)**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### Option B: Running Locally (Bare Metal)

#### 1. Start the Backend

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The database will be initialized automatically in `backend/data/feedback.db` and the default manager account will be seeded on startup.

#### 2. Start the Frontend

Open a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Start the Next.js development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Default Seed & Credentials

When the backend launches for the first time, it automatically creates an initial **Support Manager** account if no manager exists in the database:

| Role | Username | Email | Password |
|---|---|---|---|
| **Support Manager** | `manager` | `manager@example.com` | `demo-password` |

> [!TIP]
> After logging in as `manager`, navigate to **Team & Access** in the top navigation bar to provision additional accounts (e.g., standard `support_agent` accounts) to test role-restricted workflows.

---

## API Reference

### Authentication

#### `POST /api/v1/auth/login`
Authenticates user credentials and returns a signed JWT access token. Accepts either `username` or `email`.

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "manager", "password": "demo-password"}'
```

**Response (`200 OK`)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer"
}
```

#### `POST /api/v1/auth/signup` *(Support Manager Only)*
Registers a new user account. Requires a valid Support Manager Bearer token.

```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Authorization: Bearer <MANAGER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "agent_sarah",
    "email": "sarah@example.com",
    "password": "agent-password-123",
    "role": "support_agent"
  }'
```

---

### Tickets

#### `GET /api/v1/tickets`
Returns a paginated list of tickets. Supports query parameters:
- `page` (integer, default: `1`)
- `page_size` (integer, default: `20`, max: `100`)
- `status` (`open`, `pending_analysis`, `analyzed`, `resolved`, `closed`)
- `is_complex` (`true`, `false`)

```bash
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:8000/api/v1/tickets?page=1&page_size=15&status=open"
```

#### `POST /api/v1/tickets` *(Support Manager Only)*
Creates a new customer feedback ticket.

```bash
curl -X POST http://localhost:8000/api/v1/tickets \
  -H "Authorization: Bearer <MANAGER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Payment failed during renewal checkout",
    "customer_email": "customer@acme.corp",
    "body": "I received an error 4002 when renewing our enterprise annual subscription today.",
    "is_complex": false
  }'
```

#### `GET /api/v1/tickets/{ticket_id}`
Retrieves a single ticket along with its associated AI analysis (if completed).

#### `PATCH /api/v1/tickets/{ticket_id}` *(Support Manager Only)*
Partially updates a ticket (status, complexity, title, or body).

```bash
curl -X PATCH http://localhost:8000/api/v1/tickets/<TICKET_UUID> \
  -H "Authorization: Bearer <MANAGER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved", "is_complex": true}'
```

---

### GenAI Triage

#### `POST /api/v1/tickets/{ticket_id}/analyze` *(Support Manager Only)*
Sends the ticket content to the configured LLM provider and returns an advisory suggestion. **This step does not write to the database.**

**Response (`200 OK`)**:
```json
{
  "suggested_category": "billing",
  "suggested_sentiment": "negative",
  "summary": "Customer encountered error 4002 while attempting to renew an enterprise annual subscription.",
  "confidence_score": 0.942,
  "raw_llm_response": "{\"suggested_category\": \"billing\", ...}"
}
```

#### `POST /api/v1/tickets/{ticket_id}/accept` *(Support Manager Only)*
Saves the reviewed analysis, applies any manager overrides, records the reviewer's username, and advances ticket status to `analyzed`.

```bash
curl -X POST http://localhost:8000/api/v1/tickets/<TICKET_UUID>/accept \
  -H "Authorization: Bearer <MANAGER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "analysis_result": {
      "suggested_category": "billing",
      "suggested_sentiment": "negative",
      "summary": "Customer encountered error 4002 while attempting to renew subscription.",
      "confidence_score": 0.942
    },
    "accept_payload": {
      "suggested_category": "billing",
      "suggested_sentiment": "negative",
      "summary": "Customer encountered error 4002 during enterprise renewal. Escalated to billing."
    }
  }'
```

---

## GenAI Provider Strategy

The backend abstracts LLM operations through Python protocols (`LLMProvider`), allowing zero-friction provider switching via the `GENAI_PROVIDER` environment variable.

| Provider | Setting | Requirements | Characteristics |
|---|---|---|---|
| **Mock** | `GENAI_PROVIDER=mock` | None | Deterministic, title-hash seeded responses. Zero API cost, instant execution, ideal for automated tests and offline development. |
| **OpenAI** | `GENAI_PROVIDER=openai` | `OPENAI_API_KEY`<br>`OPENAI_MODEL` | Live calls to the OpenAI Chat Completions API (`gpt-4o-mini` by default) with strict JSON response formatting and exponential backoff retry policies via `tenacity`. |

### Configuring Live OpenAI Analysis

In your `.env` file:
```env
GENAI_PROVIDER=openai
OPENAI_API_KEY=sk-your-actual-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

---

## Frontend Architecture & State Flow

1. **Dual Network Resolution (`apiClient.ts`)**:
   - In the **browser**, client queries communicate with Next.js route handlers (`/api/...`) or directly with the backend.
   - During **Server-Side Rendering (SSR)** in Docker, queries communicate directly via the internal container network (`http://backend:8000`), avoiding hairpin NAT issues.
2. **Backend-For-Frontend (BFF) Pattern**:
   - Browser client scripts never handle raw JWT tokens directly.
   - Login responses set secure, `httpOnly`, `sameSite: lax` session cookies.
   - Next.js route handlers inspect incoming cookies, validate session viability, and forward authorization headers to FastAPI.
3. **Optimistic & Reactive Cache Updates**:
   - Built on `@tanstack/react-query` v5.
   - Status updates, complexity toggles, and analysis approvals trigger automatic cache invalidation and UI revalidation via `router.refresh()`.
4. **Resilient User Experience**:
   - Graceful loading skeletons and spinners during mutations.
   - Error boundaries (`error.tsx`) catching network anomalies with one-click retry actions.
   - Mobile-first responsive navigation bar with auto-closing drawer on route transitions.

---

## Environment Variables

| Variable | Target | Default | Description |
|---|---|---|---|
| `APP_ENV` | Backend | `development` | Environment mode (`development`, `staging`, `production`). |
| `LOG_LEVEL` | Backend | `INFO` | Logging threshold (`DEBUG`, `INFO`, `WARNING`, `ERROR`). |
| `BACKEND_HOST` | Backend | `0.0.0.0` | Host interface for Uvicorn. |
| `BACKEND_PORT` | Both | `8000` | Exposed API port. |
| `SECRET_KEY` | Backend | `insecure-dev-key...` | Cryptographic key for signing JWTs (`openssl rand -hex 32`). |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Backend | `60` | JWT expiration duration in minutes. |
| `DATABASE_URL` | Backend | `sqlite+aiosqlite:///./data/feedback.db` | SQLAlchemy async connection string. |
| `BACKEND_CORS_ORIGINS` | Backend | `http://localhost:3000` | Allowed origins for CORS (comma-separated). |
| `DEFAULT_MANAGER_USERNAME` | Backend | `manager` | Username for automatically seeded manager. |
| `DEFAULT_MANAGER_EMAIL` | Backend | `manager@example.com` | Email for automatically seeded manager. |
| `DEFAULT_MANAGER_PASSWORD` | Backend | `demo-password` | Password for automatically seeded manager. |
| `GENAI_PROVIDER` | Backend | `mock` | Active LLM strategy (`mock` or `openai`). |
| `OPENAI_API_KEY` | Backend | `""` | API key required when using OpenAI provider. |
| `OPENAI_MODEL` | Backend | `gpt-4o-mini` | Model identifier for OpenAI completions. |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend | `http://localhost:8000` | URL used by the user's browser to reach the API. |
| `API_BASE_URL` | Frontend | `http://backend:8000` | Internal network URL used by Next.js SSR inside Docker. |

---

## Observability & Health Checks

- **Liveness Probe**: `GET /health` returns `{"status": "ok"}` when the ASGI worker is operational.
- **Readiness Probe**: `GET /ready` returns application version, runtime environment, and operational state.
- **Docker Compose Healthchecks**: The frontend container waits for the backend service to report healthy before initializing traffic:
  ```yaml
  depends_on:
    backend:
      condition: service_healthy
  ```
- **Structured Logs**: Powered by `structlog`. Every HTTP request receives an injected `X-Request-ID` header, logging duration, HTTP verb, route path, and status code.

---

## Production Roadmap

Before promoting this application to a public production deployment, consider the following hardening steps:

- [ ] **Cryptographic Keys**: Generate a high-entropy secret key (`openssl rand -hex 32`) and supply it via a secret manager.
- [ ] **Database Migration**: Switch `DATABASE_URL` to a managed PostgreSQL cluster (e.g. `postgresql+asyncpg://user:pass@host:5432/feedback_db`) and manage schema evolutions using **Alembic**.
- [ ] **Identity Provider Integration**: Replace local password storage with an enterprise OAuth2 / OIDC provider (Okta, Azure AD, Auth0, or AWS Cognito).
- [ ] **API Rate Limiting**: Enable rate limiting middleware (such as `slowapi` or an API gateway) on `/auth/login` and `/tickets/{id}/analyze`.
- [ ] **TLS / SSL Termination**: Deploy behind a reverse proxy (e.g. Nginx, Traefik, AWS ALB, or Cloudflare) with automated certificate renewals.
- [ ] **Queue Worker Offloading**: For massive feedback volumes, decouple LLM inferences using an asynchronous task worker (Celery, ARQ, or Redis Streams).
