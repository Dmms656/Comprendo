using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Exceptions;
using MediatR;

namespace Comprendo.Application.Features.Estudiantes;

public record GetEstudianteByIdQuery(int Id) : IRequest<EstudianteDto>;

public class GetEstudianteByIdQueryHandler : IRequestHandler<GetEstudianteByIdQuery, EstudianteDto>
{
    private readonly IEstudianteRepository _repository;

    public GetEstudianteByIdQueryHandler(IEstudianteRepository repository) => _repository = repository;

    public async Task<EstudianteDto> Handle(GetEstudianteByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Estudiante), request.Id);
        return entity.ToDto();
    }
}
