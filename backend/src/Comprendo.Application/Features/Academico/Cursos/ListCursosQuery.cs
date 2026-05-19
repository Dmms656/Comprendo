using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Mappings;
using Comprendo.Application.Common.Models;
using MediatR;

namespace Comprendo.Application.Features.Academico.Cursos;

public record ListCursosQuery(int PageNumber = 1, int PageSize = 20)
    : IRequest<PaginatedList<CursoDto>>;

public class ListCursosQueryHandler : IRequestHandler<ListCursosQuery, PaginatedList<CursoDto>>
{
    private readonly IAcademicoRepository _repository;
    public ListCursosQueryHandler(IAcademicoRepository repository) => _repository = repository;

    public async Task<PaginatedList<CursoDto>> Handle(ListCursosQuery request, CancellationToken cancellationToken)
    {
        var page = await _repository.ListCursosAsync(request.PageNumber, request.PageSize, cancellationToken);
        var items = page.Items.Select(x => x.ToDto()).ToList();
        return new PaginatedList<CursoDto>(items, page.TotalCount, page.PageNumber, page.PageSize);
    }
}
