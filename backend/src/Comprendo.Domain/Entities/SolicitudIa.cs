using Comprendo.Domain.Enums;

namespace Comprendo.Domain.Entities;

public class SolicitudIa
{
    public int IdSolicitudIa { get; set; }
    public int IdDocente { get; set; }
    public int? IdLeccion { get; set; }
    public string Proveedor { get; set; } = string.Empty;
    public string? Modelo { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public string? RespuestaIa { get; set; }
    public int CantidadPreguntasGeneradas { get; set; }
    public int? TokensEntrada { get; set; }
    public int? TokensSalida { get; set; }
    public DateTimeOffset FechaSolicitud { get; set; }
    public EstadoSolicitudIa Estado { get; set; }
    public string? Error { get; set; }

    public Docente Docente { get; set; } = null!;
    public Leccion? Leccion { get; set; }
    public ICollection<Pregunta> Preguntas { get; set; } = [];
}
