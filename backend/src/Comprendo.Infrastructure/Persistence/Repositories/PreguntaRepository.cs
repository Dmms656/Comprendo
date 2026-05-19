using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Comprendo.Infrastructure.Persistence.Repositories;

public class PreguntaRepository(ComprendoDbContext context) : IPreguntaRepository
{
    public async Task<IReadOnlyList<Pregunta>> ListByLeccionAsync(
        int idLeccion, CancellationToken cancellationToken = default) =>
        await context.Preguntas
            .AsNoTracking()
            .Include(x => x.OpcionesPregunta.OrderBy(o => o.Literal))
            .Where(x => x.IdLeccion == idLeccion)
            .OrderBy(x => x.Orden)
            .ToListAsync(cancellationToken);

    public Task<Pregunta?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        context.Preguntas
            .Include(x => x.OpcionesPregunta)
            .FirstOrDefaultAsync(x => x.IdPregunta == id, cancellationToken);

    public Task<bool> BelongsToDocenteLeccionAsync(
        int idPregunta, int idDocente, CancellationToken cancellationToken = default) =>
        context.Preguntas.AsNoTracking().AnyAsync(
            p => p.IdPregunta == idPregunta &&
                 context.Lecciones.Any(l =>
                     l.IdLeccion == p.IdLeccion &&
                     context.DocenteCursoMaterias.Any(
                         dcm => dcm.IdDocenteCursoMateria == l.IdDocenteCursoMateria && dcm.IdDocente == idDocente)),
            cancellationToken);

    public async Task<Pregunta> CreateAsync(Pregunta entity, CancellationToken cancellationToken = default)
    {
        await context.Preguntas.AddAsync(entity, cancellationToken);
        return entity;
    }

    public Task UpdateAsync(Pregunta entity, CancellationToken cancellationToken = default)
    {
        context.Preguntas.Update(entity);
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        await context.Preguntas
            .Where(x => x.IdPregunta == id)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.Estado, EstadoPregunta.Inactiva), cancellationToken);
    }
}
