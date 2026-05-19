using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Extensions;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Comprendo.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Asignaciones;

public record CreateAsignacionCommand(int IdCurso, int IdMateria) : IRequest<DocenteAsignacionDto>;

public class CreateAsignacionCommandValidator : AbstractValidator<CreateAsignacionCommand>
{
    public CreateAsignacionCommandValidator()
    {
        RuleFor(x => x.IdCurso).GreaterThan(0);
        RuleFor(x => x.IdMateria).GreaterThan(0);
    }
}

public class CreateAsignacionCommandHandler : IRequestHandler<CreateAsignacionCommand, DocenteAsignacionDto>
{
    private readonly IAsignacionRepository _repository;
    private readonly IAcademicoRepository _academicoRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTimeProvider _dateTime;
    private readonly IUnitOfWork _unitOfWork;

    public CreateAsignacionCommandHandler(
        IAsignacionRepository repository,
        IAcademicoRepository academicoRepository,
        ICurrentUserService currentUser,
        IDateTimeProvider dateTime,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _academicoRepository = academicoRepository;
        _currentUser = currentUser;
        _dateTime = dateTime;
        _unitOfWork = unitOfWork;
    }

    public async Task<DocenteAsignacionDto> Handle(
        CreateAsignacionCommand request,
        CancellationToken cancellationToken)
    {
        var docenteId = _currentUser.RequireDocenteId();

        if (await _academicoRepository.GetCursoByIdAsync(request.IdCurso, cancellationToken) is null)
        {
            throw new NotFoundException(nameof(Domain.Entities.Curso), request.IdCurso);
        }

        if (await _academicoRepository.GetMateriaByIdAsync(request.IdMateria, cancellationToken) is null)
        {
            throw new NotFoundException(nameof(Domain.Entities.Materia), request.IdMateria);
        }

        if (await _repository.ExistsAsync(docenteId, request.IdCurso, request.IdMateria, cancellationToken))
        {
            throw new Application.Common.Exceptions.ApplicationException("Assignment already exists.");
        }

        var entity = new DocenteCursoMateria
        {
            IdDocente = docenteId,
            IdCurso = request.IdCurso,
            IdMateria = request.IdMateria,
            Estado = EstadoAsignacion.Activo,
            FechaAsignacion = _dateTime.UtcNow
        };

        await _repository.CreateAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var list = await _repository.ListByDocenteAsync(docenteId, cancellationToken);
        var created = list.First(x =>
            x.IdCurso == request.IdCurso && x.IdMateria == request.IdMateria);

        return created.ToDto();
    }
}
