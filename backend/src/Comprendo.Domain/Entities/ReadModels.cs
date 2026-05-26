using Comprendo.Domain.Enums;

namespace Comprendo.Domain.Entities;

public class DocenteAsignacionDetalle
{
    public int IdDocente { get; set; }
    public int IdDocenteCursoMateria { get; set; }
    public int IdAnioLectivo { get; set; }
    public string AnioLectivo { get; set; } = string.Empty;
    public int IdNivel { get; set; }
    public string Nivel { get; set; } = string.Empty;
    public int IdParalelo { get; set; }
    public string Paralelo { get; set; } = string.Empty;
    public int IdMateria { get; set; }
    public string Materia { get; set; } = string.Empty;
    public int IdCurso { get; set; }
    public EstadoAsignacion Estado { get; set; }
    public string? CodigoAcceso { get; set; }
}

public class DashboardResumen
{
    public int TotalLecciones { get; set; }
    public int LeccionesActivas { get; set; }
    public int TotalEstudiantes { get; set; }
    public int TotalAsignaciones { get; set; }
    public int PreguntasPendientesEnvio { get; set; }
}

public class ResultadoLeccionDetalle
{
    public int IdResultado { get; set; }
    public int IdLeccion { get; set; }
    public string LeccionTitulo { get; set; } = string.Empty;
    public int IdEstudiante { get; set; }
    public string? Nombres { get; set; }
    public string? Apellidos { get; set; }
    public int TotalPreguntas { get; set; }
    public int PreguntasRespondidas { get; set; }
    public int RespuestasCorrectas { get; set; }
    public int RespuestasIncorrectas { get; set; }
    public decimal PuntajeObtenido { get; set; }
    public decimal PuntajeTotal { get; set; }
    public decimal Porcentaje { get; set; }
    public EstadoResultadoLeccion Estado { get; set; }
    public DateTimeOffset? FechaInicio { get; set; }
    public DateTimeOffset? FechaFinalizacion { get; set; }
    public List<RespuestaEstudiante> Respuestas { get; set; } = [];
}
