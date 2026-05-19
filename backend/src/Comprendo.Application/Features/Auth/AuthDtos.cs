namespace Comprendo.Application.Features.Auth;

public record LoginRequest(string Correo, string Password);

public record LoginResponse(string Token, UsuarioDto Usuario);

public record UsuarioDto(
    int IdUsuario,
    string Nombres,
    string Apellidos,
    string Correo,
    string TipoUsuario,
    string Estado);
