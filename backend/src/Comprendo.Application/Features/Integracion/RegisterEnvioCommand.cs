using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Comprendo.Domain.Exceptions;
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
    private readonly ILeccionRepository _leccionRepository;
    private readonly IPreguntaRepository _preguntaRepository;
    private readonly IEstudianteRepository _estudianteRepository;
    private readonly IDateTimeProvider _dateTime;
    private readonly IUnitOfWork _unitOfWork;

    public RegisterEnvioCommandHandler(
        IIntegracionRepository repository,
        ILeccionRepository leccionRepository,
        IPreguntaRepository preguntaRepository,
        IEstudianteRepository estudianteRepository,
        IDateTimeProvider dateTime,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _leccionRepository = leccionRepository;
        _preguntaRepository = preguntaRepository;
        _estudianteRepository = estudianteRepository;
        _dateTime = dateTime;
        _unitOfWork = unitOfWork;
    }

    public async Task<EnvioTelegramDto> Handle(RegisterEnvioCommand request, CancellationToken cancellationToken)
    {
        var leccion = await _leccionRepository.GetByIdAsync(request.IdLeccion, cancellationToken)
            ?? throw new NotFoundException(nameof(Leccion), request.IdLeccion);

        var pregunta = await _preguntaRepository.GetByIdAsync(request.IdPregunta, cancellationToken)
            ?? throw new NotFoundException(nameof(Pregunta), request.IdPregunta);

        if (pregunta.IdLeccion != request.IdLeccion)
        {
            throw new ForbiddenException("La pregunta no pertenece a la lección indicada.");
        }

        if (pregunta.Estado != EstadoPregunta.Activa)
        {
            throw new ForbiddenException("La pregunta no está activa.");
        }

        var isEnrolled = await _estudianteRepository.IsEnrolledInMateriaAsync(
            request.IdEstudiante,
            leccion.IdDocenteCursoMateria,
            cancellationToken);

        if (!isEnrolled)
        {
            throw new ForbiddenException("El estudiante no está matriculado en la materia de esta lección.");
        }

        // Upsert: si ya existe un envío para esta pregunta+estudiante, se actualiza en lugar de insertar
        // Esto evita la violación de restricción única (IdPregunta, IdEstudiante) al reenviar la misma pregunta
        var existing = await _repository.GetEnvioByPreguntaEstudianteAsync(
            request.IdPregunta, request.IdEstudiante, cancellationToken);

        if (existing is not null)
        {
            // Actualizar el envío existente con los nuevos valores
            existing.TelegramChatId = request.TelegramChatId;
            existing.MensajeEnviado = request.MensajeEnviado;
            existing.TelegramMessageId = request.TelegramMessageId;
            existing.FechaEnvio = _dateTime.UtcNow;
            existing.EstadoEnvio = Enum.Parse<EstadoEnvioTelegram>(request.EstadoEnvio, true);
            existing.ErrorEnvio = null;

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return existing.ToDto();
        }

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
