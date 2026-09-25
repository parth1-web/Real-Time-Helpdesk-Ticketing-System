using Helpdesk.Application.DTOs;
using Helpdesk.Application.Interfaces;
using Helpdesk.Domain.Entities;
using Helpdesk.Domain.Enums;
using Helpdesk.Infrastructure.Authentication;
using Helpdesk.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Helpdesk.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _db;
    private readonly IJwtService _jwt;
    public AuthService(ApplicationDbContext db, IJwtService jwt) { _db = db; _jwt = jwt; }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest req, CancellationToken ct = default)
    {
        if (await _db.Users.AnyAsync(u => u.Email == req.Email, ct))
            throw new InvalidOperationException("Email already registered.");
        var user = new User
        {
            FirstName = req.FirstName, LastName = req.LastName,
            Email = req.Email, PasswordHash = PasswordHasher.Hash(req.Password)
        };
        _db.Users.Add(user);

        Organization? org = null;
        UserRole role = UserRole.Customer;
        if (!string.IsNullOrWhiteSpace(req.OrganizationSlug))
        {
            org = await _db.Organizations.FirstOrDefaultAsync(o => o.Slug == req.OrganizationSlug, ct);
        }
        org ??= await _db.Organizations.FirstOrDefaultAsync(ct);
        if (org != null)
        {
            var isFirst = !await _db.OrganizationMembers.AnyAsync(m => m.OrganizationId == org.Id, ct);
            role = isFirst ? UserRole.OrganizationAdmin : UserRole.Customer;
            _db.OrganizationMembers.Add(new OrganizationMember { OrganizationId = org.Id, UserId = user.Id, Role = role });
        }
        await _db.SaveChangesAsync(ct);
        return await IssueTokensAsync(user, role, org?.Id, ct);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest req, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email, ct)
            ?? throw new UnauthorizedAccessException("Invalid credentials.");
        if (!user.IsActive) throw new UnauthorizedAccessException("Account disabled.");
        if (!PasswordHasher.Verify(req.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials.");
        var member = await _db.OrganizationMembers.FirstOrDefaultAsync(m => m.UserId == user.Id, ct);
        return await IssueTokensAsync(user, member?.Role ?? UserRole.Customer, member?.OrganizationId, ct);
    }

    public async Task<AuthResponse> RefreshAsync(string refreshToken, CancellationToken ct = default)
    {
        var hash = _jwt.HashToken(refreshToken);
        var stored = await _db.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == hash, ct)
            ?? throw new UnauthorizedAccessException("Invalid refresh token.");
        if (!stored.IsActive) throw new UnauthorizedAccessException("Refresh token expired.");
        var user = await _db.Users.FindAsync(new object[] { stored.UserId }, ct)
            ?? throw new UnauthorizedAccessException("User not found.");
        stored.RevokedAt = DateTime.UtcNow;
        var member = await _db.OrganizationMembers.FirstOrDefaultAsync(m => m.UserId == user.Id, ct);
        var result = await IssueTokensAsync(user, member?.Role ?? UserRole.Customer, member?.OrganizationId, ct);
        stored.ReplacedBy = _jwt.HashToken(result.RefreshToken);
        await _db.SaveChangesAsync(ct);
        return result;
    }

    public async Task LogoutAsync(string refreshToken, CancellationToken ct = default)
    {
        var hash = _jwt.HashToken(refreshToken);
        var stored = await _db.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == hash, ct);
        if (stored != null) { stored.RevokedAt = DateTime.UtcNow; await _db.SaveChangesAsync(ct); }
    }

    private async Task<AuthResponse> IssueTokensAsync(User user, UserRole role, Guid? orgId, CancellationToken ct)
    {
        var (access, expires) = _jwt.CreateAccessToken(user.Id, user.Email, role, orgId);
        var refresh = _jwt.CreateRefreshToken();
        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id, TokenHash = _jwt.HashToken(refresh),
            ExpiresAt = DateTime.UtcNow.AddDays(14)
        });
        await _db.SaveChangesAsync(ct);
        return new AuthResponse(user.Id, user.Email, user.FullName, access, refresh, expires);
    }
}
