using Helpdesk.Domain.Entities;
using Helpdesk.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Helpdesk.API.Controllers;

[Authorize]
[ApiController]
[Route("api/organizations")]
public class OrganizationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public OrganizationsController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult> List(CancellationToken ct)
        => Ok(await _db.Organizations.AsNoTracking().ToListAsync(ct));

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,OrganizationAdmin")]
    public async Task<ActionResult> Create([FromBody] Organization org, CancellationToken ct)
    {
        org.Id = Guid.NewGuid();
        org.Slug = org.Slug.ToLowerInvariant();
        _db.Organizations.Add(org);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = org.Id }, org);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult> Get(Guid id, CancellationToken ct)
    {
        var o = await _db.Organizations.FindAsync(new object[] { id }, ct);
        return o == null ? NotFound() : Ok(o);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,OrganizationAdmin")]
    public async Task<ActionResult> Update(Guid id, [FromBody] Organization input, CancellationToken ct)
    {
        var o = await _db.Organizations.FindAsync(new object[] { id }, ct);
        if (o == null) return NotFound();
        o.Name = input.Name; o.Description = input.Description; o.IsActive = input.IsActive;
        o.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(o);
    }

    [HttpGet("{id:guid}/activity")]
    public async Task<ActionResult> Activity(Guid id, CancellationToken ct)
        => Ok(await _db.ActivityLogs.AsNoTracking().Where(a => a.OrganizationId == id).OrderByDescending(a => a.CreatedAt).Take(100).ToListAsync(ct));
}
