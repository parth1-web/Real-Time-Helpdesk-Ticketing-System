using Helpdesk.Infrastructure.Data;
using Helpdesk.Infrastructure.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Helpdesk.API.Authorization;
using Helpdesk.Domain.Entities;

namespace Helpdesk.API.Controllers;

[Authorize]
[ApiController]
[Route("api/tickets/{ticketId:guid}/attachments")]
public class AttachmentsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IAttachmentStorage _storage;
    public AttachmentsController(ApplicationDbContext db, IAttachmentStorage storage) { _db = db; _storage = storage; }

    [HttpGet]
    public async Task<ActionResult> List(Guid ticketId, CancellationToken ct)
        => Ok(await _db.TicketAttachments.AsNoTracking().Where(a => a.TicketId == ticketId).ToListAsync(ct));

    [RequestSizeLimit(10_485_760)]
    [HttpPost]
    public async Task<ActionResult> Upload(Guid ticketId, IFormFile file, CancellationToken ct)
    {
        if (file == null || file.Length == 0) return BadRequest(new { error = "No file." });
        AttachmentRules.Validate(file.FileName, file.ContentType, file.Length);
        var ticket = await _db.Tickets.FindAsync(new object[] { ticketId }, ct);
        if (ticket == null) return NotFound();
        var stored = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
        using var s = file.OpenReadStream();
        var path = await _storage.SaveAsync(stored, s, ct);
        var att = new TicketAttachment
        {
            TicketId = ticketId, FileName = file.FileName, StoredFileName = stored,
            ContentType = file.ContentType, FileSize = file.Length, StoragePath = path,
            UploadedBy = ClaimsHelper.UserId(User)
        };
        _db.TicketAttachments.Add(att);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(List), new { ticketId }, att);
    }

    [HttpGet("{id:guid}/download")]
    public async Task<ActionResult> Download(Guid ticketId, Guid id, CancellationToken ct)
    {
        var att = await _db.TicketAttachments.FirstOrDefaultAsync(a => a.Id == id && a.TicketId == ticketId, ct);
        if (att == null) return NotFound();
        var stream = await _storage.OpenAsync(att.StoragePath, ct);
        return File(stream, att.ContentType, att.FileName);
    }
}
