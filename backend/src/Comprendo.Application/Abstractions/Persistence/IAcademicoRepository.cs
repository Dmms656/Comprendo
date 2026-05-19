using Comprendo.Application.Common.Models;
using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;

namespace Comprendo.Application.Abstractions.Persistence;

public interface IAcademicoRepository
{
    Task<PaginatedList<AnioLectivo>> ListAniosLectivosAsync(int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<AnioLectivo?> GetAnioLectivoByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<AnioLectivo> CreateAnioLectivoAsync(AnioLectivo entity, CancellationToken cancellationToken = default);
    Task UpdateAnioLectivoAsync(AnioLectivo entity, CancellationToken cancellationToken = default);

    Task<PaginatedList<Nivel>> ListNivelesAsync(int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<Nivel?> GetNivelByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Nivel> CreateNivelAsync(Nivel entity, CancellationToken cancellationToken = default);
    Task UpdateNivelAsync(Nivel entity, CancellationToken cancellationToken = default);

    Task<PaginatedList<Paralelo>> ListParalelosAsync(int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<Paralelo?> GetParaleloByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Paralelo> CreateParaleloAsync(Paralelo entity, CancellationToken cancellationToken = default);
    Task UpdateParaleloAsync(Paralelo entity, CancellationToken cancellationToken = default);

    Task<PaginatedList<Curso>> ListCursosAsync(int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<Curso?> GetCursoByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Curso> CreateCursoAsync(Curso entity, CancellationToken cancellationToken = default);
    Task UpdateCursoAsync(Curso entity, CancellationToken cancellationToken = default);

    Task<PaginatedList<Materia>> ListMateriasAsync(int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<Materia?> GetMateriaByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Materia> CreateMateriaAsync(Materia entity, CancellationToken cancellationToken = default);
    Task UpdateMateriaAsync(Materia entity, CancellationToken cancellationToken = default);
}
