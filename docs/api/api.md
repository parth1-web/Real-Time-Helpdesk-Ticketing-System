# API Reference

Base: `/api` + SignalR `/hubs/tickets`, `/hubs/notifications`.

## Auth
- `POST /api/auth/register` {firstName,lastName,email,password,organizationSlug?}
- `POST /api/auth/login` → {userId,email,accessToken,refreshToken}
- `POST /api/auth/refresh` → rotation
- `POST /api/auth/logout`
- `GET /api/auth/me` (Bearer)

## Tickets
- `POST /api/tickets` (creates TCK-000001, SLA due, activity)
- `GET /api/tickets?search=&status=&priority=&departmentId=&categoryId=&slaStatus=&page=&pageSize=`
- `GET /api/tickets/{id}`
- `PATCH /api/tickets/{id}/status` {status}
- `PATCH /api/tickets/{id}/priority`

## Conversations
- `GET /api/tickets/{id}/messages` (customers auto-filtered, no internal)
- `POST /api/tickets/{id}/messages` {message,isInternal}

## Assignment
- `POST /api/tickets/{id}/assign` {agentId} (history + notification + hub)
- `POST /api/tickets/{id}/unassign`
- `GET /api/tickets/{id}/assignments`

## Config
- CRUD `/api/departments`, `/api/categories`, `/api/sla-policies`, `/api/organizations`

## Notifications / Feedback / Files / Reports
- `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH .../read`, `PATCH .../read-all`
- `POST /api/tickets/{id}/feedback` {rating 1-5,comment} (resolved only, once)
- `POST /api/tickets/{id}/attachments` (multipart, 10MB), `GET .../attachments`, `GET .../attachments/{id}/download`
- `GET /api/reports/summary`, `GET /api/tickets/{id}/activity`, `GET /api/organizations/{id}/activity`

Test via Swagger with Bearer token. Rate limits: auth 10/min, write 60/min.
