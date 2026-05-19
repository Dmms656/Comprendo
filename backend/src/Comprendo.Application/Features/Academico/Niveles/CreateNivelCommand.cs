using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Entities;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Academico.Niveles;

public record CreateNivelCommand(string Nombre, string? Descripcion) : IRequest<NivelDto>;

public class CreateNivelCommandValidator : AbstractValidator<CreateNivelCommand>
{
    public CreateNivelCommandValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(100);
    }
}

public class CreateNivelCommandHandler : IRequestHandler<CreateNivelCommand, NivelDto>
{
    private readonly IAcademicoRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateNivelCommandHandler(IAcademicoRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<NivelDto> Handle(CreateNivelCommand request, CancellationToken cancellationToken)
    {
        var entity = new Nivel { Nombre = request.Nombre, Descripcion = request.Descripcion };
        var created = await _repository.CreateNivelAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return created.ToDto();
    }
}
