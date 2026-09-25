using Helpdesk.Application.DTOs;
using Helpdesk.Application.Interfaces;
using Helpdesk.Domain.Entities;
using Helpdesk.Domain.Enums;
using Helpdesk.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Helpdesk.Infrastructure.Services;

public class TicketService : ITicketService
{
    private readonly ApplicationDbContext _db;
    private readonly ISlaService _sla;
    public TicketService(ApplicationDbContext db, ISlaService sla) { _db = db; _sla = sla; }

    public async Task<TicketResponse> CreateAsync(Guid userId, TicketCreateRequest req, CancellationToken ct = default)
    {
        if (!Enum.TryParse<TicketPriority>(req.Priority, out var prio)) prio = TicketPriority.Medium;
        var policy = await _db.SlaPolicies.FirstOrDefaultAsync(s => s.OrganizationId == req.OrganizationId && s.Priority == prio && s.IsActive, ct);
        var now = DateTime.UtcNow;
        var due = policy == null ? now.AddHours(24) : now.AddMinutes(policy.ResolutionMinutes);
        var count = await _db.Tickets.CountAsync(t => t.OrganizationId == req.OrganizationId, ct);
        var ticket = new Ticket
        {
            OrganizationId = req.OrganizationId, Subject = req.Subject, Description = req.Description,
            Priority = prio, Status = TicketStatus.Open, CategoryId = req.CategoryId, DepartmentId = req.DepartmentId,
            CreatedBy = userId, SlaPolicyId = policy?.Id, CreatedAt = now, UpdatedAt = now, DueAt = due,
            TicketNumber = $"TCK-{(count + 1):D6}"
        };
        _db.Tickets.Add(ticket);
        _db.ActivityLogs.Add(new ActivityLog { OrganizationId = req.OrganizationId, UserId = userId, TicketId = ticket.Id, Action = "Ticket created", EntityType = "Ticket", EntityId = ticket.Id.ToString(), Description = ticket.Subject });
        await _db.SaveChangesAsync(ct);
        return ToDto(ticket);
    }

    public async Task<PagedResult<TicketResponse>> ListAsync(Guid userId, string? search, string? status, string? priority, Guid? departmentId, Guid? categoryId, string? slaStatus, int page, int pageSize, CancellationToken ct = default)
    {
        var member = await _db.OrganizationMembers.FirstOrDefaultAsync(m => m.UserId == userId, ct);
        var q = _db.Tickets.AsNoTracking().AsQueryable();
        if (member != null) q = q.Where(t => t.OrganizationId == member.OrganizationId);
        // Customer isolation: only own tickets
        if (member?.Role == UserRole.Customer) q = q.Where(t => t.CreatedBy == userId);
        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(t => EF.Functions.ILike(t.Subject, $"%{search}%") || EF.Functions.ILike(t.Description, $"%{search}%") || EF.Functions.ILike(t.TicketNumber, $"%{search}%"));
        if (Enum.TryParse<TicketStatus>(status, out var st)) q = q.Where(t => t.Status == st);
        if (Enum.TryParse<TicketPriority>(priority, out var pr)) q = q.Where(t => t.Priority == pr);
        if (departmentId.HasValue) q = q.Where(t => t.DepartmentId == departmentId);
        if (categoryId.HasValue) q = q.Where(t => t.CategoryId == categoryId);
        var total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(t => t.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<TicketResponse>(items.Select(ToDto).ToList(), total, page, pageSize);
    }

    public async Task<TicketResponse?> GetAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var t = await _db.Tickets.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (t == null) return null;
        var member = await _db.OrganizationMembers.FirstOrDefaultAsync(m => m.UserId == userId, ct);
        if (member != null && t.OrganizationId != member.OrganizationId) throw new UnauthorizedAccessException("Cross-org access denied.");
        if (member?.Role == UserRole.Customer && t.CreatedBy != userId) throw new UnauthorizedAccessException("Not your ticket.");
        return ToDto(t);
    }

    public async Task<bool> ChangeStatusAsync(Guid userId, Guid id, string newStatus, CancellationToken ct = default)
    {
        if (!Enum.TryParse<TicketStatus>(newStatus, out var to)) return false;
        var t = await _db.Tickets.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (t == null) return false;
        if (!TicketTransitions.CanTransition(t.Status, to)) throw new InvalidOperationException($"Invalid transition {t.Status} -> {to}.");
        t.Status = to; t.UpdatedAt = DateTime.UtcNow;
        if (to == TicketStatus.Resolved) t.ResolvedAt = DateTime.UtcNow;
        if (to == TicketStatus.Closed) t.ClosedAt = DateTime.UtcNow;
        _db.ActivityLogs.Add(new ActivityLog { OrganizationId = t.OrganizationId, UserId = userId, TicketId = t.Id, Action = $"Status changed to {to}", EntityType = "Ticket", EntityId = t.Id.ToString() });
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private TicketResponse ToDto(Ticket t)
    {
        var policyMin = 1440;
        var sla = _sla.ComputeStatus(t.DueAt, t.CreatedAt, policyMin);
        return new TicketResponse(t.Id, t.TicketNumber, t.Subject, t.Status.ToString(), t.Priority.ToString(), t.CreatedAt, t.DueAt, sla);
    }
}
