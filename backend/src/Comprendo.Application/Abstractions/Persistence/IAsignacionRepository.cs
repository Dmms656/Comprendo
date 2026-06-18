using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;

namespace Comprendo.Application.Abstractions.Persistence;

public interface IAsignacionRepository
{
    Task<IReadOnlyList<DocenteAsignacionDetalle>> ListByDocenteAsync(int idDocente, CancellationToken cancellationToken = default);

    Task<DocenteCursoMateria?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<DocenteCursoMateria?> GetByCodigoAccesoAsync(string codigoAcceso, CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(int idDocente, int idCurso, int idMateria, CancellationToken cancellationToken = default);

    Task<DocenteCursoMateria?> GetByDocenteCursoMateriaAsync(
        int idDocente,
        int idCurso,
        int idMateria,
        CancellationToken cancellationToken = default);

    Task<DocenteCursoMateria> CreateAsync(DocenteCursoMateria entity, CancellationToken cancellationToken = default);

    Task UpdateAsync(DocenteCursoMateria entity, CancellationToken cancellationToken = default);
}
