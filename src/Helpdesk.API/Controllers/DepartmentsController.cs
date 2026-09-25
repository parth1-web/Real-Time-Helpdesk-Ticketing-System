using Helpdesk.API.Authorization;
using Helpdesk.Domain.Entities;
using Helpdesk.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Helpdesk.API.Controllers;

[Authorize]
[ApiController]
[Route("api/departments")]
public class DepartmentsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public DepartmentsController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult> List([FromQuery] Guid? organizationId, CancellationToken ct)
    {
        var org = ClaimsHelper.OrgId(User) ?? organizationId;
        var q = _db.Departments.AsNoTracking().AsQueryable();
        if (org.HasValue) q = q.Where(d => d.OrganizationId == org.Value);
        return Ok(await q.ToListAsync(ct));
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,OrganizationAdmin,SupportManager")]
    public async Task<ActionResult> Create([FromBody] Department d, CancellationToken ct)
    {
        d.Id = Guid.NewGuid();
        d.OrganizationId = ClaimsHelper.OrgId(User) ?? d.OrganizationId;
        _db.Departments.Add(d);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = d.Id }, d);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult> Get(Guid id, CancellationToken ct)
    {
        var d = await _db.Departments.FindAsync(new object[] { id }, ct);
        return d == null ? NotFound() : Ok(d);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,OrganizationAdmin,SupportManager")]
    public async Task<ActionResult> Update(Guid id, [FromBody] Department input, CancellationToken ct)
    {
        var d = await _db.Departments.FindAsync(new object[] { id }, ct);
        if (d == null) return NotFound();
        d.Name = input.Name; d.Description = input.Description; d.IsActive = input.IsActive;
        d.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(d);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,OrganizationAdmin")]
    public async Task<ActionResult> Delete(Guid id, CancellationToken ct)
    {
        var d = await _db.Departments.FindAsync(new object[] { id }, ct);
        if (d == null) return NotFound();
        _db.Departments.Remove(d);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}
