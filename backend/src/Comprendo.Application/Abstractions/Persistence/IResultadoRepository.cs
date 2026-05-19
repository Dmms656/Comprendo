using Comprendo.Domain.Entities;

namespace Comprendo.Application.Abstractions.Persistence;

public interface IResultadoRepository
{
    Task<IReadOnlyList<ResultadoLeccionDetalle>> GetByLeccionAsync(int idLeccion, CancellationToken cancellationToken = default);

    Task<bool> LeccionBelongsToDocenteAsync(int idLeccion, int idDocente, CancellationToken cancellationToken = default);
}
