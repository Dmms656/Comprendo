using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Academico.Cursos;

public record CreateCursoCommand(int IdAnioLectivo, int IdNivel, int IdParalelo, string Estado) : IRequest<CursoDto>;

public class CreateCursoCommandValidator : AbstractValidator<CreateCursoCommand>
{
    public CreateCursoCommandValidator()
    {
        RuleFor(x => x.IdAnioLectivo).GreaterThan(0);
        RuleFor(x => x.IdNivel).GreaterThan(0);
        RuleFor(x => x.IdParalelo).GreaterThan(0);
        RuleFor(x => x.Estado).Must(e => Enum.TryParse<EstadoCurso>(e, true, out _));
    }
}

public class CreateCursoCommandHandler : IRequestHandler<CreateCursoCommand, CursoDto>
{
    private readonly IAcademicoRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateCursoCommandHandler(IAcademicoRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<CursoDto> Handle(CreateCursoCommand request, CancellationToken cancellationToken)
    {
        var entity = new Curso { IdAnioLectivo = request.IdAnioLectivo, IdNivel = request.IdNivel, IdParalelo = request.IdParalelo, Estado = Enum.Parse<EstadoCurso>(request.Estado, true) };
        var created = await _repository.CreateCursoAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return created.ToDto();
    }
}
