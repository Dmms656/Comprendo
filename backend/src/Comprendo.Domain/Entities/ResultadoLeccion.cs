using Comprendo.Domain.Enums;

namespace Comprendo.Domain.Entities;

public class ResultadoLeccion
{
    public int IdResultado { get; set; }
    public int IdLeccion { get; set; }
    public int IdEstudiante { get; set; }
    public int TotalPreguntas { get; set; }
    public int PreguntasRespondidas { get; set; }
    public int RespuestasCorrectas { get; set; }
    public int RespuestasIncorrectas { get; set; }
    public decimal PuntajeTotal { get; set; }
    public decimal PuntajeObtenido { get; set; }
    public decimal Porcentaje { get; set; }
    public EstadoResultadoLeccion Estado { get; set; }
    public DateTimeOffset? FechaInicio { get; set; }
    public DateTimeOffset? FechaFinalizacion { get; set; }

    public Leccion Leccion { get; set; } = null!;
    public Estudiante Estudiante { get; set; } = null!;
}
