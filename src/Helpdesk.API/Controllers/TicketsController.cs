using Helpdesk.API.Authorization;
using Helpdesk.API.Hubs;
using Helpdesk.Application.DTOs;
using Helpdesk.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace Helpdesk.API.Controllers;

[Authorize]
[ApiController]
[Route("api/tickets")]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _tickets;
    private readonly IHubContext<TicketHub> _hub;
    public TicketsController(ITicketService tickets, IHubContext<TicketHub> hub) { _tickets = tickets; _hub = hub; }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] TicketCreateRequest req, CancellationToken ct)
    {
        var userId = ClaimsHelper.UserId(User);
        var org = ClaimsHelper.OrgId(User);
        if (org.HasValue) req = req with { OrganizationId = org.Value };
        var created = await _tickets.CreateAsync(userId, req, ct);
        await _hub.Clients.Group($"organization:{created.Id}").SendAsync("TicketCreated", created, ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpGet]
    public async Task<ActionResult> List([FromQuery] string? search, [FromQuery] string? status, [FromQuery] string? priority,
        [FromQuery] Guid? departmentId, [FromQuery] Guid? categoryId, [FromQuery] string? slaStatus,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var userId = ClaimsHelper.UserId(User);
        return Ok(await _tickets.ListAsync(userId, search, status, priority, departmentId, categoryId, slaStatus, page, pageSize, ct));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult> Get(Guid id, CancellationToken ct)
    {
        try
        {
            var t = await _tickets.GetAsync(ClaimsHelper.UserId(User), id, ct);
            return t == null ? NotFound() : Ok(t);
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult> Status(Guid id, [FromBody] Dictionary<string, string> body, CancellationToken ct)
    {
        try
        {
            var ok = await _tickets.ChangeStatusAsync(ClaimsHelper.UserId(User), id, body.GetValueOrDefault("status") ?? "", ct);
            if (!ok) return NotFound();
            await _hub.Clients.Group($"ticket:{id}").SendAsync("TicketStatusChanged", new { ticketId = id }, ct);
            return Ok(new { ok });
        }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { error = ex.Message }); }
    }

    [HttpPatch("{id:guid}/priority")]
    [Authorize(Roles = "SuperAdmin,OrganizationAdmin,SupportManager,SupportAgent")]
    public async Task<ActionResult> Priority(Guid id, [FromBody] Dictionary<string, string> body, CancellationToken ct)
    {
        await _hub.Clients.Group($"ticket:{id}").SendAsync("TicketPriorityChanged", new { ticketId = id }, ct);
        return Ok(new { ok = true });
    }
}
