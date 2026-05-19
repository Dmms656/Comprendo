using Comprendo.Domain.Enums;

namespace Comprendo.Domain.Entities;

public class DocenteCursoMateria
{
    public int IdDocenteCursoMateria { get; set; }
    public int IdDocente { get; set; }
    public int IdCurso { get; set; }
    public int IdMateria { get; set; }
    public EstadoAsignacion Estado { get; set; }
    public DateTimeOffset FechaAsignacion { get; set; }

    public Docente Docente { get; set; } = null!;
    public Curso Curso { get; set; } = null!;
    public Materia Materia { get; set; } = null!;
    public ICollection<EstudianteMateria> EstudianteMaterias { get; set; } = [];
    public ICollection<Leccion> Lecciones { get; set; } = [];
}
