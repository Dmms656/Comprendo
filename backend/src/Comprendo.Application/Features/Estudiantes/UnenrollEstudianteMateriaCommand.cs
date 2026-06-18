using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Extensions;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Domain.Enums;
using Comprendo.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Estudiantes;

public record UnenrollEstudianteMateriaCommand(int IdEstudiante, int IdDocenteCursoMateria) : IRequest<bool>;

public class UnenrollEstudianteMateriaCommandValidator : AbstractValidator<UnenrollEstudianteMateriaCommand>
{
    public UnenrollEstudianteMateriaCommandValidator()
    {
        RuleFor(x => x.IdEstudiante).GreaterThan(0);
        RuleFor(x => x.IdDocenteCursoMateria).GreaterThan(0);
    }
}

public class UnenrollEstudianteMateriaCommandHandler : IRequestHandler<UnenrollEstudianteMateriaCommand, bool>
{
    private readonly IEstudianteRepository _repository;
    private readonly IAsignacionRepository _asignacionRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public UnenrollEstudianteMateriaCommandHandler(
        IEstudianteRepository repository,
        IAsignacionRepository asignacionRepository,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _asignacionRepository = asignacionRepository;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(UnenrollEstudianteMateriaCommand request, CancellationToken cancellationToken)
    {
        var docenteId = _currentUser.RequireDocenteId();
        var asignacion = await _asignacionRepository.GetByIdAsync(request.IdDocenteCursoMateria, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.DocenteCursoMateria), request.IdDocenteCursoMateria);

        if (asignacion.IdDocente != docenteId)
        {
            throw new ForbiddenException();
        }

        var enrollment = await _repository.GetMateriaEnrollmentAsync(
            request.IdEstudiante,
            request.IdDocenteCursoMateria,
            cancellationToken)
            ?? throw new NotFoundException("La matrícula del estudiante en esta materia no existe.");

        enrollment.Estado = EstadoAsignacion.Inactivo;
        await _repository.UpdateMateriaEnrollmentAsync(enrollment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}
