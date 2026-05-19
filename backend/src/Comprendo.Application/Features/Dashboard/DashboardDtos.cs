namespace Comprendo.Application.Features.Dashboard;

public record DashboardDto(
    int TotalLecciones,
    int LeccionesActivas,
    int TotalEstudiantes,
    int TotalAsignaciones,
    int PreguntasPendientesEnvio);
