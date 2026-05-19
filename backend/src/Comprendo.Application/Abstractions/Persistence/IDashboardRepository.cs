using Comprendo.Domain.Entities;

namespace Comprendo.Application.Abstractions.Persistence;

public interface IDashboardRepository
{
    Task<DashboardResumen> GetResumenByDocenteAsync(int idDocente, CancellationToken cancellationToken = default);
}
