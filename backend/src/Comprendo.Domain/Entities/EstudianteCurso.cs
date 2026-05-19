using Comprendo.Domain.Enums;

namespace Comprendo.Domain.Entities;

public class EstudianteCurso
{
    public int IdEstudianteCurso { get; set; }
    public int IdEstudiante { get; set; }
    public int IdCurso { get; set; }
    public EstadoAsignacion Estado { get; set; }
    public DateTimeOffset FechaMatricula { get; set; }

    public Estudiante Estudiante { get; set; } = null!;
    public Curso Curso { get; set; } = null!;
}
