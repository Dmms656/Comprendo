using Comprendo.Application.Common.Models;
using Comprendo.Application.Features.Estudiantes;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Comprendo.Api.Controllers;

/// <summary>Gestión de estudiantes y matrículas.</summary>
[ApiController]
[Route("api/estudiantes")]
[Authorize(Roles = "DOCENTE")]
public class EstudiantesController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PaginatedList<EstudianteDto>>> List(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(new ListEstudiantesQuery(pageNumber, pageSize), cancellationToken));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EstudianteDto>> GetById(int id, CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GetEstudianteByIdQuery(id), cancellationToken));

    [HttpPost]
    public async Task<ActionResult<EstudianteDto>> Create(
        [FromBody] CreateEstudianteCommand command,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(command, cancellationToken));

    [HttpPut("{id:int}")]
    public async Task<ActionResult<EstudianteDto>> Update(
        int id,
        [FromBody] UpdateEstudianteBody body,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(
            new UpdateEstudianteCommand(
                id,
                body.TelefonoTelegram,
                body.CodigoEstudiante,
                body.TelegramChatId,
                body.TelegramUsername,
                body.Estado),
            cancellationToken));

    /// <summary>Matricula un estudiante en un curso.</summary>
    [HttpPost("{id:int}/cursos")]
    public async Task<ActionResult<int>> EnrollCurso(
        int id,
        [FromBody] EnrollCursoBody body,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new EnrollEstudianteCursoCommand(id, body.IdCurso), cancellationToken));

    /// <summary>Matricula un estudiante en una asignación docente-curso-materia.</summary>
    [HttpPost("{id:int}/materias")]
    public async Task<ActionResult<int>> EnrollMateria(
        int id,
        [FromBody] EnrollMateriaBody body,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new EnrollEstudianteMateriaCommand(id, body.IdDocenteCursoMateria), cancellationToken));
}

public record UpdateEstudianteBody(
    string TelefonoTelegram,
    string? CodigoEstudiante,
    string? TelegramChatId,
    string? TelegramUsername,
    string Estado);

public record EnrollCursoBody(int IdCurso);

public record EnrollMateriaBody(int IdDocenteCursoMateria);
