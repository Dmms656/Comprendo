using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Mappings;
using Comprendo.Application.Common.Models;
using MediatR;

namespace Comprendo.Application.Features.Estudiantes;

public record ListEstudiantesQuery(int PageNumber = 1, int PageSize = 20)
    : IRequest<PaginatedList<EstudianteDto>>;

public class ListEstudiantesQueryHandler : IRequestHandler<ListEstudiantesQuery, PaginatedList<EstudianteDto>>
{
    private readonly IEstudianteRepository _repository;

    public ListEstudiantesQueryHandler(IEstudianteRepository repository) => _repository = repository;

    public async Task<PaginatedList<EstudianteDto>> Handle(
        ListEstudiantesQuery request,
        CancellationToken cancellationToken)
    {
        var page = await _repository.ListAsync(request.PageNumber, request.PageSize, cancellationToken);
        var items = page.Items.Select(x => x.ToDto()).ToList();
        return new PaginatedList<EstudianteDto>(items, page.TotalCount, page.PageNumber, page.PageSize);
    }
}
