using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Enums;
using Comprendo.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Academico.AniosLectivos;

public record UpdateAnioLectivoCommand(
    int Id,
    string Nombre,
    DateOnly FechaInicio,
    DateOnly FechaFin,
    string Estado) : IRequest<AnioLectivoDto>;

public class UpdateAnioLectivoCommandValidator : AbstractValidator<UpdateAnioLectivoCommand>
{
    public UpdateAnioLectivoCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(20);
        RuleFor(x => x.FechaFin).GreaterThan(x => x.FechaInicio);
        RuleFor(x => x.Estado).Must(e => Enum.TryParse<EstadoAnioLectivo>(e, true, out _));
    }
}

public class UpdateAnioLectivoCommandHandler : IRequestHandler<UpdateAnioLectivoCommand, AnioLectivoDto>
{
    private readonly IAcademicoRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateAnioLectivoCommandHandler(IAcademicoRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<AnioLectivoDto> Handle(UpdateAnioLectivoCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetAnioLectivoByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.AnioLectivo), request.Id);

        entity.Nombre = request.Nombre;
        entity.FechaInicio = request.FechaInicio;
        entity.FechaFin = request.FechaFin;
        entity.Estado = Enum.Parse<EstadoAnioLectivo>(request.Estado, true);

        await _repository.UpdateAnioLectivoAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return entity.ToDto();
    }
}
