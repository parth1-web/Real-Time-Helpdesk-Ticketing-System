using Helpdesk.API.Authorization;
using Helpdesk.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Helpdesk.API.Controllers;

[Authorize]
[ApiController]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public NotificationsController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult> List(CancellationToken ct)
    {
        var uid = ClaimsHelper.UserId(User);
        return Ok(await _db.Notifications.AsNoTracking().Where(n => n.UserId == uid).OrderByDescending(n => n.CreatedAt).Take(50).ToListAsync(ct));
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult> Unread(CancellationToken ct)
    {
        var uid = ClaimsHelper.UserId(User);
        return Ok(new { count = await _db.Notifications.CountAsync(n => n.UserId == uid && !n.IsRead, ct) });
    }

    [HttpPatch("{id:guid}/read")]
    public async Task<ActionResult> Read(Guid id, CancellationToken ct)
    {
        var uid = ClaimsHelper.UserId(User);
        var n = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid, ct);
        if (n == null) return NotFound();
        n.IsRead = true;
        await _db.SaveChangesAsync(ct);
        return Ok(n);
    }

    [HttpPatch("read-all")]
    public async Task<ActionResult> ReadAll(CancellationToken ct)
    {
        var uid = ClaimsHelper.UserId(User);
        var items = await _db.Notifications.Where(n => n.UserId == uid && !n.IsRead).ToListAsync(ct);
        items.ForEach(n => n.IsRead = true);
        await _db.SaveChangesAsync(ct);
        return Ok(new { count = items.Count });
    }
}
