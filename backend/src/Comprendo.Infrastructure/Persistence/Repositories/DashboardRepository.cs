using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Comprendo.Infrastructure.Persistence.Repositories;

public class DashboardRepository(ComprendoDbContext dbContext) : IDashboardRepository
{
    public async Task<DashboardResumen> GetResumenByDocenteAsync(
        int idDocente,
        CancellationToken cancellationToken = default)
    {
        var leccionIds = dbContext.Lecciones
            .Where(l => l.DocenteCursoMateria.IdDocente == idDocente)
            .Select(l => l.IdLeccion);

        var totalLecciones = await leccionIds.CountAsync(cancellationToken);
        var leccionesActivas = await dbContext.Lecciones.CountAsync(
            l => l.DocenteCursoMateria.IdDocente == idDocente
                 && (l.Estado == EstadoLeccion.Programada || l.Estado == EstadoLeccion.Enviada),
            cancellationToken);

        var asignacionIds = dbContext.DocenteCursoMaterias
            .Where(d => d.IdDocente == idDocente)
            .Select(d => d.IdDocenteCursoMateria);

        var totalAsignaciones = await asignacionIds.CountAsync(cancellationToken);

        var totalEstudiantes = await dbContext.EstudianteMaterias
            .Where(em => asignacionIds.Contains(em.IdDocenteCursoMateria))
            .Select(em => em.IdEstudiante)
            .Distinct()
            .CountAsync(cancellationToken);

        var preguntasPendientes = await dbContext.EnviosTelegram.CountAsync(
            e => leccionIds.Contains(e.IdLeccion) && e.EstadoEnvio == EstadoEnvioTelegram.Pendiente,
            cancellationToken);

        return new DashboardResumen
        {
            TotalLecciones = totalLecciones,
            LeccionesActivas = leccionesActivas,
            TotalEstudiantes = totalEstudiantes,
            TotalAsignaciones = totalAsignaciones,
            PreguntasPendientesEnvio = preguntasPendientes
        };
    }
}
