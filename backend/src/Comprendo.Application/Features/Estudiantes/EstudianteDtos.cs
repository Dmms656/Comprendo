namespace Comprendo.Application.Features.Estudiantes;

public record EstudianteDto(
    int IdEstudiante,
    int? IdUsuario,
    string? CodigoEstudiante,
    string TelefonoTelegram,
    string? TelegramChatId,
    string? TelegramUsername,
    string Estado,
    DateTimeOffset FechaRegistro);
