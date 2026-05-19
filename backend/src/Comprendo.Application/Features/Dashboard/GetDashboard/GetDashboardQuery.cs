using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Extensions;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using MediatR;

namespace Comprendo.Application.Features.Dashboard.GetDashboard;

public record GetDashboardQuery : IRequest<DashboardDto>;

public class GetDashboardQueryHandler : IRequestHandler<GetDashboardQuery, DashboardDto>
{
    private readonly IDashboardRepository _dashboardRepository;
    private readonly ICurrentUserService _currentUser;

    public GetDashboardQueryHandler(
        IDashboardRepository dashboardRepository,
        ICurrentUserService currentUser)
    {
        _dashboardRepository = dashboardRepository;
        _currentUser = currentUser;
    }

    public async Task<DashboardDto> Handle(GetDashboardQuery request, CancellationToken cancellationToken)
    {
        var docenteId = _currentUser.RequireDocenteId();
        var resumen = await _dashboardRepository.GetResumenByDocenteAsync(docenteId, cancellationToken);
        return resumen.ToDto();
    }
}
