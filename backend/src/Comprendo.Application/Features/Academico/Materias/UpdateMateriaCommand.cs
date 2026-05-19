using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Enums;
using Comprendo.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Academico.Materias;

public record UpdateMateriaCommand(int Id, string Nombre, string? Descripcion, string Estado) : IRequest<MateriaDto>;

public class UpdateMateriaCommandValidator : AbstractValidator<UpdateMateriaCommand>
{
    public UpdateMateriaCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Estado).Must(e => Enum.TryParse<EstadoMateria>(e, true, out _));
    }
}

public class UpdateMateriaCommandHandler : IRequestHandler<UpdateMateriaCommand, MateriaDto>
{
    private readonly IAcademicoRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateMateriaCommandHandler(IAcademicoRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<MateriaDto> Handle(UpdateMateriaCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetMateriaByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Materia), request.Id);
        entity.Nombre = request.Nombre; entity.Descripcion = request.Descripcion; entity.Estado = Enum.Parse<EstadoMateria>(request.Estado, true);
        await _repository.UpdateMateriaAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return entity.ToDto();
    }
}
