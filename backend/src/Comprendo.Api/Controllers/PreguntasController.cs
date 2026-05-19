using Comprendo.Application.Features.Preguntas;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Comprendo.Api.Controllers;

/// <summary>Preguntas de una lección.</summary>
[ApiController]
[Route("api/lecciones/{leccionId:int}/preguntas")]
[Authorize(Roles = "DOCENTE")]
public class PreguntasController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PreguntaDto>>> List(
        int leccionId,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new ListPreguntasByLeccionQuery(leccionId), cancellationToken));

    [HttpPost]
    public async Task<ActionResult<PreguntaDto>> Create(
        int leccionId,
        [FromBody] CreatePreguntaBody body,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(
            new CreatePreguntaCommand(
                leccionId,
                body.Enunciado,
                body.TipoPregunta,
                body.RespuestaCorrecta,
                body.Explicacion,
                body.Puntaje,
                body.Orden,
                body.Opciones),
            cancellationToken));

    [HttpPut("{id:int}")]
    public async Task<ActionResult<PreguntaDto>> Update(
        int leccionId,
        int id,
        [FromBody] UpdatePreguntaBody body,
        CancellationToken cancellationToken)
    {
        _ = leccionId;
        return Ok(await sender.Send(
            new UpdatePreguntaCommand(
                id,
                body.Enunciado,
                body.TipoPregunta,
                body.RespuestaCorrecta,
                body.Explicacion,
                body.Puntaje,
                body.Orden,
                body.Estado,
                body.Opciones),
            cancellationToken));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int leccionId, int id, CancellationToken cancellationToken)
    {
        _ = leccionId;
        await sender.Send(new DeletePreguntaCommand(id), cancellationToken);
        return NoContent();
    }
}

public record CreatePreguntaBody(
    string Enunciado,
    string TipoPregunta,
    string? RespuestaCorrecta,
    string? Explicacion,
    decimal Puntaje,
    int Orden,
    IReadOnlyList<OpcionPreguntaInput>? Opciones);

public record UpdatePreguntaBody(
    string Enunciado,
    string TipoPregunta,
    string? RespuestaCorrecta,
    string? Explicacion,
    decimal Puntaje,
    int Orden,
    string Estado,
    IReadOnlyList<OpcionPreguntaInput>? Opciones);
