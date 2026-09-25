using System.Security.Claims;
using Helpdesk.Domain.Enums;

namespace Helpdesk.API.Authorization;

public static class Roles
{
    public const string SuperAdmin = nameof(UserRole.SuperAdmin);
    public const string OrganizationAdmin = nameof(UserRole.OrganizationAdmin);
    public const string SupportManager = nameof(UserRole.SupportManager);
    public const string SupportAgent = nameof(UserRole.SupportAgent);
    public const string Customer = nameof(UserRole.Customer);
    public const string Staff = "SupportManager,SupportAgent,OrganizationAdmin,SuperAdmin";
}

public static class ClaimsHelper
{
    public static Guid UserId(ClaimsPrincipal u)
        => Guid.Parse(u.FindFirstValue(ClaimTypes.NameIdentifier) ?? u.FindFirstValue("sub") ?? throw new UnauthorizedAccessException());
    public static Guid? OrgId(ClaimsPrincipal u)
        => Guid.TryParse(u.FindFirstValue("org"), out var g) ? g : null;
    public static bool IsStaff(ClaimsPrincipal u) => u.IsInRole(UserRole.SupportAgent.ToString())
        || u.IsInRole(UserRole.SupportManager.ToString())
        || u.IsInRole(UserRole.OrganizationAdmin.ToString())
        || u.IsInRole(UserRole.SuperAdmin.ToString());
}
