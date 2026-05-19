using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Extensions;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Enums;
using Comprendo.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Lecciones;

public record ChangeLeccionEstadoCommand(int Id, string Estado) : IRequest<LeccionDto>;

public class ChangeLeccionEstadoCommandValidator : AbstractValidator<ChangeLeccionEstadoCommand>
{
    public ChangeLeccionEstadoCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.Estado).Must(e => Enum.TryParse<EstadoLeccion>(e, true, out _));
    }
}

public class ChangeLeccionEstadoCommandHandler : IRequestHandler<ChangeLeccionEstadoCommand, LeccionDto>
{
    private readonly ILeccionRepository _repository;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public ChangeLeccionEstadoCommandHandler(
        ILeccionRepository repository,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<LeccionDto> Handle(ChangeLeccionEstadoCommand request, CancellationToken cancellationToken)
    {
        var docenteId = _currentUser.RequireDocenteId();

        if (!await _repository.BelongsToDocenteAsync(request.Id, docenteId, cancellationToken))
        {
            throw new ForbiddenException();
        }

        var estado = Enum.Parse<EstadoLeccion>(request.Estado, true);
        await _repository.ChangeEstadoAsync(request.Id, estado, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var entity = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Leccion), request.Id);

        return entity.ToDto();
    }
}
