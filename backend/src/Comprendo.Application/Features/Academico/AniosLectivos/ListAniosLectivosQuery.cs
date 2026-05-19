using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Mappings;
using Comprendo.Application.Common.Models;
using MediatR;

namespace Comprendo.Application.Features.Academico.AniosLectivos;

public record ListAniosLectivosQuery(int PageNumber = 1, int PageSize = 20)
    : IRequest<PaginatedList<AnioLectivoDto>>;

public class ListAniosLectivosQueryHandler : IRequestHandler<ListAniosLectivosQuery, PaginatedList<AnioLectivoDto>>
{
    private readonly IAcademicoRepository _repository;

    public ListAniosLectivosQueryHandler(IAcademicoRepository repository) => _repository = repository;

    public async Task<PaginatedList<AnioLectivoDto>> Handle(
        ListAniosLectivosQuery request,
        CancellationToken cancellationToken)
    {
        var page = await _repository.ListAniosLectivosAsync(request.PageNumber, request.PageSize, cancellationToken);
        var items = page.Items.Select(x => x.ToDto()).ToList();
        return new PaginatedList<AnioLectivoDto>(items, page.TotalCount, page.PageNumber, page.PageSize);
    }
}
