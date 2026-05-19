using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Comprendo.Infrastructure.Persistence.Repositories;

public class AuthRepository(ComprendoDbContext dbContext) : IAuthRepository
{
    public Task<Usuario?> GetUsuarioByEmailAsync(string email, CancellationToken cancellationToken = default) =>
        dbContext.Usuarios.FirstOrDefaultAsync(x => x.Correo == email, cancellationToken);

    public Task<Docente?> GetDocenteByUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default) =>
        dbContext.Docentes.FirstOrDefaultAsync(x => x.IdUsuario == usuarioId, cancellationToken);
}
