using Comprendo.Application.Common.Models;
using Comprendo.Application.Features.Lecciones;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Comprendo.Api.Controllers;

/// <summary>Lecciones del docente autenticado.</summary>
[ApiController]
[Route("api/lecciones")]
[Authorize(Roles = "DOCENTE")]
public class LeccionesController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PaginatedList<LeccionDto>>> List(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(new ListLeccionesQuery(pageNumber, pageSize), cancellationToken));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<LeccionDto>> GetById(int id, CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GetLeccionByIdQuery(id), cancellationToken));

    [HttpPost]
    public async Task<ActionResult<LeccionDto>> Create(
        [FromBody] CreateLeccionCommand command,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(command, cancellationToken));

    [HttpPut("{id:int}")]
    public async Task<ActionResult<LeccionDto>> Update(
        int id,
        [FromBody] UpdateLeccionBody body,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(
            new UpdateLeccionCommand(id, body.Titulo, body.Descripcion, body.Tema, body.FechaProgramada),
            cancellationToken));

    /// <summary>Cambia el estado de una lección (BORRADOR, PROGRAMADA, ENVIADA, etc.).</summary>
    [HttpPatch("{id:int}/estado")]
    public async Task<ActionResult<LeccionDto>> ChangeEstado(
        int id,
        [FromBody] ChangeEstadoBody body,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new ChangeLeccionEstadoCommand(id, body.Estado), cancellationToken));
}

public record UpdateLeccionBody(string Titulo, string? Descripcion, string? Tema, DateTimeOffset? FechaProgramada);

public record ChangeEstadoBody(string Estado);
