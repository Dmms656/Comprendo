namespace Comprendo.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(int userId, string correo, string tipoUsuario, int? docenteId = null);
}
