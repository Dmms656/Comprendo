using Comprendo.Application.Features.Auth;
using Comprendo.Application.Features.Auth.Login;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Comprendo.Api.Controllers;

/// <summary>Autenticación de usuarios del panel docente.</summary>
[ApiController]
[Route("api/auth")]
public class AuthController(ISender sender) : ControllerBase
{
    /// <summary>Inicia sesión y devuelve un token JWT.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new LoginCommand(request.Correo, request.Password), cancellationToken);
        return Ok(result);
    }
}
