using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Mappings;
using Comprendo.Application.Common.Models;
using MediatR;

namespace Comprendo.Application.Features.Academico.Materias;

public record ListMateriasQuery(int PageNumber = 1, int PageSize = 20)
    : IRequest<PaginatedList<MateriaDto>>;

public class ListMateriasQueryHandler : IRequestHandler<ListMateriasQuery, PaginatedList<MateriaDto>>
{
    private readonly IAcademicoRepository _repository;
    public ListMateriasQueryHandler(IAcademicoRepository repository) => _repository = repository;

    public async Task<PaginatedList<MateriaDto>> Handle(ListMateriasQuery request, CancellationToken cancellationToken)
    {
        var page = await _repository.ListMateriasAsync(request.PageNumber, request.PageSize, cancellationToken);
        var items = page.Items.Select(x => x.ToDto()).ToList();
        return new PaginatedList<MateriaDto>(items, page.TotalCount, page.PageNumber, page.PageSize);
    }
}
