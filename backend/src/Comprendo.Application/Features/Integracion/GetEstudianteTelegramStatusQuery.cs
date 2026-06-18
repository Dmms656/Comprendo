using Comprendo.Application.Abstractions.Persistence;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Integracion;

public record EstudianteTelegramStatusDto(bool Registrado, string? Nombres, string? Apellidos);

public record GetEstudianteTelegramStatusQuery(string TelegramChatId) : IRequest<EstudianteTelegramStatusDto>;

public class GetEstudianteTelegramStatusQueryValidator : AbstractValidator<GetEstudianteTelegramStatusQuery>
{
    public GetEstudianteTelegramStatusQueryValidator()
    {
        RuleFor(x => x.TelegramChatId).NotEmpty();
    }
}

public class GetEstudianteTelegramStatusQueryHandler
    : IRequestHandler<GetEstudianteTelegramStatusQuery, EstudianteTelegramStatusDto>
{
    private readonly IEstudianteRepository _repository;

    public GetEstudianteTelegramStatusQueryHandler(IEstudianteRepository repository)
    {
        _repository = repository;
    }

    public async Task<EstudianteTelegramStatusDto> Handle(
        GetEstudianteTelegramStatusQuery request,
        CancellationToken cancellationToken)
    {
        var estudiante = await _repository.GetByTelegramChatIdAsync(request.TelegramChatId, cancellationToken);
        if (estudiante is null)
        {
            return new EstudianteTelegramStatusDto(false, null, null);
        }

        return new EstudianteTelegramStatusDto(
            true,
            estudiante.Usuario?.Nombres,
            estudiante.Usuario?.Apellidos);
    }
}
