using Helpdesk.API.Authorization;
using Helpdesk.Domain.Entities;
using Helpdesk.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Helpdesk.API.Controllers;

[Authorize]
[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public CategoriesController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult> List(CancellationToken ct)
    {
        var org = ClaimsHelper.OrgId(User);
        var q = _db.TicketCategories.AsNoTracking().AsQueryable();
        if (org.HasValue) q = q.Where(c => c.OrganizationId == org.Value);
        return Ok(await q.ToListAsync(ct));
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,OrganizationAdmin,SupportManager")]
    public async Task<ActionResult> Create([FromBody] TicketCategory c, CancellationToken ct)
    {
        c.Id = Guid.NewGuid();
        c.OrganizationId = ClaimsHelper.OrgId(User) ?? c.OrganizationId;
        _db.TicketCategories.Add(c);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = c.Id }, c);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult> Get(Guid id, CancellationToken ct)
    {
        var c = await _db.TicketCategories.FindAsync(new object[] { id }, ct);
        return c == null ? NotFound() : Ok(c);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,OrganizationAdmin,SupportManager")]
    public async Task<ActionResult> Update(Guid id, [FromBody] TicketCategory input, CancellationToken ct)
    {
        var c = await _db.TicketCategories.FindAsync(new object[] { id }, ct);
        if (c == null) return NotFound();
        c.Name = input.Name; c.Description = input.Description; c.IsActive = input.IsActive;
        c.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(c);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,OrganizationAdmin")]
    public async Task<ActionResult> Delete(Guid id, CancellationToken ct)
    {
        var c = await _db.TicketCategories.FindAsync(new object[] { id }, ct);
        if (c == null) return NotFound();
        _db.TicketCategories.Remove(c);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}
