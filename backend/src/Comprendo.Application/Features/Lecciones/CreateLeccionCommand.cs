using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Extensions;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Comprendo.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Lecciones;

public record CreateLeccionCommand(
    int IdDocenteCursoMateria,
    string Titulo,
    string? Descripcion,
    string? Tema,
    DateTimeOffset? FechaProgramada,
    bool CreadaConIa = false) : IRequest<LeccionDto>;

public class CreateLeccionCommandValidator : AbstractValidator<CreateLeccionCommand>
{
    public CreateLeccionCommandValidator()
    {
        RuleFor(x => x.IdDocenteCursoMateria).GreaterThan(0);
        RuleFor(x => x.Titulo).NotEmpty().MaximumLength(150);
    }
}

public class CreateLeccionCommandHandler : IRequestHandler<CreateLeccionCommand, LeccionDto>
{
    private readonly ILeccionRepository _repository;
    private readonly IAsignacionRepository _asignacionRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTimeProvider _dateTime;
    private readonly IUnitOfWork _unitOfWork;

    public CreateLeccionCommandHandler(
        ILeccionRepository repository,
        IAsignacionRepository asignacionRepository,
        ICurrentUserService currentUser,
        IDateTimeProvider dateTime,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _asignacionRepository = asignacionRepository;
        _currentUser = currentUser;
        _dateTime = dateTime;
        _unitOfWork = unitOfWork;
    }

    public async Task<LeccionDto> Handle(CreateLeccionCommand request, CancellationToken cancellationToken)
    {
        var docenteId = _currentUser.RequireDocenteId();
        var asignacion = await _asignacionRepository.GetByIdAsync(request.IdDocenteCursoMateria, cancellationToken);

        if (asignacion is null || asignacion.IdDocente != docenteId)
        {
            throw new ForbiddenException("Assignment does not belong to the current docente.");
        }

        var entity = new Leccion
        {
            IdDocenteCursoMateria = request.IdDocenteCursoMateria,
            Titulo = request.Titulo,
            Descripcion = request.Descripcion,
            Tema = request.Tema,
            NumeroPreguntas = 0,
            FechaCreacion = _dateTime.UtcNow,
            FechaProgramada = request.FechaProgramada,
            Estado = EstadoLeccion.Borrador,
            CreadaConIa = request.CreadaConIa
        };

        var created = await _repository.CreateAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return created.ToDto();
    }
}
