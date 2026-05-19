using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Integracion;

public record RegisterEnvioCommand(
    int IdLeccion,
    int IdPregunta,
    int IdEstudiante,
    string TelegramChatId,
    string? MensajeEnviado,
    string? TelegramMessageId,
    string EstadoEnvio) : IRequest<EnvioTelegramDto>;

public class RegisterEnvioCommandValidator : AbstractValidator<RegisterEnvioCommand>
{
    public RegisterEnvioCommandValidator()
    {
        RuleFor(x => x.IdLeccion).GreaterThan(0);
        RuleFor(x => x.IdPregunta).GreaterThan(0);
        RuleFor(x => x.IdEstudiante).GreaterThan(0);
        RuleFor(x => x.TelegramChatId).NotEmpty();
        RuleFor(x => x.EstadoEnvio).Must(e => Enum.TryParse<EstadoEnvioTelegram>(e, true, out _));
    }
}

public class RegisterEnvioCommandHandler : IRequestHandler<RegisterEnvioCommand, EnvioTelegramDto>
{
    private readonly IIntegracionRepository _repository;
    private readonly IDateTimeProvider _dateTime;
    private readonly IUnitOfWork _unitOfWork;

    public RegisterEnvioCommandHandler(
        IIntegracionRepository repository,
        IDateTimeProvider dateTime,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _dateTime = dateTime;
        _unitOfWork = unitOfWork;
    }

    public async Task<EnvioTelegramDto> Handle(RegisterEnvioCommand request, CancellationToken cancellationToken)
    {
        var entity = new EnvioTelegram
        {
            IdLeccion = request.IdLeccion,
            IdPregunta = request.IdPregunta,
            IdEstudiante = request.IdEstudiante,
            TelegramChatId = request.TelegramChatId,
            MensajeEnviado = request.MensajeEnviado,
            TelegramMessageId = request.TelegramMessageId,
            FechaEnvio = _dateTime.UtcNow,
            EstadoEnvio = Enum.Parse<EstadoEnvioTelegram>(request.EstadoEnvio, true)
        };

        var created = await _repository.RegisterEnvioAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return created.ToDto();
    }
}
