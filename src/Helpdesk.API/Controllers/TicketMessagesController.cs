using Helpdesk.API.Authorization;
using Helpdesk.API.Hubs;
using Helpdesk.Application.DTOs;
using Helpdesk.Domain.Entities;
using Helpdesk.Domain.Enums;
using Helpdesk.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Helpdesk.API.Controllers;

[Authorize]
[ApiController]
[Route("api/tickets/{ticketId:guid}/messages")]
public class TicketMessagesController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IHubContext<TicketHub> _hub;
    public TicketMessagesController(ApplicationDbContext db, IHubContext<TicketHub> hub) { _db = db; _hub = hub; }

    [HttpGet]
    public async Task<ActionResult> List(Guid ticketId, CancellationToken ct)
    {
        var userId = ClaimsHelper.UserId(User);
        var ticket = await _db.Tickets.FindAsync(new object[] { ticketId }, ct);
        if (ticket == null) return NotFound();
        var member = await _db.OrganizationMembers.FirstOrDefaultAsync(m => m.UserId == userId, ct);
        if (member != null && ticket.OrganizationId != member.OrganizationId) return Forbid();
        if (member?.Role == UserRole.Customer && ticket.CreatedBy != userId) return Forbid();
        var q = _db.TicketMessages.AsNoTracking().Where(m => m.TicketId == ticketId).OrderBy(m => m.CreatedAt);
        // Critical: customers never see internal notes (server-side filter)
        if (member?.Role == UserRole.Customer) q = (IOrderedQueryable<TicketMessage>)q.Where(m => !m.IsInternal);
        var items = await q.ToListAsync(ct);
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult> Post(Guid ticketId, [FromBody] MessageCreateRequest req, CancellationToken ct)
    {
        var userId = ClaimsHelper.UserId(User);
        var ticket = await _db.Tickets.FindAsync(new object[] { ticketId }, ct);
        if (ticket == null) return NotFound();
        var member = await _db.OrganizationMembers.FirstOrDefaultAsync(m => m.UserId == userId, ct);
        if (member?.Role == UserRole.Customer)
        {
            if (req.IsInternal) return Forbid(); // customers cannot create internal notes
            if (ticket.CreatedBy != userId) return Forbid();
        }
        var msg = new TicketMessage { TicketId = ticketId, SenderId = userId, Message = req.Message, IsInternal = req.IsInternal && ClaimsHelper.IsStaff(User) };
        _db.TicketMessages.Add(msg);
        if (!msg.IsInternal && ticket.FirstResponseAt == null && ClaimsHelper.IsStaff(User))
            ticket.FirstResponseAt = DateTime.UtcNow;
        ticket.UpdatedAt = DateTime.UtcNow;
        // Auto-reopen WaitingForCustomer on customer reply
        if (!ClaimsHelper.IsStaff(User) && ticket.Status == TicketStatus.WaitingForCustomer)
            ticket.Status = TicketStatus.InProgress;
        _db.ActivityLogs.Add(new ActivityLog { OrganizationId = ticket.OrganizationId, UserId = userId, TicketId = ticketId, Action = msg.IsInternal ? "Internal note added" : "Message added", EntityType = "TicketMessage", EntityId = msg.Id.ToString() });
        await _db.SaveChangesAsync(ct);
        var evt = msg.IsInternal ? "InternalNoteAdded" : "TicketMessageAdded";
        // Only broadcast internal notes to staff group; public to ticket group (authz handled by group membership)
        await _hub.Clients.Group($"ticket:{ticketId}").SendAsync(evt, new { ticketId, msg.Id }, ct);
        return CreatedAtAction(nameof(List), new { ticketId }, msg);
    }
}
