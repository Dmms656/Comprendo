using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Academico.Paralelos;

public record UpdateParaleloCommand(int Id, string Nombre, string? Descripcion) : IRequest<ParaleloDto>;

public class UpdateParaleloCommandValidator : AbstractValidator<UpdateParaleloCommand>
{
    public UpdateParaleloCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(10);
    }
}

public class UpdateParaleloCommandHandler : IRequestHandler<UpdateParaleloCommand, ParaleloDto>
{
    private readonly IAcademicoRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateParaleloCommandHandler(IAcademicoRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ParaleloDto> Handle(UpdateParaleloCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetParaleloByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Paralelo), request.Id);
        entity.Nombre = request.Nombre; entity.Descripcion = request.Descripcion;
        await _repository.UpdateParaleloAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return entity.ToDto();
    }
}
