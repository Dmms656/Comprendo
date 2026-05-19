using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Domain.Entities;

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
}
