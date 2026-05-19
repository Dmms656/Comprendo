using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Academico.Niveles;

public record UpdateNivelCommand(int Id, string Nombre, string? Descripcion) : IRequest<NivelDto>;

public class UpdateNivelCommandValidator : AbstractValidator<UpdateNivelCommand>
{
    public UpdateNivelCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(100);
    }
}

public class UpdateNivelCommandHandler : IRequestHandler<UpdateNivelCommand, NivelDto>
{
    private readonly IAcademicoRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateNivelCommandHandler(IAcademicoRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<NivelDto> Handle(UpdateNivelCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetNivelByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Nivel), request.Id);
        entity.Nombre = request.Nombre; entity.Descripcion = request.Descripcion;
        await _repository.UpdateNivelAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return entity.ToDto();
    }
}
