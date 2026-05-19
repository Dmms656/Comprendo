$app = "c:\Users\medin\OneDrive\Documentos\U\Emprendimiento\Comprendo\backend\src\Comprendo.Application\Features\Academico"

function New-AcademicoEntity {
    param($Folder, $Entity, $EnumName, $HasEstado, $DtoProps, $CreateProps, $UpdateProps, $CreateAssign, $UpdateAssign, $CreateValidation, $UpdateValidation)
    
    $dir = Join-Path $app $Folder
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    
    @"
namespace Comprendo.Application.Features.Academico.$Folder;

public record ${Entity}Dto($DtoProps);
"@ | Set-Content (Join-Path $dir "${Entity}Dtos.cs") -Encoding UTF8

    @"
using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Mappings;
using Comprendo.Application.Common.Models;
using MediatR;

namespace Comprendo.Application.Features.Academico.$Folder;

public record List${Entity}sQuery(int PageNumber = 1, int PageSize = 20)
    : IRequest<PaginatedList<${Entity}Dto>>;

public class List${Entity}sQueryHandler : IRequestHandler<List${Entity}sQuery, PaginatedList<${Entity}Dto>>
{
    private readonly IAcademicoRepository _repository;
    public List${Entity}sQueryHandler(IAcademicoRepository repository) => _repository = repository;

    public async Task<PaginatedList<${Entity}Dto>> Handle(List${Entity}sQuery request, CancellationToken cancellationToken)
    {
        var page = await _repository.List${Entity}sAsync(request.PageNumber, request.PageSize, cancellationToken);
        var items = page.Items.Select(x => x.ToDto()).ToList();
        return new PaginatedList<${Entity}Dto>(items, page.TotalCount, page.PageNumber, page.PageSize);
    }
}
"@ | Set-Content (Join-Path $dir "List${Entity}sQuery.cs") -Encoding UTF8

    @"
using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Exceptions;
using MediatR;

namespace Comprendo.Application.Features.Academico.$Folder;

public record Get${Entity}ByIdQuery(int Id) : IRequest<${Entity}Dto>;

public class Get${Entity}ByIdQueryHandler : IRequestHandler<Get${Entity}ByIdQuery, ${Entity}Dto>
{
    private readonly IAcademicoRepository _repository;
    public Get${Entity}ByIdQueryHandler(IAcademicoRepository repository) => _repository = repository;

    public async Task<${Entity}Dto> Handle(Get${Entity}ByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await _repository.Get${Entity}ByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.$Entity), request.Id);
        return entity.ToDto();
    }
}
"@ | Set-Content (Join-Path $dir "Get${Entity}ByIdQuery.cs") -Encoding UTF8

    $enumUsing = if ($HasEstado) { "using Comprendo.Domain.Enums;`n" } else { "" }
    $enumValidator = if ($HasEstado) { "        RuleFor(x => x.Estado).Must(e => Enum.TryParse<$EnumName>(e, true, out _));`n" } else { "" }

    @"
using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Entities;
$enumUsingusing FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Academico.$Folder;

public record Create${Entity}Command($CreateProps) : IRequest<${Entity}Dto>;

public class Create${Entity}CommandValidator : AbstractValidator<Create${Entity}Command>
{
    public Create${Entity}CommandValidator()
    {
$CreateValidation$enumValidator    }
}

public class Create${Entity}CommandHandler : IRequestHandler<Create${Entity}Command, ${Entity}Dto>
{
    private readonly IAcademicoRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public Create${Entity}CommandHandler(IAcademicoRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<${Entity}Dto> Handle(Create${Entity}Command request, CancellationToken cancellationToken)
    {
        var entity = new $Entity { $CreateAssign };
        var created = await _repository.Create${Entity}Async(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return created.ToDto();
    }
}
"@ | Set-Content (Join-Path $dir "Create${Entity}Command.cs") -Encoding UTF8

    @"
using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
$enumUsingusing Comprendo.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Academico.$Folder;

public record Update${Entity}Command($UpdateProps) : IRequest<${Entity}Dto>;

public class Update${Entity}CommandValidator : AbstractValidator<Update${Entity}Command>
{
    public Update${Entity}CommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
$UpdateValidation$enumValidator    }
}

public class Update${Entity}CommandHandler : IRequestHandler<Update${Entity}Command, ${Entity}Dto>
{
    private readonly IAcademicoRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public Update${Entity}CommandHandler(IAcademicoRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<${Entity}Dto> Handle(Update${Entity}Command request, CancellationToken cancellationToken)
    {
        var entity = await _repository.Get${Entity}ByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.$Entity), request.Id);
        $UpdateAssign
        await _repository.Update${Entity}Async(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return entity.ToDto();
    }
}
"@ | Set-Content (Join-Path $dir "Update${Entity}Command.cs") -Encoding UTF8
}

