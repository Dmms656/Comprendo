using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Models;
using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Comprendo.Infrastructure.Persistence.Repositories;

public class EstudianteRepository(ComprendoDbContext dbContext) : IEstudianteRepository
{
    public async Task<PaginatedList<Estudiante>> ListAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Estudiantes.Include(x => x.Usuario).OrderBy(x => x.IdEstudiante);
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        return new PaginatedList<Estudiante>(items, total, pageNumber, pageSize);
    }

    public async Task<PaginatedList<Estudiante>> ListByMateriaAsync(
        int idDocenteCursoMateria,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Estudiantes
            .Include(x => x.Usuario)
            .Where(e => dbContext.EstudianteMaterias.Any(em =>
                em.IdEstudiante == e.IdEstudiante &&
                em.IdDocenteCursoMateria == idDocenteCursoMateria &&
                em.Estado == EstadoAsignacion.Activo))
            .OrderBy(x => x.IdEstudiante);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        return new PaginatedList<Estudiante>(items, total, pageNumber, pageSize);
    }

    public Task<Estudiante?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        dbContext.Estudiantes.Include(x => x.Usuario).FirstOrDefaultAsync(x => x.IdEstudiante == id, cancellationToken);

    public Task<Estudiante?> GetByTelefonoAsync(string telefono, CancellationToken cancellationToken = default) =>
        dbContext.Estudiantes.FirstOrDefaultAsync(x => x.TelefonoTelegram == telefono, cancellationToken);

    public Task<Estudiante> CreateAsync(Estudiante entity, CancellationToken cancellationToken = default)
    {
        dbContext.Estudiantes.Add(entity);
        return Task.FromResult(entity);
    }

    public Task UpdateAsync(Estudiante entity, CancellationToken cancellationToken = default)
    {
        dbContext.Estudiantes.Update(entity);
        return Task.CompletedTask;
    }

    public Task<EstudianteCurso> EnrollCursoAsync(
        EstudianteCurso entity,
        CancellationToken cancellationToken = default)
    {
        dbContext.EstudianteCursos.Add(entity);
        return Task.FromResult(entity);
    }

    public Task<EstudianteMateria> EnrollMateriaAsync(
        EstudianteMateria entity,
        CancellationToken cancellationToken = default)
    {
        dbContext.EstudianteMaterias.Add(entity);
        return Task.FromResult(entity);
    }

    public Task<Estudiante?> GetByTelegramChatIdAsync(string telegramChatId, CancellationToken cancellationToken = default) =>
        dbContext.Estudiantes
            .Include(x => x.Usuario)
            .FirstOrDefaultAsync(x => x.TelegramChatId == telegramChatId, cancellationToken);

    public Task<bool> IsEnrolledInCursoAsync(int idEstudiante, int idCurso, CancellationToken cancellationToken = default) =>
        dbContext.EstudianteCursos.AnyAsync(x => x.IdEstudiante == idEstudiante && x.IdCurso == idCurso, cancellationToken);

    public Task<bool> IsEnrolledInMateriaAsync(int idEstudiante, int idDocenteCursoMateria, CancellationToken cancellationToken = default) =>
        dbContext.EstudianteMaterias.AnyAsync(
            x => x.IdEstudiante == idEstudiante &&
                 x.IdDocenteCursoMateria == idDocenteCursoMateria &&
                 x.Estado == EstadoAsignacion.Activo,
            cancellationToken);
}
