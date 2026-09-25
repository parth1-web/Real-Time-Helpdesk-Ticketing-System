using Helpdesk.API.Authorization;
using Helpdesk.Domain.Entities;
using Helpdesk.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Helpdesk.API.Controllers;

[Authorize]
[ApiController]
[Route("api/sla-policies")]
public class SlaPoliciesController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public SlaPoliciesController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult> List(CancellationToken ct)
    {
        var org = ClaimsHelper.OrgId(User);
        var q = _db.SlaPolicies.AsNoTracking().AsQueryable();
        if (org.HasValue) q = q.Where(s => s.OrganizationId == org.Value);
        return Ok(await q.ToListAsync(ct));
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,OrganizationAdmin,SupportManager")]
    public async Task<ActionResult> Create([FromBody] SlaPolicy p, CancellationToken ct)
    {
        p.Id = Guid.NewGuid();
        p.OrganizationId = ClaimsHelper.OrgId(User) ?? p.OrganizationId;
        _db.SlaPolicies.Add(p);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = p.Id }, p);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult> Get(Guid id, CancellationToken ct)
    {
        var p = await _db.SlaPolicies.FindAsync(new object[] { id }, ct);
        return p == null ? NotFound() : Ok(p);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,OrganizationAdmin")]
    public async Task<ActionResult> Update(Guid id, [FromBody] SlaPolicy input, CancellationToken ct)
    {
        var p = await _db.SlaPolicies.FindAsync(new object[] { id }, ct);
        if (p == null) return NotFound();
        p.Name = input.Name; p.Priority = input.Priority;
        p.FirstResponseMinutes = input.FirstResponseMinutes; p.ResolutionMinutes = input.ResolutionMinutes;
        p.IsActive = input.IsActive; p.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(p);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,OrganizationAdmin")]
    public async Task<ActionResult> Delete(Guid id, CancellationToken ct)
    {
        var p = await _db.SlaPolicies.FindAsync(new object[] { id }, ct);
        if (p == null) return NotFound();
        _db.SlaPolicies.Remove(p);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}
