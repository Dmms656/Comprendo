using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Academico.AniosLectivos;

public record CreateAnioLectivoCommand(
    string Nombre,
    DateOnly FechaInicio,
    DateOnly FechaFin,
    string Estado) : IRequest<AnioLectivoDto>;

public class CreateAnioLectivoCommandValidator : AbstractValidator<CreateAnioLectivoCommand>
{
    public CreateAnioLectivoCommandValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(20);
        RuleFor(x => x.FechaFin).GreaterThan(x => x.FechaInicio);
        RuleFor(x => x.Estado).Must(BeValidEstado);
    }

    private static bool BeValidEstado(string estado) =>
        Enum.TryParse<EstadoAnioLectivo>(estado, true, out _);
}

public class CreateAnioLectivoCommandHandler : IRequestHandler<CreateAnioLectivoCommand, AnioLectivoDto>
{
    private readonly IAcademicoRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateAnioLectivoCommandHandler(IAcademicoRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<AnioLectivoDto> Handle(CreateAnioLectivoCommand request, CancellationToken cancellationToken)
    {
        var entity = new AnioLectivo
        {
            Nombre = request.Nombre,
            FechaInicio = request.FechaInicio,
            FechaFin = request.FechaFin,
            Estado = Enum.Parse<EstadoAnioLectivo>(request.Estado, true)
        };

        var created = await _repository.CreateAnioLectivoAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return created.ToDto();
    }
}
