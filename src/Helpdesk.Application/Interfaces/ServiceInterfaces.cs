using Helpdesk.Application.DTOs;
using Helpdesk.Domain.Enums;

namespace Helpdesk.Application.Interfaces;

public interface IJwtService
{
    (string Token, DateTime ExpiresAt) CreateAccessToken(Guid userId, string email, UserRole role, Guid? orgId);
    string CreateRefreshToken();
    string HashToken(string token);
}

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest req, CancellationToken ct = default);
    Task<AuthResponse> LoginAsync(LoginRequest req, CancellationToken ct = default);
    Task<AuthResponse> RefreshAsync(string refreshToken, CancellationToken ct = default);
    Task LogoutAsync(string refreshToken, CancellationToken ct = default);
}

public interface ITicketService
{
    Task<TicketResponse> CreateAsync(Guid userId, TicketCreateRequest req, CancellationToken ct = default);
    Task<PagedResult<TicketResponse>> ListAsync(Guid userId, string? search, string? status, string? priority, Guid? departmentId, Guid? categoryId, string? slaStatus, int page, int pageSize, CancellationToken ct = default);
    Task<TicketResponse?> GetAsync(Guid userId, Guid id, CancellationToken ct = default);
    Task<bool> ChangeStatusAsync(Guid userId, Guid id, string newStatus, CancellationToken ct = default);
}

public interface ISlaService
{
    string ComputeStatus(DateTime? dueAt, DateTime createdAt, int resolutionMinutes);
    (DateTime FirstResponseDeadline, DateTime ResolutionDeadline) CalculateDeadlines(DateTime createdAt, int firstResponseMin, int resolutionMin);
}

public interface INotificationService
{
    Task NotifyAsync(Guid userId, NotificationType type, string title, string message, CancellationToken ct = default);
}

public interface IEmailService
{
    Task SendAsync(string to, string subject, string body, CancellationToken ct = default);
}
