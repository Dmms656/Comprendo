namespace Comprendo.Domain.Entities;

public class Paralelo
{
    public int IdParalelo { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }

    public ICollection<Curso> Cursos { get; set; } = [];
}
