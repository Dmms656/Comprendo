namespace Comprendo.Domain.Entities;

public class RespuestaEstudiante
{
    public int IdRespuesta { get; set; }
    public int IdEnvio { get; set; }
    public int IdEstudiante { get; set; }
    public int IdPregunta { get; set; }
    public string RespuestaTexto { get; set; } = string.Empty;
    public bool? EsCorrecta { get; set; }
    public decimal PuntajeObtenido { get; set; }
    public DateTimeOffset FechaRespuesta { get; set; }
    public int? TiempoRespuestaSegundos { get; set; }
    public bool EvaluadaPorIa { get; set; }
    public string? Retroalimentacion { get; set; }

    public EnvioTelegram EnvioTelegram { get; set; } = null!;
    public Estudiante Estudiante { get; set; } = null!;
    public Pregunta Pregunta { get; set; } = null!;
}
