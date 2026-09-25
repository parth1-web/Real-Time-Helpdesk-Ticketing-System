using Helpdesk.Domain.Entities;
using Helpdesk.Infrastructure.Data;

namespace Helpdesk.Infrastructure.Services;

public interface IActivityService
{
    Task LogAsync(Guid orgId, Guid? userId, Guid? ticketId, string action, string entityType, string? entityId, string? description, CancellationToken ct = default);
}

public class ActivityService : IActivityService
{
    private readonly ApplicationDbContext _db;
    public ActivityService(ApplicationDbContext db) => _db = db;
    public async Task LogAsync(Guid orgId, Guid? userId, Guid? ticketId, string action, string entityType, string? entityId, string? description, CancellationToken ct = default)
    {
        _db.ActivityLogs.Add(new ActivityLog
        {
            OrganizationId = orgId, UserId = userId, TicketId = ticketId,
            Action = action, EntityType = entityType, EntityId = entityId, Description = description
        });
        await _db.SaveChangesAsync(ct);
    }
}
