using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Mappings;
using Comprendo.Application.Common.Models;
using MediatR;

namespace Comprendo.Application.Features.Academico.Niveles;

public record ListNivelesQuery(int PageNumber = 1, int PageSize = 20)
    : IRequest<PaginatedList<NivelDto>>;

public class ListNivelesQueryHandler : IRequestHandler<ListNivelesQuery, PaginatedList<NivelDto>>
{
    private readonly IAcademicoRepository _repository;
    public ListNivelesQueryHandler(IAcademicoRepository repository) => _repository = repository;

    public async Task<PaginatedList<NivelDto>> Handle(ListNivelesQuery request, CancellationToken cancellationToken)
    {
        var page = await _repository.ListNivelesAsync(request.PageNumber, request.PageSize, cancellationToken);
        var items = page.Items.Select(x => x.ToDto()).ToList();
        return new PaginatedList<NivelDto>(items, page.TotalCount, page.PageNumber, page.PageSize);
    }
}
