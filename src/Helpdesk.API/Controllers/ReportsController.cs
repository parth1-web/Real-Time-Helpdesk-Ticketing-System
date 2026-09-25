using Helpdesk.API.Authorization;
using Helpdesk.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Helpdesk.API.Controllers;

[Authorize]
[ApiController]
[Route("api")]
public class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public ReportsController(ApplicationDbContext db) => _db = db;

    [HttpGet("reports/summary")]
    [Authorize(Roles = "SuperAdmin,OrganizationAdmin,SupportManager")]
    public async Task<ActionResult> Summary(CancellationToken ct)
    {
        var org = ClaimsHelper.OrgId(User);
        var q = _db.Tickets.AsQueryable();
        if (org.HasValue) q = q.Where(t => t.OrganizationId == org.Value);
        var total = await q.CountAsync(ct);
        var open = await q.CountAsync(t => t.Status == Domain.Enums.TicketStatus.Open, ct);
        var resolved = await q.CountAsync(t => t.Status == Domain.Enums.TicketStatus.Resolved, ct);
        var breached = await q.CountAsync(t => t.DueAt != null && t.DueAt < DateTime.UtcNow && t.Status != Domain.Enums.TicketStatus.Closed && t.Status != Domain.Enums.TicketStatus.Resolved, ct);
        var byPriority = await q.GroupBy(t => t.Priority).Select(g => new { priority = g.Key.ToString(), count = g.Count() }).ToListAsync(ct);
        var byStatus = await q.GroupBy(t => t.Status).Select(g => new { status = g.Key.ToString(), count = g.Count() }).ToListAsync(ct);
        var avgRating = await _db.Feedbacks.AnyAsync(ct) ? await _db.Feedbacks.AverageAsync(f => f.Rating, ct) : 0;
        return Ok(new { total, open, resolved, breached, byPriority, byStatus, avgRating });
    }

    [HttpGet("tickets/{ticketId:guid}/activity")]
    public async Task<ActionResult> TicketActivity(Guid ticketId, CancellationToken ct)
        => Ok(await _db.ActivityLogs.AsNoTracking().Where(a => a.TicketId == ticketId).OrderByDescending(a => a.CreatedAt).ToListAsync(ct));
}
