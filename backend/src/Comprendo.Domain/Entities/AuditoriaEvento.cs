namespace Comprendo.Domain.Entities;

public class AuditoriaEvento
{
    public int IdEvento { get; set; }
    public int? IdUsuario { get; set; }
    public string Accion { get; set; } = string.Empty;
    public string? Entidad { get; set; }
    public int? IdEntidad { get; set; }
    public string? Descripcion { get; set; }
    public DateTimeOffset FechaEvento { get; set; }
    public string? IpOrigen { get; set; }

    public Usuario? Usuario { get; set; }
}
