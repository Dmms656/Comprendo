using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Extensions;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Exceptions;
using MediatR;

namespace Comprendo.Application.Features.Resultados;

public record GetResultadosByLeccionQuery(int IdLeccion) : IRequest<IReadOnlyList<ResultadoLeccionDto>>;

public class GetResultadosByLeccionQueryHandler
    : IRequestHandler<GetResultadosByLeccionQuery, IReadOnlyList<ResultadoLeccionDto>>
{
    private readonly IResultadoRepository _repository;
    private readonly ICurrentUserService _currentUser;

    public GetResultadosByLeccionQueryHandler(
        IResultadoRepository repository,
        ICurrentUserService currentUser)
    {
        _repository = repository;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<ResultadoLeccionDto>> Handle(
        GetResultadosByLeccionQuery request,
        CancellationToken cancellationToken)
    {
        var docenteId = _currentUser.RequireDocenteId();

        if (!await _repository.LeccionBelongsToDocenteAsync(request.IdLeccion, docenteId, cancellationToken))
        {
            throw new ForbiddenException();
        }

        var items = await _repository.GetByLeccionAsync(request.IdLeccion, cancellationToken);
        return items.Select(x => x.ToDto()).ToList();
    }
}
