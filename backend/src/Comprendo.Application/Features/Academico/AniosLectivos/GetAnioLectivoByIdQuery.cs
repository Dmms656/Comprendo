using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Exceptions;
using MediatR;

namespace Comprendo.Application.Features.Academico.AniosLectivos;

public record GetAnioLectivoByIdQuery(int Id) : IRequest<AnioLectivoDto>;

public class GetAnioLectivoByIdQueryHandler : IRequestHandler<GetAnioLectivoByIdQuery, AnioLectivoDto>
{
    private readonly IAcademicoRepository _repository;

    public GetAnioLectivoByIdQueryHandler(IAcademicoRepository repository) => _repository = repository;

    public async Task<AnioLectivoDto> Handle(GetAnioLectivoByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetAnioLectivoByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.AnioLectivo), request.Id);
        return entity.ToDto();
    }
}
