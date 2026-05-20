using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Extensions;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Domain.Exceptions;
using MediatR;
using System.Security.Cryptography;
using System.Text;

namespace Comprendo.Application.Features.Asignaciones;

public record GenerarCodigoAsignacionCommand(int IdDocenteCursoMateria) : IRequest<string>;

public class GenerarCodigoAsignacionCommandHandler : IRequestHandler<GenerarCodigoAsignacionCommand, string>
{
    private readonly IAsignacionRepository _repository;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public GenerarCodigoAsignacionCommandHandler(
        IAsignacionRepository repository,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<string> Handle(GenerarCodigoAsignacionCommand request, CancellationToken cancellationToken)
    {
        var docenteId = _currentUser.RequireDocenteId();
        var asignacion = await _repository.GetByIdAsync(request.IdDocenteCursoMateria, cancellationToken);

        if (asignacion is null)
        {
            throw new NotFoundException(nameof(Domain.Entities.DocenteCursoMateria), request.IdDocenteCursoMateria);
        }

        if (asignacion.IdDocente != docenteId)
        {
            throw new ForbiddenException("No tienes permiso para acceder a esta asignatura.");
        }

        string codigo = string.Empty;
        bool unique = false;
        int retries = 0;

        while (!unique && retries < 10)
        {
            codigo = GenerateRandomCode(6);
            var existing = await _repository.GetByCodigoAccesoAsync(codigo, cancellationToken);
            if (existing is null)
            {
                unique = true;
            }
            retries++;
        }

        if (!unique)
        {
            throw new Comprendo.Domain.Exceptions.ConflictException("No se pudo generar un código único.");
        }

        asignacion.CodigoAcceso = codigo;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return codigo;
    }

    private static string GenerateRandomCode(int length)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var result = new StringBuilder(length);
        for (int i = 0; i < length; i++)
        {
            result.Append(chars[RandomNumberGenerator.GetInt32(chars.Length)]);
        }
        return result.ToString();
    }
}
