using Comprendo.Domain.Enums;

namespace Comprendo.Domain.Entities;

public class AnioLectivo
{
    public int IdAnioLectivo { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public DateOnly FechaInicio { get; set; }
    public DateOnly FechaFin { get; set; }
    public EstadoAnioLectivo Estado { get; set; }

    public ICollection<Curso> Cursos { get; set; } = [];
}
