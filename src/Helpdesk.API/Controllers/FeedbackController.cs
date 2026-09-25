using Helpdesk.API.Authorization;
using Helpdesk.Domain.Entities;
using Helpdesk.Domain.Enums;
using Helpdesk.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Helpdesk.API.Controllers;

[Authorize]
[ApiController]
[Route("api/tickets/{ticketId:guid}/feedback")]
public class FeedbackController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public FeedbackController(ApplicationDbContext db) => _db = db;

    [HttpPost]
    public async Task<ActionResult> Submit(Guid ticketId, [FromBody] Dictionary<string, object> body, CancellationToken ct)
    {
        var uid = ClaimsHelper.UserId(User);
        var ticket = await _db.Tickets.FindAsync(new object[] { ticketId }, ct);
        if (ticket == null) return NotFound();
        if (ticket.CreatedBy != uid) return Forbid();
        if (ticket.Status != TicketStatus.Resolved && ticket.Status != TicketStatus.Closed)
            return BadRequest(new { error = "Feedback allowed only after resolution." });
        if (await _db.Feedbacks.AnyAsync(f => f.TicketId == ticketId, ct))
            return Conflict(new { error = "Feedback already submitted." });
        var rating = Convert.ToInt32(body.GetValueOrDefault("rating")?.ToString() ?? "0");
        if (rating < 1 || rating > 5) return BadRequest(new { error = "Rating must be 1-5." });
        var fb = new CustomerFeedback { TicketId = ticketId, CustomerId = uid, Rating = rating, Comment = body.GetValueOrDefault("comment")?.ToString() };
        _db.Feedbacks.Add(fb);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { ticketId }, fb);
    }

    [HttpGet]
    public async Task<ActionResult> Get(Guid ticketId, CancellationToken ct)
    {
        var fb = await _db.Feedbacks.AsNoTracking().FirstOrDefaultAsync(f => f.TicketId == ticketId, ct);
        return fb == null ? NotFound() : Ok(fb);
    }
}
