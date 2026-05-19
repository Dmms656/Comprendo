using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace Comprendo.Infrastructure.Services;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    private ClaimsPrincipal? User => httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated == true;

    public int? UserId
    {
        get
        {
            var value = User?.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? User?.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(value, out var id) ? id : null;
        }
    }

    public int? DocenteId
    {
        get
        {
            var value = User?.FindFirstValue("docente_id") ?? User?.FindFirstValue("docenteId");
            return int.TryParse(value, out var id) ? id : null;
        }
    }

    public TipoUsuario? TipoUsuario
    {
        get
        {
            var value = User?.FindFirstValue(ClaimTypes.Role);
            return Enum.TryParse<TipoUsuario>(value, true, out var tipo) ? tipo : null;
        }
    }
}
