using Helpdesk.Application.Interfaces;

namespace Helpdesk.Infrastructure.Services;

public class SlaService : ISlaService
{
    public (DateTime FirstResponseDeadline, DateTime ResolutionDeadline) CalculateDeadlines(DateTime createdAt, int firstResponseMin, int resolutionMin)
        => (createdAt.AddMinutes(firstResponseMin), createdAt.AddMinutes(resolutionMin));

    public string ComputeStatus(DateTime? dueAt, DateTime createdAt, int resolutionMinutes)
    {
        if (dueAt == null) return "OnTrack";
        var now = DateTime.UtcNow;
        if (now > dueAt.Value) return "Breached";
        var total = (dueAt.Value - createdAt).TotalMinutes;
        var remaining = (dueAt.Value - now).TotalMinutes;
        if (total <= 0) return "Breached";
        var ratio = remaining / total;
        if (ratio < 0.2 || remaining < 30) return "AtRisk";
        return "OnTrack";
    }
}
