namespace Comprendo.Domain.Entities;

public class OpcionPregunta
{
    public int IdOpcion { get; set; }
    public int IdPregunta { get; set; }
    public string Literal { get; set; } = string.Empty;
    public string Texto { get; set; } = string.Empty;
    public bool EsCorrecta { get; set; }

    public Pregunta Pregunta { get; set; } = null!;
}
