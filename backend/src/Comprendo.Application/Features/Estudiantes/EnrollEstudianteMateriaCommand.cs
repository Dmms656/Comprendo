using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Comprendo.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Estudiantes;

public record EnrollEstudianteMateriaCommand(int IdEstudiante, int IdDocenteCursoMateria) : IRequest<int>;

public class EnrollEstudianteMateriaCommandValidator : AbstractValidator<EnrollEstudianteMateriaCommand>
{
    public EnrollEstudianteMateriaCommandValidator()
    {
        RuleFor(x => x.IdEstudiante).GreaterThan(0);
        RuleFor(x => x.IdDocenteCursoMateria).GreaterThan(0);
    }
}

public class EnrollEstudianteMateriaCommandHandler : IRequestHandler<EnrollEstudianteMateriaCommand, int>
{
    private readonly IEstudianteRepository _repository;
    private readonly IAsignacionRepository _asignacionRepository;
    private readonly IDateTimeProvider _dateTime;
    private readonly IUnitOfWork _unitOfWork;

    public EnrollEstudianteMateriaCommandHandler(
        IEstudianteRepository repository,
        IAsignacionRepository asignacionRepository,
        IDateTimeProvider dateTime,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _asignacionRepository = asignacionRepository;
        _dateTime = dateTime;
        _unitOfWork = unitOfWork;
    }

    public async Task<int> Handle(EnrollEstudianteMateriaCommand request, CancellationToken cancellationToken)
    {
        if (await _repository.GetByIdAsync(request.IdEstudiante, cancellationToken) is null)
        {
            throw new NotFoundException(nameof(Estudiante), request.IdEstudiante);
        }

        if (await _asignacionRepository.GetByIdAsync(request.IdDocenteCursoMateria, cancellationToken) is null)
        {
            throw new NotFoundException(nameof(DocenteCursoMateria), request.IdDocenteCursoMateria);
        }

        var enrollment = new EstudianteMateria
        {
            IdEstudiante = request.IdEstudiante,
            IdDocenteCursoMateria = request.IdDocenteCursoMateria,
            Estado = EstadoAsignacion.Activo,
            FechaRegistro = _dateTime.UtcNow
        };

        var created = await _repository.EnrollMateriaAsync(enrollment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return created.IdEstudianteMateria;
    }
}
