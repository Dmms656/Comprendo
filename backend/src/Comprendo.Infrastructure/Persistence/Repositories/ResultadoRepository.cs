using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Comprendo.Infrastructure.Persistence.Repositories;

public class ResultadoRepository(ComprendoDbContext dbContext) : IResultadoRepository
{
    public async Task<IReadOnlyList<ResultadoLeccionDetalle>> GetByLeccionAsync(
        int idLeccion,
        CancellationToken cancellationToken = default)
    {
        return await (
            from r in dbContext.ResultadosLeccion
            join l in dbContext.Lecciones on r.IdLeccion equals l.IdLeccion
            join e in dbContext.Estudiantes on r.IdEstudiante equals e.IdEstudiante
            join u in dbContext.Usuarios on e.IdUsuario equals u.IdUsuario into usuarioJoin
            from u in usuarioJoin.DefaultIfEmpty()
            where r.IdLeccion == idLeccion
            orderby r.Porcentaje descending
            select new ResultadoLeccionDetalle
            {
                IdResultado = r.IdResultado,
                IdLeccion = r.IdLeccion,
                LeccionTitulo = l.Titulo,
                IdEstudiante = r.IdEstudiante,
                Nombres = u != null ? u.Nombres : null,
                Apellidos = u != null ? u.Apellidos : null,
                TotalPreguntas = r.TotalPreguntas,
                PreguntasRespondidas = r.PreguntasRespondidas,
                RespuestasCorrectas = r.RespuestasCorrectas,
                RespuestasIncorrectas = r.RespuestasIncorrectas,
                PuntajeObtenido = r.PuntajeObtenido,
                PuntajeTotal = r.PuntajeTotal,
                Porcentaje = r.Porcentaje,
                Estado = r.Estado,
                FechaInicio = r.FechaInicio,
                FechaFinalizacion = r.FechaFinalizacion
            }).ToListAsync(cancellationToken);
    }

    public Task<bool> LeccionBelongsToDocenteAsync(
        int idLeccion,
        int idDocente,
        CancellationToken cancellationToken = default) =>
        dbContext.Lecciones.AnyAsync(
            l => l.IdLeccion == idLeccion && l.DocenteCursoMateria.IdDocente == idDocente,
            cancellationToken);
}
