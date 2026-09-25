# Real-Time Helpdesk & Ticketing System

[![CI](https://github.com/parth1-web/Real-Time-Helpdesk-Ticketing-System/actions/workflows/ci.yml/badge.svg)](https://github.com/parth1-web/Real-Time-Helpdesk-Ticketing-System/actions/workflows/ci.yml)

A multi-tenant SaaS helpdesk platform for customer support teams. It combines ticket management, realtime conversations, private internal notes, assignment history, SLA tracking, notifications, file attachments, customer feedback, audit activity and analytics in one full-stack application.

The project is built as a portfolio-grade reference implementation with a .NET 8 backend, React frontend, PostgreSQL persistence and SignalR realtime updates.

## Highlights

- Multi-tenant organizations with server-side organization isolation.
- Five roles: `SuperAdmin`, `OrganizationAdmin`, `SupportManager`, `SupportAgent` and `Customer`.
- JWT authentication with rotating refresh tokens and remember-me session support.
- Human-friendly ticket numbers: `TCK-000001`.
- Validated ticket lifecycle: `Open → InProgress → WaitingForCustomer → Resolved → Closed`.
- Public replies and staff-only internal notes.
- Assignment, reassignment, unassignment and assignment history.
- Priority-based SLA policies with first-response and resolution deadlines.
- Backend-controlled `OnTrack`, `AtRisk` and `Breached` SLA states.
- Background SLA monitoring with breach activity records.
- SignalR ticket and notification hubs with automatic reconnection.
- Realtime query invalidation, unread badges, toasts and connection status.
- Secure attachments with a 10 MB limit, extension/MIME allowlists and safe filenames.
- Customer feedback with a 1–5 rating after resolution.
- Server-side search, filtering, pagination and activity logs.
- Role-aware customer, agent and administrator workspaces.
- Responsive light and dark themes with accessible focus states and reduced-motion support.
- xUnit tests and GitHub Actions CI.
- No Docker or alternative UI framework.

## Technology Stack

### Backend

- .NET 8 / ASP.NET Core Web API
- Clean Architecture: `API → Application → Domain`
- EF Core 8 with PostgreSQL / Npgsql
- ASP.NET Core Identity primitives and PBKDF2 password hashing
- JWT bearer authentication and refresh-token rotation
- FluentValidation
- Serilog structured logging
- SignalR hubs
- Background `SlaMonitorService`
- Cache abstraction with memory-cache fallback and Redis-ready integration
- xUnit tests

### Frontend

- React 18 + TypeScript
- Vite
- Bootstrap 5 and React-Bootstrap
- React Router
- TanStack Query for server state
- Zustand for session, theme and UI state
- Axios with token refresh and normalized request handling
- React Hook Form + Zod
- Recharts analytics
- Lucide React icons
- Microsoft SignalR JavaScript client

## Architecture

```text
React customer / agent / admin UI
              │
       HTTP + SignalR
              │
ASP.NET Core API + middleware
              │
Application features and validation
              │
Domain entities and business rules
              │
EF Core + PostgreSQL
              │
Infrastructure services, storage, cache, background jobs
```

### Project layout

```text
.
├── src/
│   ├── Helpdesk.API/             Controllers, hubs, middleware, hosting
│   ├── Helpdesk.Application/     DTOs, interfaces, services, validators
│   ├── Helpdesk.Domain/           Entities, enums, domain rules
│   └── Helpdesk.Infrastructure/   EF Core, auth, storage, cache, jobs
├── tests/
│   ├── Helpdesk.UnitTests/
│   └── Helpdesk.IntegrationTests/
├── frontend/helpdesk-web/         React + TypeScript application
├── docs/
│   ├── api/
│   ├── architecture/
│   ├── database/
│   ├── frontend/
│   └── workflows/
├── .github/workflows/ci.yml
├── run-fullstack.ps1
└── RealTimeHelpdesk.slnx
```

## Getting Started

### Prerequisites

- .NET 8 SDK
- Node.js 20+
- PostgreSQL 14+
- PowerShell 5.1+ for the integrated task script

The default development connection string is:

```text
Host=localhost;Port=5432;Database=helpdesk;Username=postgres;Password=<set-via-secret>
```

Update it in `src/Helpdesk.API/appsettings.json` or through environment variables for your local environment.

### Run the integrated application

The frontend is built into `src/Helpdesk.API/wwwroot` and served by ASP.NET Core from one port.

```powershell
cd "C:\Users\Lenovo\OneDrive\Desktop\Real-Time HelpDesk and Ticketing system"
.\run-fullstack.ps1
```

Open:

- Application: `http://localhost:5000`
- Login: `http://localhost:5000/login`
- Register: `http://localhost:5000/register`
- Swagger: `http://localhost:5000/swagger`
- Health check: `http://localhost:5000/api/health`

In VS Code, open the repository and run:

```text
Tasks: Run Task → fullstack: integrated
```

### Run frontend and backend separately

Terminal 1:

```powershell
dotnet run --project src/Helpdesk.API --urls http://localhost:5000
```

Terminal 2:

```powershell
cd frontend/helpdesk-web
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` and `/hubs` to port `5000`.

In VS Code, use:

```text
Tasks: Run Task → fullstack: dev (backend + frontend)
```

## Demo Workspace

The development seed creates an idempotent demo workspace with sample tickets, messages, assignments, notifications, feedback and SLA data.

| Email | Role | Password |
|---|---|---|
| `admin@demo.local` | OrganizationAdmin | `Demo123!` |
| `manager@demo.local` | SupportManager | `Demo123!` |
| `agent@demo.local` | SupportAgent | `Demo123!` |
| `customer@demo.local` | Customer | `Demo123!` |
| `sara@demo.local` | Customer | `Demo123!` |

Seed data runs automatically when the database is available. The seed is safe to run repeatedly.

## User Experiences

### Customer portal

- Dashboard with open, waiting, resolved and SLA-attention metrics.
- Recent ticket list with status, priority and SLA indicators.
- Create-ticket workflow with subject, category, priority, description and attachments.
- Ticket detail conversation with realtime updates.
- Internal notes are never returned to customer API responses.
- Post-resolution satisfaction feedback.

### Agent workspace

- Productivity-focused queue with urgent and SLA-aware tickets.
- Search and filters for status, priority and department.
- Ticket conversation with public replies and staff-only internal notes.
- Assignment workflow and assignment history.
- Live connection state and notification center.

### Administrator workspace

- Support command center with ticket, SLA and CSAT metrics.
- Departments, categories and SLA policy CRUD.
- Agent management entry point.
- Reports and activity views.
- Role-protected routes and server-side authorization.

## Realtime Architecture

The frontend creates shared SignalR connections for ticket and notification events:

```text
TicketHub:       /hubs/tickets
NotificationHub: /hubs/notifications
```

Groups include:

```text
organization:{organizationId}
ticket:{ticketId}
department:{departmentId}
user:{userId}
```

Events include ticket creation, assignment, status changes, priority changes, messages, internal notes, SLA warnings and SLA breaches. Realtime broadcasts are best-effort: a disconnected hub never turns a successful database write into an API error.

## API Overview

Full endpoint details are in [`docs/api/api.md`](docs/api/api.md).

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Tickets

- `POST /api/tickets`
- `GET /api/tickets`
- `GET /api/tickets/{id}`
- `PATCH /api/tickets/{id}/status`
- `PATCH /api/tickets/{id}/priority`

### Conversations and assignment

- `GET /api/tickets/{id}/messages`
- `POST /api/tickets/{id}/messages`
- `POST /api/tickets/{id}/assign`
- `POST /api/tickets/{id}/unassign`
- `GET /api/tickets/{id}/assignments`

### Configuration and operations

- Departments, categories, SLA policies and organizations CRUD.
- Notifications and unread counts.
- Attachments and secure downloads.
- Customer feedback.
- Reports and activity logs.
- `GET /api/health` public liveness endpoint.

## Security

- Organization isolation is enforced on the server.
- Role policies protect administrator, manager and agent operations.
- Customers can access only their own tickets.
- Internal notes are filtered server-side and never sent to customers.
- Passwords use PBKDF2 hashing.
- Refresh tokens are rotated and revocable.
- Auth and write endpoints use rate limiting.
- Uploads are size-limited, type-validated and stored outside executable paths.
- Secrets are configured through environment variables or deployment secrets.
- Production errors do not expose stack traces.

## Testing and CI

Run the backend tests:

```powershell
dotnet test tests/Helpdesk.UnitTests/Helpdesk.UnitTests.csproj
```

Build the frontend:

```powershell
cd frontend/helpdesk-web
npm ci
npm run build
```

GitHub Actions validates:

- .NET restore, build and unit tests.
- npm install and frontend build.
- Integrated `wwwroot` output.
- Published API output containing the frontend.

## Documentation

- [`docs/requirements.md`](docs/requirements.md)
- [`docs/architecture/architecture.md`](docs/architecture/architecture.md)
- [`docs/database/erd.md`](docs/database/erd.md)
- [`docs/workflows/ticket-lifecycle.md`](docs/workflows/ticket-lifecycle.md)
- [`docs/workflows/sla-workflow.md`](docs/workflows/sla-workflow.md)
- [`docs/frontend/design-system.md`](docs/frontend/design-system.md)
- [`docs/api/api.md`](docs/api/api.md)

## Deployment

The application is designed to run without Docker.

- Backend: Azure App Service, Render, Railway or AWS.
- Database: Azure PostgreSQL, Neon or Supabase.
- Redis: Azure Cache, Upstash or Redis Cloud when distributed caching is enabled.
- Frontend: the Vite build is served by ASP.NET Core or can be deployed to Vercel/Netlify for a split deployment.
- Configure `ConnectionStrings__Default`, `Jwt__Key`, `Jwt__Issuer`, `Jwt__Audience`, CORS origins and storage settings through the hosting provider.

## Future Improvements

- Agent workload and department assignment management.
- Business-hour-aware SLA calendars.
- Canned responses and knowledge-base articles.
- Escalation rules and ticket watchers.
- Tags, saved filters and advanced search.
- External email and object-storage providers.
- Expanded integration and browser-based end-to-end tests.
