using Comprendo.Domain.Enums;

namespace Comprendo.Domain.Entities;

public class SesionUsuario
{
    public int IdSesion { get; set; }
    public int IdUsuario { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTimeOffset FechaInicio { get; set; }
    public DateTimeOffset FechaExpiracion { get; set; }
    public string? IpOrigen { get; set; }
    public string? UserAgent { get; set; }
    public EstadoSesion Estado { get; set; }

    public Usuario Usuario { get; set; } = null!;
}
