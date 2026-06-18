using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Extensions;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Enums;
using Comprendo.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Asignaciones;

public record UpdateAsignacionCommand(int Id, int IdCurso, int IdMateria) : IRequest<DocenteAsignacionDto>;

public class UpdateAsignacionCommandValidator : AbstractValidator<UpdateAsignacionCommand>
{
    public UpdateAsignacionCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.IdCurso).GreaterThan(0);
        RuleFor(x => x.IdMateria).GreaterThan(0);
    }
}

public class UpdateAsignacionCommandHandler : IRequestHandler<UpdateAsignacionCommand, DocenteAsignacionDto>
{
    private readonly IAsignacionRepository _repository;
    private readonly IAcademicoRepository _academicoRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateAsignacionCommandHandler(
        IAsignacionRepository repository,
        IAcademicoRepository academicoRepository,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _academicoRepository = academicoRepository;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<DocenteAsignacionDto> Handle(UpdateAsignacionCommand request, CancellationToken cancellationToken)
    {
        var docenteId = _currentUser.RequireDocenteId();
        var asignacion = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.DocenteCursoMateria), request.Id);

        if (asignacion.IdDocente != docenteId)
        {
            throw new ForbiddenException();
        }

        if (await _academicoRepository.GetCursoByIdAsync(request.IdCurso, cancellationToken) is null)
        {
            throw new NotFoundException(nameof(Domain.Entities.Curso), request.IdCurso);
        }

        if (await _academicoRepository.GetMateriaByIdAsync(request.IdMateria, cancellationToken) is null)
        {
            throw new NotFoundException(nameof(Domain.Entities.Materia), request.IdMateria);
        }

        if (asignacion.IdCurso != request.IdCurso || asignacion.IdMateria != request.IdMateria)
        {
            if (await _repository.ExistsAsync(docenteId, request.IdCurso, request.IdMateria, cancellationToken))
            {
                throw new Application.Common.Exceptions.ApplicationException("Ya tienes un curso activo con esa combinación.");
            }
        }

        asignacion.IdCurso = request.IdCurso;
        asignacion.IdMateria = request.IdMateria;
        await _repository.UpdateAsync(asignacion, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var list = await _repository.ListByDocenteAsync(docenteId, cancellationToken);
        var updated = list.First(x => x.IdDocenteCursoMateria == request.Id);
        return updated.ToDto();
    }
}
