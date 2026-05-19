using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Extensions;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Lecciones;

public record UpdateLeccionCommand(
    int Id,
    string Titulo,
    string? Descripcion,
    string? Tema,
    DateTimeOffset? FechaProgramada) : IRequest<LeccionDto>;

public class UpdateLeccionCommandValidator : AbstractValidator<UpdateLeccionCommand>
{
    public UpdateLeccionCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.Titulo).NotEmpty().MaximumLength(150);
    }
}

public class UpdateLeccionCommandHandler : IRequestHandler<UpdateLeccionCommand, LeccionDto>
{
    private readonly ILeccionRepository _repository;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateLeccionCommandHandler(
        ILeccionRepository repository,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<LeccionDto> Handle(UpdateLeccionCommand request, CancellationToken cancellationToken)
    {
        var docenteId = _currentUser.RequireDocenteId();

        if (!await _repository.BelongsToDocenteAsync(request.Id, docenteId, cancellationToken))
        {
            throw new ForbiddenException();
        }

        var entity = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Leccion), request.Id);

        entity.Titulo = request.Titulo;
        entity.Descripcion = request.Descripcion;
        entity.Tema = request.Tema;
        entity.FechaProgramada = request.FechaProgramada;

        await _repository.UpdateAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return entity.ToDto();
    }
}
