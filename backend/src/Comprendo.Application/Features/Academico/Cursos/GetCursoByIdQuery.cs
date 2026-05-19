using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Exceptions;
using MediatR;

namespace Comprendo.Application.Features.Academico.Cursos;

public record GetCursoByIdQuery(int Id) : IRequest<CursoDto>;

public class GetCursoByIdQueryHandler : IRequestHandler<GetCursoByIdQuery, CursoDto>
{
    private readonly IAcademicoRepository _repository;
    public GetCursoByIdQueryHandler(IAcademicoRepository repository) => _repository = repository;

    public async Task<CursoDto> Handle(GetCursoByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetCursoByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Curso), request.Id);
        return entity.ToDto();
    }
}
