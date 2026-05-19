using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Exceptions;
using MediatR;

namespace Comprendo.Application.Features.Academico.Materias;

public record GetMateriaByIdQuery(int Id) : IRequest<MateriaDto>;

public class GetMateriaByIdQueryHandler : IRequestHandler<GetMateriaByIdQuery, MateriaDto>
{
    private readonly IAcademicoRepository _repository;
    public GetMateriaByIdQueryHandler(IAcademicoRepository repository) => _repository = repository;

    public async Task<MateriaDto> Handle(GetMateriaByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetMateriaByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Materia), request.Id);
        return entity.ToDto();
    }
}
