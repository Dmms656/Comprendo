using Comprendo.Domain.Enums;

namespace Comprendo.Domain.Entities;

public class Pregunta
{
    public int IdPregunta { get; set; }
    public int IdLeccion { get; set; }
    public string Enunciado { get; set; } = string.Empty;
    public TipoPregunta TipoPregunta { get; set; }
    public string? RespuestaCorrecta { get; set; }
    public string? Explicacion { get; set; }
    public decimal Puntaje { get; set; }
    public int Orden { get; set; }
    public bool GeneradaPorIa { get; set; }
    public int? IdSolicitudIa { get; set; }
    public EstadoPregunta Estado { get; set; }

    public Leccion Leccion { get; set; } = null!;
    public SolicitudIa? SolicitudIa { get; set; }
    public ICollection<OpcionPregunta> OpcionesPregunta { get; set; } = [];
    public ICollection<EnvioTelegram> EnviosTelegram { get; set; } = [];
    public ICollection<RespuestaEstudiante> RespuestasEstudiante { get; set; } = [];
}
