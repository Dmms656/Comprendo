namespace Comprendo.Application.Features.Preguntas;

public record OpcionPreguntaDto(int IdOpcion, string Literal, string Texto, bool EsCorrecta);

public record PreguntaDto(
    int IdPregunta,
    int IdLeccion,
    string Enunciado,
    string TipoPregunta,
    string? RespuestaCorrecta,
    string? Explicacion,
    decimal Puntaje,
    int Orden,
    bool GeneradaPorIa,
    string Estado,
    IReadOnlyList<OpcionPreguntaDto> Opciones);

public record OpcionPreguntaInput(string Literal, string Texto, bool EsCorrecta);
