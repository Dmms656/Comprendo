using Comprendo.Domain.Enums;

namespace Comprendo.Domain.Entities;

public class Estudiante
{
    public int IdEstudiante { get; set; }
    public int? IdUsuario { get; set; }
    public string? CodigoEstudiante { get; set; }
    public string TelefonoTelegram { get; set; } = string.Empty;
    public string? TelegramChatId { get; set; }
    public string? TelegramUsername { get; set; }
    public EstadoEstudiante Estado { get; set; }
    public DateTimeOffset FechaRegistro { get; set; }

    public Usuario? Usuario { get; set; }
    public ICollection<EstudianteCurso> EstudianteCursos { get; set; } = [];
    public ICollection<EstudianteMateria> EstudianteMaterias { get; set; } = [];
    public ICollection<EnvioTelegram> EnviosTelegram { get; set; } = [];
    public ICollection<RespuestaEstudiante> RespuestasEstudiante { get; set; } = [];
    public ICollection<ResultadoLeccion> ResultadosLeccion { get; set; } = [];
}
