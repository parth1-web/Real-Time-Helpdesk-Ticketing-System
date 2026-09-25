# Database ERD — Real-Time Helpdesk

## Entities & Keys

```
User(Id PK, FirstName, LastName, Email UNIQUE, PasswordHash, IsActive, CreatedAt, UpdatedAt)
Organization(Id PK, Name, Slug UNIQUE, Description, IsActive, CreatedAt, UpdatedAt)
OrganizationMember(Id PK, OrganizationId FK→Organization, UserId FK→User, Role, JoinedAt)
  UNIQUE(OrganizationId, UserId)
Department(Id PK, OrganizationId FK, Name, Description, IsActive, CreatedAt, UpdatedAt)
TicketCategory(Id PK, OrganizationId FK, Name, Description, IsActive, CreatedAt, UpdatedAt)
SlaPolicy(Id PK, OrganizationId FK, Name, Priority, FirstResponseMinutes, ResolutionMinutes, IsActive, CreatedAt, UpdatedAt)
Ticket(Id PK, OrganizationId FK, TicketNumber UNIQUE per org, Subject, Description,
  Status, Priority, CategoryId FK NULL, DepartmentId FK NULL,
  CreatedBy FK→User, AssignedTo FK→User NULL, SlaPolicyId FK NULL,
  CreatedAt, UpdatedAt, FirstResponseAt NULL, ResolvedAt NULL, ClosedAt NULL, DueAt NULL)
TicketMessage(Id PK, TicketId FK, SenderId FK→User, Message, IsInternal, CreatedAt, UpdatedAt)
TicketAttachment(Id PK, TicketId FK, MessageId FK NULL, FileName, StoredFileName, ContentType, FileSize, StoragePath, UploadedBy FK, CreatedAt)
TicketAssignment(Id PK, TicketId FK, AgentId FK→User, AssignedBy FK→User, AssignedAt, UnassignedAt NULL)
Notification(Id PK, UserId FK→User, Type, Title, Message, IsRead, CreatedAt)
CustomerFeedback(Id PK, TicketId FK UNIQUE, CustomerId FK→User, Rating 1-5, Comment, CreatedAt)
ActivityLog(Id PK, OrganizationId FK, UserId FK NULL, TicketId FK NULL, Action, EntityType, EntityId, Description, CreatedAt)
RefreshToken(Id PK, UserId FK, TokenHash UNIQUE, ExpiresAt, CreatedAt, RevokedAt NULL, ReplacedBy NULL)
```

## Relationships
- Organization 1—* Member, Department, Category, Ticket, SlaPolicy, ActivityLog
- Ticket 1—* Message, Attachment, Assignment, (1 Feedback)
- User 1—* Ticket(CreatedBy), Message, Notification, RefreshToken

## Indexes (PostgreSQL)
- Ticket(OrganizationId), (Status), (Priority), (AssignedTo), (DepartmentId), (CreatedAt), (TicketNumber)
- TicketMessage(TicketId, CreatedAt)
- Notification(UserId, IsRead, CreatedAt)
- ActivityLog(OrganizationId, TicketId, CreatedAt)
- Full-text / trigram on Ticket(Subject, Description) + customer join for search.

## Constraints
- FK restrict where history matters (don't cascade-delete tickets on user delete; set null).
- Check: Rating 1-5, FileSize >0, FirstResponseMinutes>0, ResolutionMinutes>0.
- TicketNumber generated per-org sequence `TCK-000001` via unique counter / HiLo.
```
