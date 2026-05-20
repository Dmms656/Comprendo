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

public record UpdatePreguntaCommand(
    int Id,
    string Enunciado,
    string TipoPregunta,
    string? RespuestaCorrecta,
    string? Explicacion,
    decimal Puntaje,
    int Orden,
    string Estado,
    IReadOnlyList<OpcionPreguntaInput>? Opciones) : IRequest<PreguntaDto>;

public class UpdatePreguntaCommandValidator : AbstractValidator<UpdatePreguntaCommand>
{
    public UpdatePreguntaCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.Enunciado).NotEmpty();
        RuleFor(x => x.TipoPregunta).Must(t => Enum.TryParse<TipoPregunta>(t?.Replace("_", ""), true, out _));
        RuleFor(x => x.Estado).Must(e => Enum.TryParse<EstadoPregunta>(e, true, out _));
        RuleFor(x => x.Puntaje).GreaterThan(0);
        RuleFor(x => x.Orden).GreaterThan(0);
    }
}

public class UpdatePreguntaCommandHandler : IRequestHandler<UpdatePreguntaCommand, PreguntaDto>
{
    private readonly IPreguntaRepository _repository;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public UpdatePreguntaCommandHandler(
        IPreguntaRepository repository,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<PreguntaDto> Handle(UpdatePreguntaCommand request, CancellationToken cancellationToken)
    {
        var docenteId = _currentUser.RequireDocenteId();

        if (!await _repository.BelongsToDocenteLeccionAsync(request.Id, docenteId, cancellationToken))
        {
            throw new ForbiddenException();
        }

        var entity = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Pregunta), request.Id);

        entity.Enunciado = request.Enunciado;
        entity.TipoPregunta = Enum.Parse<TipoPregunta>(request.TipoPregunta.Replace("_", ""), true);
        entity.RespuestaCorrecta = request.RespuestaCorrecta;
        entity.Explicacion = request.Explicacion;
        entity.Puntaje = request.Puntaje;
        entity.Orden = request.Orden;
        entity.Estado = Enum.Parse<EstadoPregunta>(request.Estado, true);

        if (request.Opciones is not null)
        {
            entity.OpcionesPregunta = request.Opciones.Select(o => new OpcionPregunta
            {
                IdPregunta = entity.IdPregunta,
                Literal = o.Literal,
                Texto = o.Texto,
                EsCorrecta = o.EsCorrecta
            }).ToList();
        }

        await _repository.UpdateAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return entity.ToDto();
    }
}
