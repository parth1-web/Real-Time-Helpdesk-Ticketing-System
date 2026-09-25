using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Helpdesk.Application.Interfaces;
using Helpdesk.Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Helpdesk.Infrastructure.Authentication;

public class JwtTokenService : IJwtService
{
    private readonly IConfiguration _config;
    public JwtTokenService(IConfiguration config) => _config = config;

    public (string Token, DateTime ExpiresAt) CreateAccessToken(Guid userId, string email, UserRole role, Guid? orgId)
    {
        var key = _config["Jwt:Key"] ?? "dev-super-secret-key-change-me-32chars!!";
        var issuer = _config["Jwt:Issuer"] ?? "Helpdesk";
        var audience = _config["Jwt:Audience"] ?? "HelpdeskClients";
        var expires = DateTime.UtcNow.AddMinutes(int.TryParse(_config["Jwt:AccessMinutes"], out var m) ? m : 30);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new(ClaimTypes.Role, role.ToString()),
        };
        if (orgId.HasValue) claims.Add(new Claim("org", orgId.Value.ToString()));
        var creds = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(issuer, audience, claims, expires: expires, signingCredentials: creds);
        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }

    public string CreateRefreshToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
    public string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }
}
