using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Models;
using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Comprendo.Infrastructure.Persistence.Repositories;

public class LeccionRepository(ComprendoDbContext dbContext) : ILeccionRepository
{
    public async Task<PaginatedList<Leccion>> ListByDocenteAsync(
        int idDocente,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Lecciones
            .Where(l => l.DocenteCursoMateria.IdDocente == idDocente)
            .OrderByDescending(l => l.FechaCreacion);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PaginatedList<Leccion>(items, total, pageNumber, pageSize);
    }

    public Task<Leccion?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        dbContext.Lecciones.FirstOrDefaultAsync(x => x.IdLeccion == id, cancellationToken);

    public Task<bool> BelongsToDocenteAsync(
        int idLeccion,
        int idDocente,
        CancellationToken cancellationToken = default) =>
        dbContext.Lecciones.AnyAsync(
            l => l.IdLeccion == idLeccion && l.DocenteCursoMateria.IdDocente == idDocente,
            cancellationToken);

    public Task<Leccion> CreateAsync(Leccion entity, CancellationToken cancellationToken = default)
    {
        dbContext.Lecciones.Add(entity);
        return Task.FromResult(entity);
    }

    public Task UpdateAsync(Leccion entity, CancellationToken cancellationToken = default)
    {
        dbContext.Lecciones.Update(entity);
        return Task.CompletedTask;
    }

    public async Task ChangeEstadoAsync(
        int idLeccion,
        EstadoLeccion estado,
        CancellationToken cancellationToken = default)
    {
        await dbContext.Lecciones
            .Where(l => l.IdLeccion == idLeccion)
            .ExecuteUpdateAsync(s => s.SetProperty(l => l.Estado, estado), cancellationToken);
    }
}
