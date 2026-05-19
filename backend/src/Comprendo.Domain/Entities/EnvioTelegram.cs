using Comprendo.Domain.Enums;

namespace Comprendo.Domain.Entities;

public class EnvioTelegram
{
    public int IdEnvio { get; set; }
    public int IdLeccion { get; set; }
    public int IdPregunta { get; set; }
    public int IdEstudiante { get; set; }
    public string TelegramChatId { get; set; } = string.Empty;
    public string? MensajeEnviado { get; set; }
    public string? TelegramMessageId { get; set; }
    public DateTimeOffset FechaEnvio { get; set; }
    public EstadoEnvioTelegram EstadoEnvio { get; set; }
    public string? ErrorEnvio { get; set; }

    public Leccion Leccion { get; set; } = null!;
    public Pregunta Pregunta { get; set; } = null!;
    public Estudiante Estudiante { get; set; } = null!;
    public RespuestaEstudiante? RespuestaEstudiante { get; set; }
}
