using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Comprendo.Infrastructure.Persistence.Repositories;

public class AsignacionRepository(ComprendoDbContext dbContext) : IAsignacionRepository
{
    public async Task<IReadOnlyList<DocenteAsignacionDetalle>> ListByDocenteAsync(
        int idDocente,
        CancellationToken cancellationToken = default)
    {
        return await (
            from dcm in dbContext.DocenteCursoMaterias
            join c in dbContext.Cursos on dcm.IdCurso equals c.IdCurso
            join al in dbContext.AniosLectivos on c.IdAnioLectivo equals al.IdAnioLectivo
            join n in dbContext.Niveles on c.IdNivel equals n.IdNivel
            join p in dbContext.Paralelos on c.IdParalelo equals p.IdParalelo
            join m in dbContext.Materias on dcm.IdMateria equals m.IdMateria
            where dcm.IdDocente == idDocente
            orderby al.Nombre, n.Nombre, p.Nombre, m.Nombre
            select new DocenteAsignacionDetalle
            {
                IdDocente = dcm.IdDocente,
                IdDocenteCursoMateria = dcm.IdDocenteCursoMateria,
                IdAnioLectivo = al.IdAnioLectivo,
                AnioLectivo = al.Nombre,
                IdNivel = n.IdNivel,
                Nivel = n.Nombre,
                IdParalelo = p.IdParalelo,
                Paralelo = p.Nombre,
                IdMateria = m.IdMateria,
                Materia = m.Nombre,
                IdCurso = c.IdCurso,
                Estado = dcm.Estado,
                CodigoAcceso = dcm.CodigoAcceso
            }).ToListAsync(cancellationToken);
    }

    public Task<DocenteCursoMateria?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        dbContext.DocenteCursoMaterias.FirstOrDefaultAsync(x => x.IdDocenteCursoMateria == id, cancellationToken);

    public Task<DocenteCursoMateria?> GetByCodigoAccesoAsync(string codigoAcceso, CancellationToken cancellationToken = default) =>
        dbContext.DocenteCursoMaterias
            .Include(x => x.Materia)
            .FirstOrDefaultAsync(x => x.CodigoAcceso == codigoAcceso, cancellationToken);

    public Task<bool> ExistsAsync(
        int idDocente,
        int idCurso,
        int idMateria,
        CancellationToken cancellationToken = default) =>
        dbContext.DocenteCursoMaterias.AnyAsync(
            x => x.IdDocente == idDocente && x.IdCurso == idCurso && x.IdMateria == idMateria,
            cancellationToken);

    public Task<DocenteCursoMateria> CreateAsync(
        DocenteCursoMateria entity,
        CancellationToken cancellationToken = default)
    {
        dbContext.DocenteCursoMaterias.Add(entity);
        return Task.FromResult(entity);
    }
}
