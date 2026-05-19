using Comprendo.Application.Common.Models;
using Comprendo.Application.Features.Academico.AniosLectivos;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Comprendo.Api.Controllers;

/// <summary>Catálogo de años lectivos.</summary>
[ApiController]
[Route("api/academico/anios-lectivos")]
[Authorize(Roles = "ADMIN,DOCENTE")]
public class AniosLectivosController(ISender sender) : ControllerBase
{
    /// <summary>Lista años lectivos paginados.</summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedList<AnioLectivoDto>>> List(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(new ListAniosLectivosQuery(pageNumber, pageSize), cancellationToken));

    /// <summary>Obtiene un año lectivo por id.</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<AnioLectivoDto>> GetById(int id, CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GetAnioLectivoByIdQuery(id), cancellationToken));

    /// <summary>Crea un año lectivo.</summary>
    [HttpPost]
    public async Task<ActionResult<AnioLectivoDto>> Create(
        [FromBody] CreateAnioLectivoCommand command,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(command, cancellationToken));

    /// <summary>Actualiza un año lectivo.</summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<AnioLectivoDto>> Update(
        int id,
        [FromBody] UpdateAnioLectivoBody body,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(
            new UpdateAnioLectivoCommand(id, body.Nombre, body.FechaInicio, body.FechaFin, body.Estado),
            cancellationToken));
}

public record UpdateAnioLectivoBody(string Nombre, DateOnly FechaInicio, DateOnly FechaFin, string Estado);
