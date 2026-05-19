using Comprendo.Domain.Enums;

namespace Comprendo.Domain.Entities;

public class Usuario
{
    public int IdUsuario { get; set; }
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? PasswordHash { get; set; }
    public TipoUsuario TipoUsuario { get; set; }
    public EstadoUsuario Estado { get; set; }
    public DateTimeOffset FechaCreacion { get; set; }

    public Docente? Docente { get; set; }
    public Estudiante? Estudiante { get; set; }
    public ICollection<SesionUsuario> Sesiones { get; set; } = [];
    public ICollection<AuditoriaEvento> AuditoriaEventos { get; set; } = [];
}
