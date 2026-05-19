using Comprendo.Application.Common.Models;
using Comprendo.Domain.Entities;

namespace Comprendo.Application.Abstractions.Persistence;

public interface IEstudianteRepository
{
    Task<PaginatedList<Estudiante>> ListAsync(int pageNumber, int pageSize, CancellationToken cancellationToken = default);

    Task<Estudiante?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<Estudiante> CreateAsync(Estudiante entity, CancellationToken cancellationToken = default);

    Task UpdateAsync(Estudiante entity, CancellationToken cancellationToken = default);

    Task<EstudianteCurso> EnrollCursoAsync(EstudianteCurso entity, CancellationToken cancellationToken = default);

    Task<EstudianteMateria> EnrollMateriaAsync(EstudianteMateria entity, CancellationToken cancellationToken = default);
}
