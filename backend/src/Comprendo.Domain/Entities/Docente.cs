using Comprendo.Domain.Enums;

namespace Comprendo.Domain.Entities;

public class Docente
{
    public int IdDocente { get; set; }
    public int IdUsuario { get; set; }
    public string? TituloProfesional { get; set; }
    public string? Especialidad { get; set; }
    public EstadoDocente Estado { get; set; }

    public Usuario Usuario { get; set; } = null!;
    public ICollection<DocenteCursoMateria> DocenteCursoMaterias { get; set; } = [];
    public ICollection<SolicitudIa> SolicitudesIa { get; set; } = [];
}
