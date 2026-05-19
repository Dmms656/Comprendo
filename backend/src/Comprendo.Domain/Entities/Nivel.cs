namespace Comprendo.Domain.Entities;

public class Nivel
{
    public int IdNivel { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }

    public ICollection<Curso> Cursos { get; set; } = [];
}
