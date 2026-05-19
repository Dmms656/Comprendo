using Comprendo.Application.Common.Models;
using Comprendo.Application.Features.Academico.Niveles;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Comprendo.Api.Controllers;

/// <summary>Catálogo de niveles educativos.</summary>
[ApiController]
[Route("api/academico/niveles")]
[Authorize(Roles = "ADMIN,DOCENTE")]
public class NivelesController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PaginatedList<NivelDto>>> List(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(new ListNivelesQuery(pageNumber, pageSize), cancellationToken));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<NivelDto>> GetById(int id, CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GetNivelByIdQuery(id), cancellationToken));

    [HttpPost]
    public async Task<ActionResult<NivelDto>> Create(
        [FromBody] CreateNivelCommand command,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(command, cancellationToken));

    [HttpPut("{id:int}")]
    public async Task<ActionResult<NivelDto>> Update(
        int id,
        [FromBody] UpdateNivelBody body,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new UpdateNivelCommand(id, body.Nombre, body.Descripcion), cancellationToken));
}

public record UpdateNivelBody(string Nombre, string? Descripcion);
