using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Comprendo.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Auth;

public record RegisterDocenteCommand(
    string Nombres,
    string Apellidos,
    string Correo,
    string Password,
    string? UnidadEducativa) : IRequest<UsuarioDto>;

public class RegisterDocenteCommandValidator : AbstractValidator<RegisterDocenteCommand>
{
    public RegisterDocenteCommandValidator()
    {
        RuleFor(x => x.Nombres).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Apellidos).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Correo).NotEmpty().EmailAddress().MaximumLength(150);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
    }
}

public class RegisterDocenteCommandHandler : IRequestHandler<RegisterDocenteCommand, UsuarioDto>
{
    private readonly IAuthRepository _authRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IDateTimeProvider _dateTime;
    private readonly IUnitOfWork _unitOfWork;

    public RegisterDocenteCommandHandler(
        IAuthRepository authRepository,
        IPasswordHasher passwordHasher,
        IDateTimeProvider dateTime,
        IUnitOfWork unitOfWork)
    {
        _authRepository = authRepository;
        _passwordHasher = passwordHasher;
        _dateTime = dateTime;
        _unitOfWork = unitOfWork;
    }

    public async Task<UsuarioDto> Handle(RegisterDocenteCommand request, CancellationToken cancellationToken)
    {
        var existing = await _authRepository.GetUsuarioByEmailAsync(request.Correo, cancellationToken);
        if (existing is not null)
        {
            throw new Comprendo.Application.Common.Exceptions.ApplicationException("A user with this email already exists.");
        }

        var entity = new Docente
        {
            Estado = EstadoDocente.Activo,
            Especialidad = request.UnidadEducativa, // Store UnidadEducativa in Especialidad so it is saved in database
            Usuario = new Usuario
            {
                Nombres = request.Nombres,
                Apellidos = request.Apellidos,
                Correo = request.Correo,
                PasswordHash = _passwordHasher.Hash(request.Password),
                TipoUsuario = TipoUsuario.Docente,
                Estado = EstadoUsuario.Activo,
                FechaCreacion = _dateTime.UtcNow
            }
        };

        var created = await _authRepository.CreateDocenteAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new UsuarioDto(
            created.Usuario.IdUsuario,
            created.Usuario.Nombres,
            created.Usuario.Apellidos,
            created.Usuario.Correo,
            created.Usuario.TipoUsuario.ToString(),
            created.Usuario.Estado.ToString()
        );
    }
}
