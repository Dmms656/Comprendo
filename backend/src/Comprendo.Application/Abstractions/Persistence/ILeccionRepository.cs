using Comprendo.Application.Common.Models;
using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;

namespace Comprendo.Application.Abstractions.Persistence;

public interface ILeccionRepository
{
    Task<PaginatedList<Leccion>> ListByDocenteAsync(int idDocente, int pageNumber, int pageSize, CancellationToken cancellationToken = default);

    Task<Leccion?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<bool> BelongsToDocenteAsync(int idLeccion, int idDocente, CancellationToken cancellationToken = default);

    Task<Leccion> CreateAsync(Leccion entity, CancellationToken cancellationToken = default);

    Task UpdateAsync(Leccion entity, CancellationToken cancellationToken = default);

    Task ChangeEstadoAsync(int idLeccion, EstadoLeccion estado, CancellationToken cancellationToken = default);
}
