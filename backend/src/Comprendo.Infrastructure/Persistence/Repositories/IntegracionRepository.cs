using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Comprendo.Infrastructure.Persistence.Repositories;

public class IntegracionRepository(ComprendoDbContext dbContext) : IIntegracionRepository
{
    public Task<EnvioTelegram> RegisterEnvioAsync(
        EnvioTelegram entity,
        CancellationToken cancellationToken = default)
    {
        dbContext.EnviosTelegram.Add(entity);
        return Task.FromResult(entity);
    }

    public Task<EnvioTelegram?> GetEnvioByPreguntaEstudianteAsync(
        int idPregunta,
        int idEstudiante,
        CancellationToken cancellationToken = default)
    {
        return dbContext.EnviosTelegram
            .FirstOrDefaultAsync(
                e => e.IdPregunta == idPregunta && e.IdEstudiante == idEstudiante,
                cancellationToken);
    }

    public Task<RespuestaEstudiante> RegisterRespuestaAsync(
        RespuestaEstudiante entity,
        CancellationToken cancellationToken = default)
    {
        dbContext.RespuestasEstudiantes.Add(entity);
        return Task.FromResult(entity);
    }

    public Task<SolicitudIa> RegisterSolicitudIaAsync(
        SolicitudIa entity,
        CancellationToken cancellationToken = default)
    {
        dbContext.SolicitudesIa.Add(entity);
        return Task.FromResult(entity);
    }

    public Task<Leccion?> GetLeccionByIdEnvioAsync(
        int idEnvio,
        CancellationToken cancellationToken = default)
    {
        return dbContext.EnviosTelegram
            .Where(e => e.IdEnvio == idEnvio)
            .Select(e => e.Leccion)
            .FirstOrDefaultAsync(cancellationToken);
    }
}
