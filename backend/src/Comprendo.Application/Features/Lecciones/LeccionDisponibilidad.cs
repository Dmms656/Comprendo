using Comprendo.Domain.Entities;
using FluentValidation.Results;

namespace Comprendo.Application.Features.Lecciones;

internal static class LeccionDisponibilidad
{
    public static ValidationFailure? ValidarVentana(Leccion leccion, DateTimeOffset ahora)
    {
        if (leccion.FechaDisponibleDesde is not null && ahora < leccion.FechaDisponibleDesde.Value)
        {
            return new ValidationFailure("Tiempo", "La evaluación aún no está disponible.");
        }

        if (leccion.FechaDisponibleHasta is not null && ahora > leccion.FechaDisponibleHasta.Value)
        {
            return new ValidationFailure("Tiempo", "El período de la evaluación ha finalizado.");
        }

        return null;
    }
}
