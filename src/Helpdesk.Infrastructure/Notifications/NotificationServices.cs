using Helpdesk.Application.Interfaces;
using Helpdesk.Domain.Entities;
using Helpdesk.Domain.Enums;
using Helpdesk.Infrastructure.Data;
using Microsoft.Extensions.Logging;

namespace Helpdesk.Infrastructure.Notifications;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<NotificationService> _log;
    public NotificationService(ApplicationDbContext db, ILogger<NotificationService> log) { _db = db; _log = log; }
    public async Task NotifyAsync(Guid userId, NotificationType type, string title, string message, CancellationToken ct = default)
    {
        _db.Notifications.Add(new Notification { UserId = userId, Type = type, Title = title, Message = message });
        await _db.SaveChangesAsync(ct);
        _log.LogInformation("Notify {User} {Type}: {Title}", userId, type, title);
    }
}

public class LogEmailService : IEmailService
{
    private readonly ILogger<LogEmailService> _log;
    public LogEmailService(ILogger<LogEmailService> log) => _log = log;
    public Task SendAsync(string to, string subject, string body, CancellationToken ct = default)
    {
        _log.LogInformation("Email to {To}: {Subject} - {Body}", to, subject, body);
        return Task.CompletedTask;
    }
}
