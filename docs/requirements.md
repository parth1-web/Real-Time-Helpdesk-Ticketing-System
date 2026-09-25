# Requirements — Real-Time Helpdesk & Ticketing System

> Portfolio-grade SaaS helpdesk platform. Backend: .NET 8 + EF Core + PostgreSQL.
> Frontend: React + TS + Vite + Bootstrap 5. Realtime: SignalR. Cache: Redis.

## 1. Objectives
Build a multi-tenant helpdesk where organizations manage customers, agents,
departments, tickets, conversations, assignments, SLA, notes, attachments,
notifications, feedback, audit logs and analytics with real-time UX.

## 2. Roles
- **SuperAdmin**: platform, organizations, system stats, config.
- **OrganizationAdmin**: org, agents, departments, categories, SLA, reports, audit.
- **SupportManager**: all tickets, assign/reassign, monitor SLA, analytics, escalate.
- **SupportAgent**: assigned + department tickets, reply, internal notes, status/priority, attachments, resolve.
- **Customer**: create tickets, view own, reply own, attachments, track status, close resolved, feedback.

## 3. Multi-tenancy
Platform → Organizations → (Agents, Customers, Departments, Tickets).
Every org-owned resource filtered by `OrganizationId` server-side.
Never rely only on frontend route protection.

## 4. Core Entities
User, Organization, OrganizationMember, Department, TicketCategory, Ticket,
TicketMessage, TicketAttachment, TicketAssignment, SlaPolicy, Notification,
CustomerFeedback, ActivityLog, RefreshToken.

## 5. Ticket Rules
- Human number `TCK-000001` (display), numeric `Id` internal.
- Status: Open → InProgress → WaitingForCustomer → InProgress → Resolved → Closed.
- Validate transitions server-side.
- Priority: Low, Medium, High, Urgent (badge+icon+text, not color alone).
- `IsInternal=true` = staff only. Customers must NEVER receive internal notes.

## 6. SLA Rules
Per-priority `FirstResponseMinutes`, `ResolutionMinutes`.
Backend computes FirstResponseDeadline, ResolutionDeadline, Remaining, Status (OnTrack/AtRisk/Breached).
No frontend timers for enforcement.

## 7. Realtime Rules
Hubs: `TicketHub`, `NotificationHub`.
Groups: `organization:{id}`, `ticket:{id}`, `department:{id}`, `user:{id}`.
Events: TicketCreated/Assigned/Reassigned/StatusChanged/PriorityChanged/MessageAdded/InternalNoteAdded/Resolved/Closed/SlaAtRisk/SlaBreached.
Never broadcast private data globally.

## 8. Non-functional
JWT+refresh rotation, RBAC+policies, FluentValidation, Serilog, rate-limiting,
secure uploads, pagination + server filtering, indexes, xUnit+integration tests,
GitHub Actions CI, no Docker, Bootstrap only (no Tailwind).

## 9. Definition of Done
DB→Domain→App→Infra→API→DTO→validation→authz→Swagger→tests→frontend→states→responsive→docs→commit→push.
