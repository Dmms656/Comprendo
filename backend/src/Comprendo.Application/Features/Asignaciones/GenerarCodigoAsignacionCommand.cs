using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Extensions;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Domain.Exceptions;
using MediatR;

namespace Comprendo.Application.Features.Asignaciones;

public record GenerarCodigoAsignacionCommand(int IdDocenteCursoMateria) : IRequest<string>;

public class GenerarCodigoAsignacionCommandHandler : IRequestHandler<GenerarCodigoAsignacionCommand, string>
{
    private readonly IAsignacionRepository _repository;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public GenerarCodigoAsignacionCommandHandler(
        IAsignacionRepository repository,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<string> Handle(GenerarCodigoAsignacionCommand request, CancellationToken cancellationToken)
    {
        var docenteId = _currentUser.RequireDocenteId();
        var asignacion = await _repository.GetByIdAsync(request.IdDocenteCursoMateria, cancellationToken);

        if (asignacion is null)
        {
            throw new NotFoundException(nameof(Domain.Entities.DocenteCursoMateria), request.IdDocenteCursoMateria);
        }

        if (asignacion.IdDocente != docenteId)
        {
            throw new ForbiddenException("No tienes permiso para acceder a esta asignatura.");
        }

        if (!string.IsNullOrWhiteSpace(asignacion.CodigoAcceso))
        {
            return asignacion.CodigoAcceso;
        }

        asignacion.CodigoAcceso = await CodigoAccesoGenerator.GenerateUniqueAsync(_repository, cancellationToken);
        await _repository.UpdateAsync(asignacion, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return asignacion.CodigoAcceso;
    }
}
