using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Entities;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Academico.Paralelos;

public record CreateParaleloCommand(string Nombre, string? Descripcion) : IRequest<ParaleloDto>;

public class CreateParaleloCommandValidator : AbstractValidator<CreateParaleloCommand>
{
    public CreateParaleloCommandValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(10);
    }
}

public class CreateParaleloCommandHandler : IRequestHandler<CreateParaleloCommand, ParaleloDto>
{
    private readonly IAcademicoRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateParaleloCommandHandler(IAcademicoRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ParaleloDto> Handle(CreateParaleloCommand request, CancellationToken cancellationToken)
    {
        var entity = new Paralelo { Nombre = request.Nombre, Descripcion = request.Descripcion };
        var created = await _repository.CreateParaleloAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return created.ToDto();
    }
}
