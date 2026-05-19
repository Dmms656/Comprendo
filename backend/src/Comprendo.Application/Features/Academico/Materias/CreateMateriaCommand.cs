using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Academico.Materias;

public record CreateMateriaCommand(string Nombre, string? Descripcion, string Estado) : IRequest<MateriaDto>;

public class CreateMateriaCommandValidator : AbstractValidator<CreateMateriaCommand>
{
    public CreateMateriaCommandValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Estado).Must(e => Enum.TryParse<EstadoMateria>(e, true, out _));
    }
}

public class CreateMateriaCommandHandler : IRequestHandler<CreateMateriaCommand, MateriaDto>
{
    private readonly IAcademicoRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateMateriaCommandHandler(IAcademicoRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<MateriaDto> Handle(CreateMateriaCommand request, CancellationToken cancellationToken)
    {
        var entity = new Materia { Nombre = request.Nombre, Descripcion = request.Descripcion, Estado = Enum.Parse<EstadoMateria>(request.Estado, true) };
        var created = await _repository.CreateMateriaAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return created.ToDto();
    }
}
