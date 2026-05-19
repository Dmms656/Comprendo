using Comprendo.Application.Features.Integracion;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Comprendo.Api.Controllers;

/// <summary>
/// Endpoints de integración para el equipo de Telegram/IA.
/// Autenticación por API key (header X-Integration-Api-Key), no JWT.
/// </summary>
[ApiController]
[Route("api/integracion")]
public class IntegracionController(ISender sender) : ControllerBase
{
    /// <summary>Registra un envío de pregunta por Telegram.</summary>
    [HttpPost("envios")]
    public async Task<ActionResult<EnvioTelegramDto>> RegisterEnvio(
        [FromBody] RegisterEnvioCommand command,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(command, cancellationToken));

    /// <summary>Registra la respuesta de un estudiante.</summary>
    [HttpPost("respuestas")]
    public async Task<ActionResult<RespuestaEstudianteDto>> RegisterRespuesta(
        [FromBody] RegisterRespuestaCommand command,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(command, cancellationToken));

    /// <summary>Registra una solicitud de generación con IA.</summary>
    [HttpPost("solicitudes-ia")]
    public async Task<ActionResult<SolicitudIaDto>> RegisterSolicitudIa(
        [FromBody] RegisterSolicitudIaCommand command,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(command, cancellationToken));
}
