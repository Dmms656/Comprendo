using Comprendo.Domain.Entities;

namespace Comprendo.Application.Abstractions.Persistence;

public interface IIntegracionRepository
{
    Task<EnvioTelegram> RegisterEnvioAsync(EnvioTelegram entity, CancellationToken cancellationToken = default);

    Task<EnvioTelegram?> GetEnvioByPreguntaEstudianteAsync(int idPregunta, int idEstudiante, CancellationToken cancellationToken = default);

    Task<RespuestaEstudiante> RegisterRespuestaAsync(RespuestaEstudiante entity, CancellationToken cancellationToken = default);

    Task<SolicitudIa> RegisterSolicitudIaAsync(SolicitudIa entity, CancellationToken cancellationToken = default);
}
