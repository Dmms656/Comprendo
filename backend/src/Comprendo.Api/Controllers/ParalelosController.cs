using Comprendo.Application.Common.Models;
using Comprendo.Application.Features.Academico.Paralelos;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Comprendo.Api.Controllers;

/// <summary>Catálogo de paralelos.</summary>
[ApiController]
[Route("api/academico/paralelos")]
[Authorize(Roles = "ADMIN,DOCENTE")]
public class ParalelosController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PaginatedList<ParaleloDto>>> List(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(new ListParalelosQuery(pageNumber, pageSize), cancellationToken));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ParaleloDto>> GetById(int id, CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GetParaleloByIdQuery(id), cancellationToken));

    [HttpPost]
    public async Task<ActionResult<ParaleloDto>> Create(
        [FromBody] CreateParaleloCommand command,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(command, cancellationToken));

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ParaleloDto>> Update(
        int id,
        [FromBody] UpdateParaleloBody body,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new UpdateParaleloCommand(id, body.Nombre, body.Descripcion), cancellationToken));
}

public record UpdateParaleloBody(string Nombre, string? Descripcion);
