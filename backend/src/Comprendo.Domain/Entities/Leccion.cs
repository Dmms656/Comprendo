using Comprendo.Domain.Enums;

namespace Comprendo.Domain.Entities;

public class Leccion
{
    public int IdLeccion { get; set; }
    public int IdDocenteCursoMateria { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Tema { get; set; }
    public int NumeroPreguntas { get; set; }
    public DateTimeOffset FechaCreacion { get; set; }
    public DateTimeOffset? FechaProgramada { get; set; }
    public EstadoLeccion Estado { get; set; }
    public bool CreadaConIa { get; set; }

    public DocenteCursoMateria DocenteCursoMateria { get; set; } = null!;
    public ICollection<Pregunta> Preguntas { get; set; } = [];
    public ICollection<EnvioTelegram> EnviosTelegram { get; set; } = [];
    public ICollection<ResultadoLeccion> ResultadosLeccion { get; set; } = [];
    public ICollection<SolicitudIa> SolicitudesIa { get; set; } = [];
}
