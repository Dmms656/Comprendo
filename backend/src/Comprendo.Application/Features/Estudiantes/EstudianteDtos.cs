namespace Comprendo.Application.Features.Estudiantes;

public record EstudianteDto(
    int IdEstudiante,
    int? IdUsuario,
    string? Nombres,
    string? Apellidos,
    string? Correo,
    string? CodigoEstudiante,
    string TelefonoTelegram,
    string? TelegramChatId,
    string? TelegramUsername,
    string Estado,
    DateTimeOffset FechaRegistro);
