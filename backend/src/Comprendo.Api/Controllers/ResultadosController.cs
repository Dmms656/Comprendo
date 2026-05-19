using Comprendo.Application.Features.Resultados;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Comprendo.Api.Controllers;

/// <summary>Resultados consolidados por lección.</summary>
[ApiController]
[Route("api/lecciones/{leccionId:int}/resultados")]
[Authorize(Roles = "DOCENTE")]
public class ResultadosController(ISender sender) : ControllerBase
{
    /// <summary>Lista resultados de estudiantes para la lección indicada.</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ResultadoLeccionDto>>> List(
        int leccionId,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GetResultadosByLeccionQuery(leccionId), cancellationToken));
}
