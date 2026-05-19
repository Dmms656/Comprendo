using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Integracion;

public record RegisterSolicitudIaCommand(
    int IdDocente,
    int? IdLeccion,
    string Proveedor,
    string? Modelo,
    string Prompt,
    string? RespuestaIa,
    int CantidadPreguntasGeneradas,
    int? TokensEntrada,
    int? TokensSalida,
    string Estado,
    string? Error) : IRequest<SolicitudIaDto>;

public class RegisterSolicitudIaCommandValidator : AbstractValidator<RegisterSolicitudIaCommand>
{
    public RegisterSolicitudIaCommandValidator()
    {
        RuleFor(x => x.IdDocente).GreaterThan(0);
        RuleFor(x => x.Proveedor).NotEmpty();
        RuleFor(x => x.Prompt).NotEmpty();
        RuleFor(x => x.Estado).Must(e => Enum.TryParse<EstadoSolicitudIa>(e, true, out _));
        RuleFor(x => x.CantidadPreguntasGeneradas).GreaterThanOrEqualTo(0);
    }
}

public class RegisterSolicitudIaCommandHandler : IRequestHandler<RegisterSolicitudIaCommand, SolicitudIaDto>
{
    private readonly IIntegracionRepository _repository;
    private readonly IDateTimeProvider _dateTime;
    private readonly IUnitOfWork _unitOfWork;

    public RegisterSolicitudIaCommandHandler(
        IIntegracionRepository repository,
        IDateTimeProvider dateTime,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _dateTime = dateTime;
        _unitOfWork = unitOfWork;
    }

    public async Task<SolicitudIaDto> Handle(
        RegisterSolicitudIaCommand request,
        CancellationToken cancellationToken)
    {
        var entity = new SolicitudIa
        {
            IdDocente = request.IdDocente,
            IdLeccion = request.IdLeccion,
            Proveedor = request.Proveedor,
            Modelo = request.Modelo,
            Prompt = request.Prompt,
            RespuestaIa = request.RespuestaIa,
            CantidadPreguntasGeneradas = request.CantidadPreguntasGeneradas,
            TokensEntrada = request.TokensEntrada,
            TokensSalida = request.TokensSalida,
            FechaSolicitud = _dateTime.UtcNow,
            Estado = Enum.Parse<EstadoSolicitudIa>(request.Estado, true),
            Error = request.Error
        };

        var created = await _repository.RegisterSolicitudIaAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return created.ToDto();
    }
}
