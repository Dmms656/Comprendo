namespace Comprendo.Application.Features.Resultados;

public record ResultadoLeccionDto(
    int IdResultado,
    int IdLeccion,
    string LeccionTitulo,
    int IdEstudiante,
    string? Nombres,
    string? Apellidos,
    int TotalPreguntas,
    int PreguntasRespondidas,
    int RespuestasCorrectas,
    int RespuestasIncorrectas,
    decimal PuntajeObtenido,
    decimal PuntajeTotal,
    decimal Porcentaje,
    string Estado,
    DateTimeOffset? FechaInicio,
    DateTimeOffset? FechaFinalizacion);
