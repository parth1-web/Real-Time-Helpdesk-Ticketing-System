# SLA Workflow

## Policies (per org, per priority)
```
Urgent: FirstResponse 15m, Resolution 4h
High:   FirstResponse 30m, Resolution 8h
Medium: FirstResponse 2h,  Resolution 24h
Low:    FirstResponse 8h,  Resolution 72h
```

## Calculation (backend only)
On TicketCreated:
1. Resolve SlaPolicy by OrganizationId + Priority.
2. FirstResponseDeadline = CreatedAt + FirstResponseMinutes.
3. ResolutionDeadline (DueAt) = CreatedAt + ResolutionMinutes.
4. Store DueAt + SlaPolicyId.
5. Remaining = Deadline - UtcNow. Status:
   - Breached if now > deadline
   - AtRisk if remaining < 20% of window or < 30m (whichever smaller)
   - else OnTrack
6. If priority changes → recalc + audit.

## BackgroundService Loop (every 60s)
```
Find active tickets (Open/InProgress/WaitingForCustomer, DueAt not null)
 → compute status
 → if AtRisk and not yet notified → SlaAtRisk + Notification + SignalR + ActivityLog
 → if Breached and not yet flagged → SlaBreached + ActivityLog + notify agent+manager + escalate if configured
 → cleanup expired refresh tokens + old read notifications (daily)
```
Never run this on HTTP request path.

## Visualization
- `SLA: 01h 42m remaining` + badge OnTrack/AtRisk/Breached + icon + text (not color alone).
- Queue shows countdown; detail shows both deadlines.

## Email (via IEmailService)
TicketCreated, Assigned, NewReply, SlaAtRisk, SlaBreached, Resolved.
Dev: LogEmailService. Prod: SMTP/sendgrid via env, no hardcoded secrets.
