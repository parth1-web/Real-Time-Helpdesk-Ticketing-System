# Ticket Lifecycle

```
              ┌──────────────┐
              │     OPEN     │
              └──────┬───────┘
                     │ assign / triage
                     ▼
             ┌───────────────┐
             │  IN PROGRESS  │
             └───────┬───────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
┌────────────────────┐   ┌──────────────┐
│ WAITING CUSTOMER   │   │   RESOLVED   │
└─────────┬──────────┘   └──────┬───────┘
          │                     │
          ▼                     ▼
    IN PROGRESS              CLOSED
```

## Allowed Transitions
- Open → InProgress, Closed (spam/duplicate with reason + audit)
- InProgress → WaitingForCustomer, Resolved, Open (re-triage)
- WaitingForCustomer → InProgress (customer reply auto-reopens to InProgress), Resolved
- Resolved → Closed (customer confirms or auto-close timer), InProgress (reopen)
- Closed → InProgress (reopen creates activity + notification)

## Rules
- Invalid transitions → 422 + FluentValidation error + test.
- Every transition writes ActivityLog + Notification + SignalR event.
- FirstResponseAt set on first staff public reply.
- ResolvedAt on Resolved, ClosedAt on Closed.
- Customer close allowed only when Resolved (or own Open → Closed withdraw).
- Agent cannot close directly from Open without resolution note.

## Assignment
Assign keeps history: TicketAssignment(AssignedAt, UnassignedAt).
Unassign closes open assignment row, AssignedTo set null.
Reassign = unassign + assign + events.

## Auth Matrix (tickets)
| Actor | Can |
|---|---|
| Customer | create, list own, get own, reply own, attach own, close own resolved, feedback own resolved |
| Agent | view assigned/dept, reply, internal notes, status/priority, attach, resolve |
| Manager | all above + assign/reassign any, escalate, SLA view |
| OrgAdmin | all + config |
Enforced server-side + integration tests.
