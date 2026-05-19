using Comprendo.Domain.Enums;

namespace Comprendo.Domain.Entities;

public class Materia
{
    public int IdMateria { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public EstadoMateria Estado { get; set; }

    public ICollection<DocenteCursoMateria> DocenteCursoMaterias { get; set; } = [];
}
