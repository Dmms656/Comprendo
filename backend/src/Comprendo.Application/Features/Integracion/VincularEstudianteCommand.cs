using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Integracion;

public record VincularEstudianteCommand(
    string TelefonoTelegram,
    string TelegramChatId,
    string? TelegramUsername) : IRequest;

public class VincularEstudianteCommandValidator : AbstractValidator<VincularEstudianteCommand>
{
    public VincularEstudianteCommandValidator()
    {
        RuleFor(x => x.TelefonoTelegram).NotEmpty();
        RuleFor(x => x.TelegramChatId).NotEmpty();
    }
}

public class VincularEstudianteCommandHandler : IRequestHandler<VincularEstudianteCommand>
{
    private readonly IEstudianteRepository _estudianteRepository;
    private readonly IUnitOfWork _unitOfWork;

    public VincularEstudianteCommandHandler(
        IEstudianteRepository estudianteRepository,
        IUnitOfWork unitOfWork)
    {
        _estudianteRepository = estudianteRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(VincularEstudianteCommand request, CancellationToken cancellationToken)
    {
        var estudiante = await _estudianteRepository.GetByTelefonoAsync(request.TelefonoTelegram, cancellationToken);

        if (estudiante is null)
        {
            throw new NotFoundException($"No existe un estudiante registrado con el teléfono {request.TelefonoTelegram}.");
        }

        estudiante.TelegramChatId = request.TelegramChatId;
        estudiante.TelegramUsername = request.TelegramUsername;

        await _estudianteRepository.UpdateAsync(estudiante, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
