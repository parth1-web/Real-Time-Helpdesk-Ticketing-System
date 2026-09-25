using Helpdesk.API.Authorization;
using Helpdesk.API.Hubs;
using Helpdesk.Domain.Entities;
using Helpdesk.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Helpdesk.API.Controllers;

[Authorize(Roles = "SuperAdmin,OrganizationAdmin,SupportManager,SupportAgent")]
[ApiController]
[Route("api/tickets/{ticketId:guid}")]
public class TicketAssignmentsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IHubContext<TicketHub> _hub;
    public TicketAssignmentsController(ApplicationDbContext db, IHubContext<TicketHub> hub) { _db = db; _hub = hub; }

    [HttpPost("assign")]
    public async Task<ActionResult> Assign(Guid ticketId, [FromBody] Dictionary<string, Guid> body, CancellationToken ct)
    {
        var by = ClaimsHelper.UserId(User);
        var ticket = await _db.Tickets.FindAsync(new object[] { ticketId }, ct);
        if (ticket == null) return NotFound();
        var agentId = body.GetValueOrDefault("agentId");
        // close open assignment
        var open = await _db.TicketAssignments.FirstOrDefaultAsync(a => a.TicketId == ticketId && a.UnassignedAt == null, ct);
        if (open != null) open.UnassignedAt = DateTime.UtcNow;
        _db.TicketAssignments.Add(new TicketAssignment { TicketId = ticketId, AgentId = agentId, AssignedBy = by });
        ticket.AssignedTo = agentId;
        if (ticket.Status == TicketStatus.Open) ticket.Status = TicketStatus.InProgress;
        ticket.UpdatedAt = DateTime.UtcNow;
        _db.ActivityLogs.Add(new ActivityLog { OrganizationId = ticket.OrganizationId, UserId = by, TicketId = ticketId, Action = "Ticket assigned", EntityType = "Ticket", EntityId = ticketId.ToString(), Description = agentId.ToString() });
        _db.Notifications.Add(new Notification { UserId = agentId, Type = Domain.Enums.NotificationType.TicketAssigned, Title = $"Assigned {ticket.TicketNumber}", Message = ticket.Subject });
        await _db.SaveChangesAsync(ct);
        await _hub.Clients.Group($"ticket:{ticketId}").SendAsync("TicketAssigned", new { ticketId, agentId }, ct);
        return Ok(new { ticketId, agentId });
    }

    [HttpPost("unassign")]
    public async Task<ActionResult> Unassign(Guid ticketId, CancellationToken ct)
    {
        var by = ClaimsHelper.UserId(User);
        var ticket = await _db.Tickets.FindAsync(new object[] { ticketId }, ct);
        if (ticket == null) return NotFound();
        var open = await _db.TicketAssignments.FirstOrDefaultAsync(a => a.TicketId == ticketId && a.UnassignedAt == null, ct);
        if (open != null) open.UnassignedAt = DateTime.UtcNow;
        ticket.AssignedTo = null; ticket.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(new { ticketId });
    }

    [HttpGet("assignments")]
    public async Task<ActionResult> History(Guid ticketId, CancellationToken ct)
        => Ok(await _db.TicketAssignments.AsNoTracking().Where(a => a.TicketId == ticketId).OrderByDescending(a => a.AssignedAt).ToListAsync(ct));
}
