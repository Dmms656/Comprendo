using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Exceptions;
using MediatR;

namespace Comprendo.Application.Features.Academico.Paralelos;

public record GetParaleloByIdQuery(int Id) : IRequest<ParaleloDto>;

public class GetParaleloByIdQueryHandler : IRequestHandler<GetParaleloByIdQuery, ParaleloDto>
{
    private readonly IAcademicoRepository _repository;
    public GetParaleloByIdQueryHandler(IAcademicoRepository repository) => _repository = repository;

    public async Task<ParaleloDto> Handle(GetParaleloByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetParaleloByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Paralelo), request.Id);
        return entity.ToDto();
    }
}
