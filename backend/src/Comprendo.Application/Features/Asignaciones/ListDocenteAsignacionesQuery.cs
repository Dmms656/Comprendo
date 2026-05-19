using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Extensions;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using MediatR;

namespace Comprendo.Application.Features.Asignaciones;

public record ListDocenteAsignacionesQuery : IRequest<IReadOnlyList<DocenteAsignacionDto>>;

public class ListDocenteAsignacionesQueryHandler
    : IRequestHandler<ListDocenteAsignacionesQuery, IReadOnlyList<DocenteAsignacionDto>>
{
    private readonly IAsignacionRepository _repository;
    private readonly ICurrentUserService _currentUser;

    public ListDocenteAsignacionesQueryHandler(
        IAsignacionRepository repository,
        ICurrentUserService currentUser)
    {
        _repository = repository;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<DocenteAsignacionDto>> Handle(
        ListDocenteAsignacionesQuery request,
        CancellationToken cancellationToken)
    {
        var docenteId = _currentUser.RequireDocenteId();
        var items = await _repository.ListByDocenteAsync(docenteId, cancellationToken);
        return items.Select(x => x.ToDto()).ToList();
    }
}
