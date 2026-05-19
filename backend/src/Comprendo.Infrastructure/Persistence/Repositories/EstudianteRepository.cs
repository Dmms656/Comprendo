using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Models;
using Comprendo.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Comprendo.Infrastructure.Persistence.Repositories;

public class EstudianteRepository(ComprendoDbContext dbContext) : IEstudianteRepository
{
    public async Task<PaginatedList<Estudiante>> ListAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Estudiantes.OrderBy(x => x.IdEstudiante);
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        return new PaginatedList<Estudiante>(items, total, pageNumber, pageSize);
    }

    public Task<Estudiante?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        dbContext.Estudiantes.FirstOrDefaultAsync(x => x.IdEstudiante == id, cancellationToken);

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
}
