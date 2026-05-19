namespace Comprendo.Application.Features.Academico.AniosLectivos;

public record AnioLectivoDto(
    int IdAnioLectivo,
    string Nombre,
    DateOnly FechaInicio,
    DateOnly FechaFin,
    string Estado);
