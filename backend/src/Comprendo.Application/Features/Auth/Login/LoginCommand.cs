using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Features.Auth;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Application.Common.Mappings;
using Comprendo.Domain.Enums;
using Comprendo.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace Comprendo.Application.Features.Auth.Login;

public record LoginCommand(string Correo, string Password) : IRequest<LoginResponse>;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Correo).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
    }
}

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponse>
{
    private readonly IAuthRepository _authRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public LoginCommandHandler(
        IAuthRepository authRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _authRepository = authRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<LoginResponse> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _authRepository.GetUsuarioByEmailAsync(request.Correo, cancellationToken)
            ?? throw new ForbiddenException("Invalid credentials.");

        if (usuario.Estado != EstadoUsuario.Activo)
        {
            throw new ForbiddenException("User account is not active.");
        }

        if (string.IsNullOrEmpty(usuario.PasswordHash)
            || !_passwordHasher.Verify(request.Password, usuario.PasswordHash))
        {
            throw new ForbiddenException("Invalid credentials.");
        }

        int? docenteId = null;
        if (usuario.TipoUsuario == TipoUsuario.Docente)
        {
            var docente = await _authRepository.GetDocenteByUsuarioIdAsync(usuario.IdUsuario, cancellationToken);
            docenteId = docente?.IdDocente;
        }

        var token = _jwtTokenGenerator.GenerateToken(
            usuario.IdUsuario,
            usuario.Correo,
            usuario.TipoUsuario.ToString().ToUpperInvariant(),
            docenteId);

        return new LoginResponse(token, usuario.ToDto());
    }
}