New-AcademicoEntity -Folder Niveles -Entity Nivel -EnumName "" -HasEstado $false `
    -DtoProps "int IdNivel, string Nombre, string? Descripcion" `
    -CreateProps "string Nombre, string? Descripcion" `
    -UpdateProps "int Id, string Nombre, string? Descripcion" `
    -CreateAssign "Nombre = request.Nombre, Descripcion = request.Descripcion" `
    -UpdateAssign "entity.Nombre = request.Nombre; entity.Descripcion = request.Descripcion;" `
    -CreateValidation "        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(100);`n" `
    -UpdateValidation "        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(100);`n"

New-AcademicoEntity -Folder Paralelos -Entity Paralelo -EnumName "" -HasEstado $false `
    -DtoProps "int IdParalelo, string Nombre, string? Descripcion" `
    -CreateProps "string Nombre, string? Descripcion" `
    -UpdateProps "int Id, string Nombre, string? Descripcion" `
    -CreateAssign "Nombre = request.Nombre, Descripcion = request.Descripcion" `
    -UpdateAssign "entity.Nombre = request.Nombre; entity.Descripcion = request.Descripcion;" `
    -CreateValidation "        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(10);`n" `
    -UpdateValidation "        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(10);`n"

New-AcademicoEntity -Folder Cursos -Entity Curso -EnumName EstadoCurso -HasEstado $true `
    -DtoProps "int IdCurso, int IdAnioLectivo, int IdNivel, int IdParalelo, string Estado" `
    -CreateProps "int IdAnioLectivo, int IdNivel, int IdParalelo, string Estado" `
    -UpdateProps "int Id, int IdAnioLectivo, int IdNivel, int IdParalelo, string Estado" `
    -CreateAssign "IdAnioLectivo = request.IdAnioLectivo, IdNivel = request.IdNivel, IdParalelo = request.IdParalelo, Estado = Enum.Parse<EstadoCurso>(request.Estado, true)" `
    -UpdateAssign "entity.IdAnioLectivo = request.IdAnioLectivo; entity.IdNivel = request.IdNivel; entity.IdParalelo = request.IdParalelo; entity.Estado = Enum.Parse<EstadoCurso>(request.Estado, true);" `
    -CreateValidation "        RuleFor(x => x.IdAnioLectivo).GreaterThan(0);`n        RuleFor(x => x.IdNivel).GreaterThan(0);`n        RuleFor(x => x.IdParalelo).GreaterThan(0);`n" `
    -UpdateValidation "        RuleFor(x => x.IdAnioLectivo).GreaterThan(0);`n        RuleFor(x => x.IdNivel).GreaterThan(0);`n        RuleFor(x => x.IdParalelo).GreaterThan(0);`n"

New-AcademicoEntity -Folder Materias -Entity Materia -EnumName EstadoMateria -HasEstado $true `
    -DtoProps "int IdMateria, string Nombre, string? Descripcion, string Estado" `
    -CreateProps "string Nombre, string? Descripcion, string Estado" `
    -UpdateProps "int Id, string Nombre, string? Descripcion, string Estado" `
    -CreateAssign "Nombre = request.Nombre, Descripcion = request.Descripcion, Estado = Enum.Parse<EstadoMateria>(request.Estado, true)" `
    -UpdateAssign "entity.Nombre = request.Nombre; entity.Descripcion = request.Descripcion; entity.Estado = Enum.Parse<EstadoMateria>(request.Estado, true);" `
    -CreateValidation "        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(120);`n" `
    -UpdateValidation "        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(120);`n"

Write-Host "Academico entities generated"
