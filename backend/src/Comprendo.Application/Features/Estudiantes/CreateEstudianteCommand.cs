using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Estudiantes;

public record CreateEstudianteCommand(
    string TelefonoTelegram,
    string? CodigoEstudiante,
    string? TelegramChatId,
    string? TelegramUsername) : IRequest<EstudianteDto>;

public class CreateEstudianteCommandValidator : AbstractValidator<CreateEstudianteCommand>
{
    public CreateEstudianteCommandValidator()
    {
        RuleFor(x => x.TelefonoTelegram).NotEmpty().MaximumLength(20);
    }
}

public class CreateEstudianteCommandHandler : IRequestHandler<CreateEstudianteCommand, EstudianteDto>
{
    private readonly IEstudianteRepository _repository;
    private readonly IDateTimeProvider _dateTime;
    private readonly IUnitOfWork _unitOfWork;

    public CreateEstudianteCommandHandler(
        IEstudianteRepository repository,
        IDateTimeProvider dateTime,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _dateTime = dateTime;
        _unitOfWork = unitOfWork;
    }

    public async Task<EstudianteDto> Handle(CreateEstudianteCommand request, CancellationToken cancellationToken)
    {
        var entity = new Estudiante
        {
            TelefonoTelegram = request.TelefonoTelegram,
            CodigoEstudiante = request.CodigoEstudiante,
            TelegramChatId = request.TelegramChatId,
            TelegramUsername = request.TelegramUsername,
            Estado = EstadoEstudiante.Activo,
            FechaRegistro = _dateTime.UtcNow
        };

        var created = await _repository.CreateAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return created.ToDto();
    }
}
