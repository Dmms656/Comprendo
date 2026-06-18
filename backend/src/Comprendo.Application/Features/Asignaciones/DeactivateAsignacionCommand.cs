using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Extensions;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Enums;
using Comprendo.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Asignaciones;

public record DeactivateAsignacionCommand(int Id) : IRequest<DeactivateAsignacionResult>;

public record DeactivateAsignacionResult(int IdDocenteCursoMateria, string Estado);

public class DeactivateAsignacionCommandValidator : AbstractValidator<DeactivateAsignacionCommand>
{
    public DeactivateAsignacionCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
    }
}

public class DeactivateAsignacionCommandHandler : IRequestHandler<DeactivateAsignacionCommand, DeactivateAsignacionResult>
{
    private readonly IAsignacionRepository _repository;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public DeactivateAsignacionCommandHandler(
        IAsignacionRepository repository,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<DeactivateAsignacionResult> Handle(DeactivateAsignacionCommand request, CancellationToken cancellationToken)
    {
        var docenteId = _currentUser.RequireDocenteId();
        var asignacion = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.DocenteCursoMateria), request.Id);

        if (asignacion.IdDocente != docenteId)
        {
            throw new ForbiddenException();
        }

        asignacion.Estado = EstadoAsignacion.Inactivo;
        asignacion.CodigoAcceso = null;
        await _repository.UpdateAsync(asignacion, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new DeactivateAsignacionResult(
            asignacion.IdDocenteCursoMateria,
            EstadoAsignacion.Inactivo.ToString().ToUpperInvariant());
    }
}
