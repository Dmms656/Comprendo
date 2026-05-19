using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Exceptions;
using MediatR;

namespace Comprendo.Application.Features.Academico.Niveles;

public record GetNivelByIdQuery(int Id) : IRequest<NivelDto>;

public class GetNivelByIdQueryHandler : IRequestHandler<GetNivelByIdQuery, NivelDto>
{
    private readonly IAcademicoRepository _repository;
    public GetNivelByIdQueryHandler(IAcademicoRepository repository) => _repository = repository;

    public async Task<NivelDto> Handle(GetNivelByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetNivelByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Nivel), request.Id);
        return entity.ToDto();
    }
}
