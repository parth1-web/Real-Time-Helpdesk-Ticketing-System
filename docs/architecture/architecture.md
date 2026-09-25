# Architecture — Real-Time Helpdesk

## Clean Architecture

```
API → Application → Domain
Infrastructure → Application → Domain
Domain has zero deps on Infra/API.
```

```
RealTimeHelpdesk/
├── src/
│   ├── Helpdesk.API/            # Controllers, Hubs, Middleware, Program.cs
│   ├── Helpdesk.Application/    # Features/, DTOs/, Validators/, Interfaces/, Common/
│   ├── Helpdesk.Domain/         # Entities, Enums, Rules
│   └── Helpdesk.Infrastructure/ # Data/, Repos, Services, Auth, Storage, Redis, Background, Logging
├── tests/
│   ├── Helpdesk.UnitTests/
│   └── Helpdesk.IntegrationTests/
├── frontend/helpdesk-web/       # React+TS+Vite+Bootstrap
├── docs/
└── .github/workflows/
```

## Request Pipeline
Request DTO → Validation (FluentValidation) → App Service → Domain → EF/PostgreSQL → Response DTO.
Always DTOs, never EF entities. Proper HTTP codes.

## AuthZ Model
User + Organization + Role + Ticket + Department + Assignment.
- Customer: own tickets only.
- Agent: assigned or department tickets.
- Manager: all org tickets.
- OrgAdmin: org config.
Enforced in API + services + SignalR groups.

## Realtime
Customer POST → validate → authorize → save PG → activity → SignalR to `ticket:{id}` group.
Groups: organization:{id}, ticket:{id}, department:{id}, user:{id}.

## SLA
TicketCreated → Find policy by priority → Calc deadlines → Store.
BackgroundService polls active tickets → AtRisk → notify → Breached → log + notify + escalate.
Never on per-request path.

## Caching (Redis)
Dashboard summaries, departments, categories, SLA config, stats. Careful invalidation.
Others: rate-limit, distributed cache, temp state.

## Logging / Observability
Serilog structured logs, no secrets, correlation per request, safe error shape.
