using Comprendo.Application.Features.Asignaciones;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Comprendo.Api.Controllers;

/// <summary>Asignaciones docente-curso-materia del usuario autenticado.</summary>
[ApiController]
[Route("api/asignaciones")]
[Authorize(Roles = "DOCENTE")]
public class AsignacionesController(ISender sender) : ControllerBase
{
    /// <summary>Lista las asignaciones del docente autenticado.</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DocenteAsignacionDto>>> List(CancellationToken cancellationToken) =>
        Ok(await sender.Send(new ListDocenteAsignacionesQuery(), cancellationToken));

    /// <summary>Crea una asignación para el docente autenticado.</summary>
    [HttpPost]
    public async Task<ActionResult<DocenteAsignacionDto>> Create(
        [FromBody] CreateAsignacionCommand command,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(command, cancellationToken));

    /// <summary>Genera un código de acceso para la asignación.</summary>
    [HttpPost("{id:int}/generar-codigo")]
    public async Task<ActionResult<string>> GenerarCodigo(
        int id,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GenerarCodigoAsignacionCommand(id), cancellationToken));
}
