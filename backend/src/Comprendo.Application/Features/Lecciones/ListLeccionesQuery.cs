using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Extensions;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Application.Common.Models;
using MediatR;

namespace Comprendo.Application.Features.Lecciones;

public record ListLeccionesQuery(int PageNumber = 1, int PageSize = 20)
    : IRequest<PaginatedList<LeccionDto>>;

public class ListLeccionesQueryHandler : IRequestHandler<ListLeccionesQuery, PaginatedList<LeccionDto>>
{
    private readonly ILeccionRepository _repository;
    private readonly ICurrentUserService _currentUser;

    public ListLeccionesQueryHandler(ILeccionRepository repository, ICurrentUserService currentUser)
    {
        _repository = repository;
        _currentUser = currentUser;
    }

    public async Task<PaginatedList<LeccionDto>> Handle(
        ListLeccionesQuery request,
        CancellationToken cancellationToken)
    {
        var docenteId = _currentUser.RequireDocenteId();
        var page = await _repository.ListByDocenteAsync(
            docenteId, request.PageNumber, request.PageSize, cancellationToken);
        var items = page.Items.Select(x => x.ToDto()).ToList();
        return new PaginatedList<LeccionDto>(items, page.TotalCount, page.PageNumber, page.PageSize);
    }
}
