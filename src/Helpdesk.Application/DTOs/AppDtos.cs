namespace Helpdesk.Application.DTOs;

public record RegisterRequest(string FirstName, string LastName, string Email, string Password, string? OrganizationSlug = null);
public record LoginRequest(string Email, string Password);
public record RefreshRequest(string RefreshToken);
public record AuthResponse(Guid UserId, string Email, string FullName, string AccessToken, string RefreshToken, DateTime ExpiresAt);
public record MeResponse(Guid Id, string Email, string FullName, string Role, Guid? OrganizationId);
public record TicketCreateRequest(string Subject, string Description, string Priority, Guid? CategoryId, Guid? DepartmentId, Guid OrganizationId);
public record TicketResponse(Guid Id, string TicketNumber, string Subject, string Status, string Priority, DateTime CreatedAt, DateTime? DueAt, string SlaStatus);
public record MessageCreateRequest(string Message, bool IsInternal = false);
public record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize);
