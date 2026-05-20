using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using FluentValidation;
using MediatR;
using System.Text.RegularExpressions;

namespace Comprendo.Application.Features.Integracion;

public record VincularEstudianteCodigoResult(
    bool Exito,
    bool RequiereTelefono,
    string? Mensaje,
    string? MateriaNombre);

public record VincularEstudianteCodigoCommand(
    string TelegramChatId,
    string? TelegramUsername,
    string Nombres,
    string Apellidos,
    string CodigoAcceso,
    string? TelefonoTelegram) : IRequest<VincularEstudianteCodigoResult>;

public class VincularEstudianteCodigoCommandValidator : AbstractValidator<VincularEstudianteCodigoCommand>
{
    public VincularEstudianteCodigoCommandValidator()
    {
        RuleFor(x => x.TelegramChatId).NotEmpty();
        RuleFor(x => x.CodigoAcceso).NotEmpty();
    }
}

public class VincularEstudianteCodigoCommandHandler : IRequestHandler<VincularEstudianteCodigoCommand, VincularEstudianteCodigoResult>
{
    private readonly IEstudianteRepository _estudianteRepository;
    private readonly IAsignacionRepository _asignacionRepository;
    private readonly IDateTimeProvider _dateTime;
    private readonly IUnitOfWork _unitOfWork;

    public VincularEstudianteCodigoCommandHandler(
        IEstudianteRepository estudianteRepository,
        IAsignacionRepository asignacionRepository,
        IDateTimeProvider dateTime,
        IUnitOfWork unitOfWork)
    {
        _estudianteRepository = estudianteRepository;
        _asignacionRepository = asignacionRepository;
        _dateTime = dateTime;
        _unitOfWork = unitOfWork;
    }

    public async Task<VincularEstudianteCodigoResult> Handle(VincularEstudianteCodigoCommand request, CancellationToken cancellationToken)
    {
        // 1. Buscar la asignación de materia por su código de acceso
        var asignacion = await _asignacionRepository.GetByCodigoAccesoAsync(request.CodigoAcceso.Trim().ToUpperInvariant(), cancellationToken);
        if (asignacion is null)
        {
            return new VincularEstudianteCodigoResult(false, false, "El código de materia no es válido.", null);
        }

        // 2. Buscar si ya existe el estudiante por su Chat ID de Telegram
        var estudiante = await _estudianteRepository.GetByTelegramChatIdAsync(request.TelegramChatId, cancellationToken);

        if (estudiante is not null)
        {
            // Matricular al estudiante en el curso y la materia si no lo está
            await MatricularEstudianteAsync(estudiante.IdEstudiante, asignacion, cancellationToken);
            return new VincularEstudianteCodigoResult(true, false, "Inscripción completada exitosamente.", asignacion.Materia.Nombre);
        }

        // 3. Si no existe por Chat ID, verificar si se envió el teléfono
        if (string.IsNullOrWhiteSpace(request.TelefonoTelegram))
        {
            return new VincularEstudianteCodigoResult(false, true, "Se requiere número de teléfono para registrar al estudiante.", null);
        }

        // Limpiar el número de teléfono (dejar solo dígitos)
        var cleanPhone = Regex.Replace(request.TelefonoTelegram, @"\D", "");

        // 4. Verificar si ya existe un estudiante registrado con este número telefónico
        estudiante = await _estudianteRepository.GetByTelefonoAsync(cleanPhone, cancellationToken);

        if (estudiante is not null)
        {
            // Vincular la cuenta de Telegram
            estudiante.TelegramChatId = request.TelegramChatId;
            estudiante.TelegramUsername = request.TelegramUsername;
            await _estudianteRepository.UpdateAsync(estudiante, cancellationToken);

            await MatricularEstudianteAsync(estudiante.IdEstudiante, asignacion, cancellationToken);
            return new VincularEstudianteCodigoResult(true, false, "Cuenta vinculada e inscripción completada.", asignacion.Materia.Nombre);
        }

        // 5. Si no existe, crear un nuevo estudiante y usuario
        var names = string.IsNullOrWhiteSpace(request.Nombres) ? "Estudiante" : request.Nombres.Trim();
        var lastNames = string.IsNullOrWhiteSpace(request.Apellidos) ? "Telegram" : request.Apellidos.Trim();
        var generatedEmail = $"tg_{request.TelegramChatId}@estudiante.local";

        var nuevoEstudiante = new Estudiante
        {
            TelefonoTelegram = cleanPhone,
            TelegramChatId = request.TelegramChatId,
            TelegramUsername = request.TelegramUsername,
            Estado = EstadoEstudiante.Activo,
            FechaRegistro = _dateTime.UtcNow,
            Usuario = new Usuario
            {
                Nombres = names,
                Apellidos = lastNames,
                Correo = generatedEmail,
                TipoUsuario = TipoUsuario.Estudiante,
                Estado = EstadoUsuario.Activo,
                FechaCreacion = _dateTime.UtcNow
            }
        };

        var creado = await _estudianteRepository.CreateAsync(nuevoEstudiante, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken); // Generar ID de estudiante

        await MatricularEstudianteAsync(creado.IdEstudiante, asignacion, cancellationToken);
        return new VincularEstudianteCodigoResult(true, false, "Registro y matrícula completados exitosamente.", asignacion.Materia.Nombre);
    }

    private async Task MatricularEstudianteAsync(int estudianteId, DocenteCursoMateria asignacion, CancellationToken cancellationToken)
    {
        // Verificar matrícula en el Curso
        var isEnrolledCurso = await _estudianteRepository.IsEnrolledInCursoAsync(estudianteId, asignacion.IdCurso, cancellationToken);
        if (!isEnrolledCurso)
        {
            var enrollmentCurso = new EstudianteCurso
            {
                IdEstudiante = estudianteId,
                IdCurso = asignacion.IdCurso,
                Estado = EstadoAsignacion.Activo,
                FechaMatricula = _dateTime.UtcNow
            };
            await _estudianteRepository.EnrollCursoAsync(enrollmentCurso, cancellationToken);
        }

        // Verificar matrícula en la Materia (DocenteCursoMateria)
        var isEnrolledMateria = await _estudianteRepository.IsEnrolledInMateriaAsync(estudianteId, asignacion.IdDocenteCursoMateria, cancellationToken);
        if (!isEnrolledMateria)
        {
            var enrollmentMateria = new EstudianteMateria
            {
                IdEstudiante = estudianteId,
                IdDocenteCursoMateria = asignacion.IdDocenteCursoMateria,
                Estado = EstadoAsignacion.Activo,
                FechaRegistro = _dateTime.UtcNow
            };
            await _estudianteRepository.EnrollMateriaAsync(enrollmentMateria, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
