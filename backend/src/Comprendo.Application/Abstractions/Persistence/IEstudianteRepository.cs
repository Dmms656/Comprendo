using Comprendo.Application.Common.Models;
using Comprendo.Domain.Entities;

namespace Comprendo.Application.Abstractions.Persistence;

public interface IEstudianteRepository
{
    Task<PaginatedList<Estudiante>> ListAsync(int pageNumber, int pageSize, CancellationToken cancellationToken = default);

    Task<PaginatedList<Estudiante>> ListByMateriaAsync(
        int idDocenteCursoMateria,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<Estudiante?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<Estudiante?> GetByTelefonoAsync(string telefono, CancellationToken cancellationToken = default);

    Task<Estudiante> CreateAsync(Estudiante entity, CancellationToken cancellationToken = default);

    Task UpdateAsync(Estudiante entity, CancellationToken cancellationToken = default);

    Task<EstudianteCurso> EnrollCursoAsync(EstudianteCurso entity, CancellationToken cancellationToken = default);

    Task<EstudianteMateria> EnrollMateriaAsync(EstudianteMateria entity, CancellationToken cancellationToken = default);

    Task<Estudiante?> GetByTelegramChatIdAsync(string telegramChatId, CancellationToken cancellationToken = default);

    Task<bool> IsEnrolledInCursoAsync(int idEstudiante, int idCurso, CancellationToken cancellationToken = default);

    Task<bool> IsEnrolledInMateriaAsync(int idEstudiante, int idDocenteCursoMateria, CancellationToken cancellationToken = default);
}
