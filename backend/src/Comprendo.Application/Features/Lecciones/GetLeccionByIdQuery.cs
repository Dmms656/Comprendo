using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Extensions;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Exceptions;
using MediatR;

namespace Comprendo.Application.Features.Lecciones;

public record GetLeccionByIdQuery(int Id) : IRequest<LeccionDto>;

public class GetLeccionByIdQueryHandler : IRequestHandler<GetLeccionByIdQuery, LeccionDto>
{
    private readonly ILeccionRepository _repository;
    private readonly ICurrentUserService _currentUser;

    public GetLeccionByIdQueryHandler(ILeccionRepository repository, ICurrentUserService currentUser)
    {
        _repository = repository;
        _currentUser = currentUser;
    }

    public async Task<LeccionDto> Handle(GetLeccionByIdQuery request, CancellationToken cancellationToken)
    {
        var docenteId = _currentUser.RequireDocenteId();

        if (!await _repository.BelongsToDocenteAsync(request.Id, docenteId, cancellationToken))
        {
            throw new NotFoundException(nameof(Domain.Entities.Leccion), request.Id);
        }

        var entity = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Leccion), request.Id);

        return entity.ToDto();
    }
}
