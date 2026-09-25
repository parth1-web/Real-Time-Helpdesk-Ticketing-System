# Real-Time Helpdesk & Ticketing System

![CI](https://github.com/parth1-web/Real-Time-Helpdesk-Ticketing-System/actions/workflows/ci.yml/badge.svg)

Production-style SaaS helpdesk: multi-tenant orgs, RBAC (SuperAdmin/OrgAdmin/Manager/Agent/Customer),
tickets `TCK-000001`, conversations with private internal notes, assignment history, priority SLA,
SignalR realtime, notifications, attachments, feedback CSAT, search/filter/pagination, Redis cache,
background SLA monitor, activity audit, analytics (Recharts), xUnit tests, GH Actions, no Docker.

## Stack
Backend: .NET 8, ASP.NET Core, EF Core, PostgreSQL, JWT+refresh rotation, FluentValidation, Serilog, SignalR, Redis, BackgroundService.
Frontend: React 18, TS, Vite, Bootstrap 5 + React-Bootstrap, Router, TanStack Query, Zustand, Axios, Hook Form+Zod, Recharts, Lucide, SignalR client.

## Quickstart
```powershell
# backend (needs PostgreSQL; else API still builds, DB migrate skipped with warning)
dotnet restore RealTimeHelpdesk.slnx
dotnet build RealTimeHelpdesk.slnx
dotnet test tests/Helpdesk.UnitTests/Helpdesk.UnitTests.csproj
dotnet run --project src/Helpdesk.API
# Swagger: http://localhost:5000/swagger
# frontend
cd frontend/helpdesk-web; npm install; npm run dev
```

## Structure
`src/Helpdesk.{API,Application,Domain,Infrastructure}` `tests/` `frontend/helpdesk-web` `docs/` `.github/workflows/`

## Ticket lifecycle
Open → InProgress → WaitingForCustomer → InProgress → Resolved → Closed (validated, audited, realtime).

## SLA
Per-priority FirstResponse/Resolution minutes → deadlines → OnTrack/AtRisk/Breached (backend only) + 60s monitor + notifications.

## Security
Org isolation server-side, customers never see internal notes, role policies, rate-limit auth/write, safe uploads (10MB, allowlist, traversal-safe), no secrets in git.

## Deploy
Backend: Render/Railway/Azure + Neon/Supabase PG + Upstash Redis. Frontend: Vercel/Netlify. See `.env.example`.

## Future
Tags, canned responses, business hours, escalation rules, KB, watchers.
