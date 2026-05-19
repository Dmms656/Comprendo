using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Entities;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Integracion;

public record RegisterRespuestaCommand(
    int IdEnvio,
    int IdEstudiante,
    int IdPregunta,
    string RespuestaTexto,
    bool? EsCorrecta,
    decimal PuntajeObtenido,
    int? TiempoRespuestaSegundos,
    bool EvaluadaPorIa,
    string? Retroalimentacion) : IRequest<RespuestaEstudianteDto>;

public class RegisterRespuestaCommandValidator : AbstractValidator<RegisterRespuestaCommand>
{
    public RegisterRespuestaCommandValidator()
    {
        RuleFor(x => x.IdEnvio).GreaterThan(0);
        RuleFor(x => x.IdEstudiante).GreaterThan(0);
        RuleFor(x => x.IdPregunta).GreaterThan(0);
        RuleFor(x => x.RespuestaTexto).NotEmpty();
        RuleFor(x => x.PuntajeObtenido).GreaterThanOrEqualTo(0);
    }
}

public class RegisterRespuestaCommandHandler : IRequestHandler<RegisterRespuestaCommand, RespuestaEstudianteDto>
{
    private readonly IIntegracionRepository _repository;
    private readonly IDateTimeProvider _dateTime;
    private readonly IUnitOfWork _unitOfWork;

    public RegisterRespuestaCommandHandler(
        IIntegracionRepository repository,
        IDateTimeProvider dateTime,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _dateTime = dateTime;
        _unitOfWork = unitOfWork;
    }

    public async Task<RespuestaEstudianteDto> Handle(
        RegisterRespuestaCommand request,
        CancellationToken cancellationToken)
    {
        var entity = new RespuestaEstudiante
        {
            IdEnvio = request.IdEnvio,
            IdEstudiante = request.IdEstudiante,
            IdPregunta = request.IdPregunta,
            RespuestaTexto = request.RespuestaTexto,
            EsCorrecta = request.EsCorrecta,
            PuntajeObtenido = request.PuntajeObtenido,
            FechaRespuesta = _dateTime.UtcNow,
            TiempoRespuestaSegundos = request.TiempoRespuestaSegundos,
            EvaluadaPorIa = request.EvaluadaPorIa,
            Retroalimentacion = request.Retroalimentacion
        };

        var created = await _repository.RegisterRespuestaAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return created.ToDto();
    }
}
