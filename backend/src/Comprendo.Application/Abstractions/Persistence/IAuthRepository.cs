using Comprendo.Domain.Entities;

namespace Comprendo.Application.Abstractions.Persistence;

public interface IAuthRepository
{
    Task<Usuario?> GetUsuarioByEmailAsync(string email, CancellationToken cancellationToken = default);

    Task<Docente?> GetDocenteByUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default);
}
