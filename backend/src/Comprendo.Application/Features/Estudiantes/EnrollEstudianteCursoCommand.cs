using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Comprendo.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Estudiantes;

public record EnrollEstudianteCursoCommand(int IdEstudiante, int IdCurso) : IRequest<int>;

public class EnrollEstudianteCursoCommandValidator : AbstractValidator<EnrollEstudianteCursoCommand>
{
    public EnrollEstudianteCursoCommandValidator()
    {
        RuleFor(x => x.IdEstudiante).GreaterThan(0);
        RuleFor(x => x.IdCurso).GreaterThan(0);
    }
}

public class EnrollEstudianteCursoCommandHandler : IRequestHandler<EnrollEstudianteCursoCommand, int>
{
    private readonly IEstudianteRepository _repository;
    private readonly IAcademicoRepository _academicoRepository;
    private readonly IDateTimeProvider _dateTime;
    private readonly IUnitOfWork _unitOfWork;

    public EnrollEstudianteCursoCommandHandler(
        IEstudianteRepository repository,
        IAcademicoRepository academicoRepository,
        IDateTimeProvider dateTime,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _academicoRepository = academicoRepository;
        _dateTime = dateTime;
        _unitOfWork = unitOfWork;
    }

    public async Task<int> Handle(EnrollEstudianteCursoCommand request, CancellationToken cancellationToken)
    {
        if (await _repository.GetByIdAsync(request.IdEstudiante, cancellationToken) is null)
        {
            throw new NotFoundException(nameof(Estudiante), request.IdEstudiante);
        }

        if (await _academicoRepository.GetCursoByIdAsync(request.IdCurso, cancellationToken) is null)
        {
            throw new NotFoundException(nameof(Curso), request.IdCurso);
        }

        var enrollment = new EstudianteCurso
        {
            IdEstudiante = request.IdEstudiante,
            IdCurso = request.IdCurso,
            Estado = EstadoAsignacion.Activo,
            FechaMatricula = _dateTime.UtcNow
        };

        var created = await _repository.EnrollCursoAsync(enrollment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return created.IdEstudianteCurso;
    }
}
