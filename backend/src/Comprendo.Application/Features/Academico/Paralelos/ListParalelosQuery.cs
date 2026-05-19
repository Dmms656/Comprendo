using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Mappings;
using Comprendo.Application.Common.Models;
using MediatR;

namespace Comprendo.Application.Features.Academico.Paralelos;

public record ListParalelosQuery(int PageNumber = 1, int PageSize = 20)
    : IRequest<PaginatedList<ParaleloDto>>;

public class ListParalelosQueryHandler : IRequestHandler<ListParalelosQuery, PaginatedList<ParaleloDto>>
{
    private readonly IAcademicoRepository _repository;
    public ListParalelosQueryHandler(IAcademicoRepository repository) => _repository = repository;

    public async Task<PaginatedList<ParaleloDto>> Handle(ListParalelosQuery request, CancellationToken cancellationToken)
    {
        var page = await _repository.ListParalelosAsync(request.PageNumber, request.PageSize, cancellationToken);
        var items = page.Items.Select(x => x.ToDto()).ToList();
        return new PaginatedList<ParaleloDto>(items, page.TotalCount, page.PageNumber, page.PageSize);
    }
}
