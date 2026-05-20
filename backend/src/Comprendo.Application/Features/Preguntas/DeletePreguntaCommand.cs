using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Extensions;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Domain.Entities;
using Comprendo.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Preguntas;

public record DeletePreguntaCommand(int Id) : IRequest<Unit>;

public class DeletePreguntaCommandValidator : AbstractValidator<DeletePreguntaCommand>
{
    public DeletePreguntaCommandValidator() => RuleFor(x => x.Id).GreaterThan(0);
}

public class DeletePreguntaCommandHandler : IRequestHandler<DeletePreguntaCommand, Unit>
{
    private readonly IPreguntaRepository _repository;
    private readonly ILeccionRepository _leccionRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public DeletePreguntaCommandHandler(
        IPreguntaRepository repository,
        ILeccionRepository leccionRepository,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _leccionRepository = leccionRepository;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<Unit> Handle(DeletePreguntaCommand request, CancellationToken cancellationToken)
    {
        var docenteId = _currentUser.RequireDocenteId();

        if (!await _repository.BelongsToDocenteLeccionAsync(request.Id, docenteId, cancellationToken))
        {
            throw new ForbiddenException();
        }

        var pregunta = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Pregunta), request.Id);

        var leccion = await _leccionRepository.GetByIdAsync(pregunta.IdLeccion, cancellationToken);
        if (leccion is not null)
        {
            leccion.NumeroPreguntas = Math.Max(0, leccion.NumeroPreguntas - 1);
            await _leccionRepository.UpdateAsync(leccion, cancellationToken);
        }

        await _repository.DeleteAsync(request.Id, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
