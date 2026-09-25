using Helpdesk.Domain.Enums;
using Helpdesk.Infrastructure.Data;
using Helpdesk.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Helpdesk.Infrastructure.Background;

public class SlaMonitorService : BackgroundService
{
    private readonly IServiceProvider _sp;
    private readonly ILogger<SlaMonitorService> _log;
    public SlaMonitorService(IServiceProvider sp, ILogger<SlaMonitorService> log) { _sp = sp; _log = log; }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var sla = scope.ServiceProvider.GetRequiredService<SlaService>();
                var now = DateTime.UtcNow;
                var active = await db.Tickets
                    .Where(t => t.DueAt != null && (t.Status == TicketStatus.Open || t.Status == TicketStatus.InProgress || t.Status == TicketStatus.WaitingForCustomer))
                    .ToListAsync(stoppingToken);
                foreach (var t in active)
                {
                    var status = sla.ComputeStatus(t.DueAt, t.CreatedAt, 1440);
                    if (status == "AtRisk")
                    {
                        _log.LogWarning("Ticket {No} at risk, due {Due}", t.TicketNumber, t.DueAt);
                        // Notify agent/manager via NotificationService in real deploy (SignalR event SlaAtRisk)
                    }
                    else if (status == "Breached")
                    {
                        _log.LogError("Ticket {No} breached SLA", t.TicketNumber);
                        db.ActivityLogs.Add(new Domain.Entities.ActivityLog
                        {
                            OrganizationId = t.OrganizationId, TicketId = t.Id,
                            Action = "SLA breached", EntityType = "Ticket", EntityId = t.Id.ToString()
                        });
                    }
                }
                if (active.Any()) await db.SaveChangesAsync(stoppingToken);
                // Daily cleanup of expired tokens
                var expired = await db.RefreshTokens.Where(r => r.ExpiresAt < now.AddDays(-1)).ToListAsync(stoppingToken);
                if (expired.Any()) { db.RefreshTokens.RemoveRange(expired); await db.SaveChangesAsync(stoppingToken); }
            }
            catch (Exception ex) { _log.LogError(ex, "SLA monitor failed"); }
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}
