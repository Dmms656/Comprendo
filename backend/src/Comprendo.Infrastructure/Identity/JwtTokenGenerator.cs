using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Comprendo.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Comprendo.Infrastructure.Identity;

public class JwtTokenGenerator(IConfiguration configuration) : IJwtTokenGenerator
{
    public string GenerateToken(int userId, string correo, string tipoUsuario, int? docenteId = null)
    {
        var secret = configuration["Jwt:Secret"]
            ?? configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT secret is not configured (Jwt:Secret or Jwt:Key).");

        var issuer = configuration["Jwt:Issuer"] ?? "Comprendo";
        var audience = configuration["Jwt:Audience"] ?? "Comprendo";
        var expiryMinutes = configuration.GetValue("Jwt:ExpirationMinutes", 480);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Email, correo),
            new(ClaimTypes.Role, tipoUsuario)
        };

        if (docenteId.HasValue)
        {
            claims.Add(new Claim("docente_id", docenteId.Value.ToString()));
        }

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
