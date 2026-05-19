using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Models;
using Comprendo.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Comprendo.Infrastructure.Persistence.Repositories;

public class AcademicoRepository(ComprendoDbContext dbContext) : IAcademicoRepository
{
    public async Task<PaginatedList<AnioLectivo>> ListAniosLectivosAsync(
        int pageNumber, int pageSize, CancellationToken cancellationToken = default) =>
        await PaginateAsync(dbContext.AniosLectivos.OrderBy(x => x.Nombre), pageNumber, pageSize, cancellationToken);

    public Task<AnioLectivo?> GetAnioLectivoByIdAsync(int id, CancellationToken cancellationToken = default) =>
        dbContext.AniosLectivos.FirstOrDefaultAsync(x => x.IdAnioLectivo == id, cancellationToken);

    public Task<AnioLectivo> CreateAnioLectivoAsync(AnioLectivo entity, CancellationToken cancellationToken = default)
    {
        dbContext.AniosLectivos.Add(entity);
        return Task.FromResult(entity);
    }

    public Task UpdateAnioLectivoAsync(AnioLectivo entity, CancellationToken cancellationToken = default)
    {
        dbContext.AniosLectivos.Update(entity);
        return Task.CompletedTask;
    }

    public async Task<PaginatedList<Nivel>> ListNivelesAsync(
        int pageNumber, int pageSize, CancellationToken cancellationToken = default) =>
        await PaginateAsync(dbContext.Niveles.OrderBy(x => x.Nombre), pageNumber, pageSize, cancellationToken);

    public Task<Nivel?> GetNivelByIdAsync(int id, CancellationToken cancellationToken = default) =>
        dbContext.Niveles.FirstOrDefaultAsync(x => x.IdNivel == id, cancellationToken);

    public Task<Nivel> CreateNivelAsync(Nivel entity, CancellationToken cancellationToken = default)
    {
        dbContext.Niveles.Add(entity);
        return Task.FromResult(entity);
    }

    public Task UpdateNivelAsync(Nivel entity, CancellationToken cancellationToken = default)
    {
        dbContext.Niveles.Update(entity);
        return Task.CompletedTask;
    }

    public async Task<PaginatedList<Paralelo>> ListParalelosAsync(
        int pageNumber, int pageSize, CancellationToken cancellationToken = default) =>
        await PaginateAsync(dbContext.Paralelos.OrderBy(x => x.Nombre), pageNumber, pageSize, cancellationToken);

    public Task<Paralelo?> GetParaleloByIdAsync(int id, CancellationToken cancellationToken = default) =>
        dbContext.Paralelos.FirstOrDefaultAsync(x => x.IdParalelo == id, cancellationToken);

    public Task<Paralelo> CreateParaleloAsync(Paralelo entity, CancellationToken cancellationToken = default)
    {
        dbContext.Paralelos.Add(entity);
        return Task.FromResult(entity);
    }

    public Task UpdateParaleloAsync(Paralelo entity, CancellationToken cancellationToken = default)
    {
        dbContext.Paralelos.Update(entity);
        return Task.CompletedTask;
    }

    public async Task<PaginatedList<Curso>> ListCursosAsync(
        int pageNumber, int pageSize, CancellationToken cancellationToken = default) =>
        await PaginateAsync(dbContext.Cursos.OrderBy(x => x.IdCurso), pageNumber, pageSize, cancellationToken);

    public Task<Curso?> GetCursoByIdAsync(int id, CancellationToken cancellationToken = default) =>
        dbContext.Cursos.FirstOrDefaultAsync(x => x.IdCurso == id, cancellationToken);

    public Task<Curso> CreateCursoAsync(Curso entity, CancellationToken cancellationToken = default)
    {
        dbContext.Cursos.Add(entity);
        return Task.FromResult(entity);
    }

    public Task UpdateCursoAsync(Curso entity, CancellationToken cancellationToken = default)
    {
        dbContext.Cursos.Update(entity);
        return Task.CompletedTask;
    }

    public async Task<PaginatedList<Materia>> ListMateriasAsync(
        int pageNumber, int pageSize, CancellationToken cancellationToken = default) =>
        await PaginateAsync(dbContext.Materias.OrderBy(x => x.Nombre), pageNumber, pageSize, cancellationToken);

    public Task<Materia?> GetMateriaByIdAsync(int id, CancellationToken cancellationToken = default) =>
        dbContext.Materias.FirstOrDefaultAsync(x => x.IdMateria == id, cancellationToken);

    public Task<Materia> CreateMateriaAsync(Materia entity, CancellationToken cancellationToken = default)
    {
        dbContext.Materias.Add(entity);
        return Task.FromResult(entity);
    }

    public Task UpdateMateriaAsync(Materia entity, CancellationToken cancellationToken = default)
    {
        dbContext.Materias.Update(entity);
        return Task.CompletedTask;
    }

    private static async Task<PaginatedList<T>> PaginateAsync<T>(
        IQueryable<T> query,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        return new PaginatedList<T>(items, total, pageNumber, pageSize);
    }
}
