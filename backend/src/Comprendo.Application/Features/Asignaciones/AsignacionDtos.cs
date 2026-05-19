namespace Comprendo.Application.Features.Asignaciones;

public record DocenteAsignacionDto(
    int IdDocenteCursoMateria,
    int IdCurso,
    int IdAnioLectivo,
    string AnioLectivo,
    int IdNivel,
    string Nivel,
    int IdParalelo,
    string Paralelo,
    int IdMateria,
    string Materia,
    string Estado);
