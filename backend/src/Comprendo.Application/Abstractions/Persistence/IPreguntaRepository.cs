using Comprendo.Domain.Entities;

namespace Comprendo.Application.Abstractions.Persistence;

public interface IPreguntaRepository
{
    Task<IReadOnlyList<Pregunta>> ListByLeccionAsync(int idLeccion, CancellationToken cancellationToken = default);

    Task<Pregunta?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<bool> BelongsToDocenteLeccionAsync(int idPregunta, int idDocente, CancellationToken cancellationToken = default);

    Task<Pregunta> CreateAsync(Pregunta entity, CancellationToken cancellationToken = default);

    Task UpdateAsync(Pregunta entity, CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
