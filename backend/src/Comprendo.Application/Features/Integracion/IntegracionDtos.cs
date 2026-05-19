namespace Comprendo.Application.Features.Integracion;

public record EnvioTelegramDto(
    int IdEnvio,
    int IdLeccion,
    int IdPregunta,
    int IdEstudiante,
    string EstadoEnvio,
    DateTimeOffset FechaEnvio);

public record RespuestaEstudianteDto(
    int IdRespuesta,
    int IdEnvio,
    int IdEstudiante,
    int IdPregunta,
    string RespuestaTexto,
    bool? EsCorrecta,
    decimal PuntajeObtenido,
    DateTimeOffset FechaRespuesta);

public record SolicitudIaDto(
    int IdSolicitudIa,
    int IdDocente,
    int? IdLeccion,
    string Proveedor,
    string Estado,
    DateTimeOffset FechaSolicitud);
