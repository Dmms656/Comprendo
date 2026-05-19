using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Extensions;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Exceptions;
using MediatR;

namespace Comprendo.Application.Features.Preguntas;

public record ListPreguntasByLeccionQuery(int IdLeccion) : IRequest<IReadOnlyList<PreguntaDto>>;

public class ListPreguntasByLeccionQueryHandler
    : IRequestHandler<ListPreguntasByLeccionQuery, IReadOnlyList<PreguntaDto>>
{
    private readonly IPreguntaRepository _preguntaRepository;
    private readonly ILeccionRepository _leccionRepository;
    private readonly ICurrentUserService _currentUser;

    public ListPreguntasByLeccionQueryHandler(
        IPreguntaRepository preguntaRepository,
        ILeccionRepository leccionRepository,
        ICurrentUserService currentUser)
    {
        _preguntaRepository = preguntaRepository;
        _leccionRepository = leccionRepository;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<PreguntaDto>> Handle(
        ListPreguntasByLeccionQuery request,
        CancellationToken cancellationToken)
    {
        var docenteId = _currentUser.RequireDocenteId();

        if (!await _leccionRepository.BelongsToDocenteAsync(request.IdLeccion, docenteId, cancellationToken))
        {
            throw new ForbiddenException();
        }

        var items = await _preguntaRepository.ListByLeccionAsync(request.IdLeccion, cancellationToken);
        return items.Select(x => x.ToDto()).ToList();
    }
}
