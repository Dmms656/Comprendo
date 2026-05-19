namespace Comprendo.Application.Features.Lecciones;

public record LeccionDto(
    int IdLeccion,
    int IdDocenteCursoMateria,
    string Titulo,
    string? Descripcion,
    string? Tema,
    int NumeroPreguntas,
    DateTimeOffset FechaCreacion,
    DateTimeOffset? FechaProgramada,
    string Estado,
    bool CreadaConIa);
