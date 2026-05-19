using Comprendo.Application.Common.Models;
using Comprendo.Application.Features.Academico.Cursos;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Comprendo.Api.Controllers;

/// <summary>Catálogo de cursos (año + nivel + paralelo).</summary>
[ApiController]
[Route("api/academico/cursos")]
[Authorize(Roles = "ADMIN,DOCENTE")]
public class CursosController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PaginatedList<CursoDto>>> List(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(new ListCursosQuery(pageNumber, pageSize), cancellationToken));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CursoDto>> GetById(int id, CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GetCursoByIdQuery(id), cancellationToken));

    [HttpPost]
    public async Task<ActionResult<CursoDto>> Create(
        [FromBody] CreateCursoCommand command,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(command, cancellationToken));

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CursoDto>> Update(
        int id,
        [FromBody] UpdateCursoBody body,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(
            new UpdateCursoCommand(id, body.IdAnioLectivo, body.IdNivel, body.IdParalelo, body.Estado),
            cancellationToken));
}

public record UpdateCursoBody(int IdAnioLectivo, int IdNivel, int IdParalelo, string Estado);
