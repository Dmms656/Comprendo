using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Enums;
using Comprendo.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Estudiantes;

public record UpdateEstudianteCommand(
    int Id,
    string TelefonoTelegram,
    string? CodigoEstudiante,
    string? TelegramChatId,
    string? TelegramUsername,
    string Estado) : IRequest<EstudianteDto>;

public class UpdateEstudianteCommandValidator : AbstractValidator<UpdateEstudianteCommand>
{
    public UpdateEstudianteCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.TelefonoTelegram).NotEmpty();
        RuleFor(x => x.Estado).Must(e => Enum.TryParse<EstadoEstudiante>(e, true, out _));
    }
}

public class UpdateEstudianteCommandHandler : IRequestHandler<UpdateEstudianteCommand, EstudianteDto>
{
    private readonly IEstudianteRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateEstudianteCommandHandler(IEstudianteRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<EstudianteDto> Handle(UpdateEstudianteCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Estudiante), request.Id);

        entity.TelefonoTelegram = request.TelefonoTelegram;
        entity.CodigoEstudiante = request.CodigoEstudiante;
        entity.TelegramChatId = request.TelegramChatId;
        entity.TelegramUsername = request.TelegramUsername;
        entity.Estado = Enum.Parse<EstadoEstudiante>(request.Estado, true);

        await _repository.UpdateAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return entity.ToDto();
    }
}
