using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Enums;
using Comprendo.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Academico.Cursos;

public record UpdateCursoCommand(int Id, int IdAnioLectivo, int IdNivel, int IdParalelo, string Estado) : IRequest<CursoDto>;

public class UpdateCursoCommandValidator : AbstractValidator<UpdateCursoCommand>
{
    public UpdateCursoCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.IdAnioLectivo).GreaterThan(0);
        RuleFor(x => x.IdNivel).GreaterThan(0);
        RuleFor(x => x.IdParalelo).GreaterThan(0);
        RuleFor(x => x.Estado).Must(e => Enum.TryParse<EstadoCurso>(e, true, out _));
    }
}

public class UpdateCursoCommandHandler : IRequestHandler<UpdateCursoCommand, CursoDto>
{
    private readonly IAcademicoRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateCursoCommandHandler(IAcademicoRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<CursoDto> Handle(UpdateCursoCommand request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetCursoByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Curso), request.Id);
        entity.IdAnioLectivo = request.IdAnioLectivo; entity.IdNivel = request.IdNivel; entity.IdParalelo = request.IdParalelo; entity.Estado = Enum.Parse<EstadoCurso>(request.Estado, true);
        await _repository.UpdateCursoAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return entity.ToDto();
    }
}
