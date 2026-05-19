using Comprendo.Domain.Enums;

namespace Comprendo.Domain.Entities;

public class EstudianteMateria
{
    public int IdEstudianteMateria { get; set; }
    public int IdEstudiante { get; set; }
    public int IdDocenteCursoMateria { get; set; }
    public EstadoAsignacion Estado { get; set; }
    public DateTimeOffset FechaRegistro { get; set; }

    public Estudiante Estudiante { get; set; } = null!;
    public DocenteCursoMateria DocenteCursoMateria { get; set; } = null!;
}
