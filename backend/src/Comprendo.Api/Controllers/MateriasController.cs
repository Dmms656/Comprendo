using Comprendo.Application.Common.Models;
using Comprendo.Application.Features.Academico.Materias;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Comprendo.Api.Controllers;

/// <summary>Catálogo de materias.</summary>
[ApiController]
[Route("api/academico/materias")]
[Authorize(Roles = "ADMIN,DOCENTE")]
public class MateriasController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PaginatedList<MateriaDto>>> List(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(new ListMateriasQuery(pageNumber, pageSize), cancellationToken));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MateriaDto>> GetById(int id, CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GetMateriaByIdQuery(id), cancellationToken));

    [HttpPost]
    public async Task<ActionResult<MateriaDto>> Create(
        [FromBody] CreateMateriaCommand command,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(command, cancellationToken));

    [HttpPut("{id:int}")]
    public async Task<ActionResult<MateriaDto>> Update(
        int id,
        [FromBody] UpdateMateriaBody body,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(
            new UpdateMateriaCommand(id, body.Nombre, body.Descripcion, body.Estado),
            cancellationToken));
}

public record UpdateMateriaBody(string Nombre, string? Descripcion, string Estado);
