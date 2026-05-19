using Comprendo.Domain.Enums;

namespace Comprendo.Domain.Entities;

public class Curso
{
    public int IdCurso { get; set; }
    public int IdAnioLectivo { get; set; }
    public int IdNivel { get; set; }
    public int IdParalelo { get; set; }
    public EstadoCurso Estado { get; set; }

    public AnioLectivo AnioLectivo { get; set; } = null!;
    public Nivel Nivel { get; set; } = null!;
    public Paralelo Paralelo { get; set; } = null!;
    public ICollection<DocenteCursoMateria> DocenteCursoMaterias { get; set; } = [];
    public ICollection<EstudianteCurso> EstudianteCursos { get; set; } = [];
}
