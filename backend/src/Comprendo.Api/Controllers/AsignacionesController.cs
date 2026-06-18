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

    /// <summary>Actualiza curso y materia de una asignación activa.</summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<DocenteAsignacionDto>> Update(
        int id,
        [FromBody] UpdateAsignacionBody body,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new UpdateAsignacionCommand(id, body.IdCurso, body.IdMateria), cancellationToken));

    /// <summary>Desactiva una asignación (eliminación lógica).</summary>
    [HttpDelete("{id:int}")]
    public async Task<ActionResult<DeactivateAsignacionResult>> Deactivate(
        int id,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new DeactivateAsignacionCommand(id), cancellationToken));
}

public record UpdateAsignacionBody(int IdCurso, int IdMateria);
