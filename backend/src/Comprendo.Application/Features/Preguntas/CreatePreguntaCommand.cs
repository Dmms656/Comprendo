using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Extensions;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Comprendo.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Preguntas;

public record CreatePreguntaCommand(
    int IdLeccion,
    string Enunciado,
    string TipoPregunta,
    string? RespuestaCorrecta,
    string? Explicacion,
    decimal Puntaje,
    int Orden,
    IReadOnlyList<OpcionPreguntaInput>? Opciones) : IRequest<PreguntaDto>;

public class CreatePreguntaCommandValidator : AbstractValidator<CreatePreguntaCommand>
{
    public CreatePreguntaCommandValidator()
    {
        RuleFor(x => x.IdLeccion).GreaterThan(0);
        RuleFor(x => x.Enunciado).NotEmpty();
        RuleFor(x => x.TipoPregunta).Must(t => Enum.TryParse<TipoPregunta>(t?.Replace("_", ""), true, out _));
        RuleFor(x => x.Puntaje).GreaterThan(0);
        RuleFor(x => x.Orden).GreaterThan(0);
    }
}

public class CreatePreguntaCommandHandler : IRequestHandler<CreatePreguntaCommand, PreguntaDto>
{
    private readonly IPreguntaRepository _preguntaRepository;
    private readonly ILeccionRepository _leccionRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public CreatePreguntaCommandHandler(
        IPreguntaRepository preguntaRepository,
        ILeccionRepository leccionRepository,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _preguntaRepository = preguntaRepository;
        _leccionRepository = leccionRepository;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<PreguntaDto> Handle(CreatePreguntaCommand request, CancellationToken cancellationToken)
    {
        var docenteId = _currentUser.RequireDocenteId();

        if (!await _leccionRepository.BelongsToDocenteAsync(request.IdLeccion, docenteId, cancellationToken))
        {
            throw new ForbiddenException();
        }

        var leccion = await _leccionRepository.GetByIdAsync(request.IdLeccion, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Leccion), request.IdLeccion);

        var entity = new Pregunta
        {
            IdLeccion = request.IdLeccion,
            Enunciado = request.Enunciado,
            TipoPregunta = Enum.Parse<TipoPregunta>(request.TipoPregunta.Replace("_", ""), true),
            RespuestaCorrecta = request.RespuestaCorrecta,
            Explicacion = request.Explicacion,
            Puntaje = request.Puntaje,
            Orden = request.Orden,
            Estado = EstadoPregunta.Activa,
            OpcionesPregunta = request.Opciones?.Select(o => new OpcionPregunta
            {
                Literal = o.Literal,
                Texto = o.Texto,
                EsCorrecta = o.EsCorrecta
            }).ToList() ?? []
        };

        var created = await _preguntaRepository.CreateAsync(entity, cancellationToken);
        
        leccion.NumeroPreguntas += 1;
        await _leccionRepository.UpdateAsync(leccion, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return created.ToDto();
    }
}
