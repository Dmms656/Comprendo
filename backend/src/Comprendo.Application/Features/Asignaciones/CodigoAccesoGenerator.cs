using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Domain.Exceptions;
using System.Security.Cryptography;
using System.Text;

namespace Comprendo.Application.Features.Asignaciones;

public static class CodigoAccesoGenerator
{
    public static async Task<string> GenerateUniqueAsync(
        IAsignacionRepository repository,
        CancellationToken cancellationToken = default)
    {
        for (var retries = 0; retries < 10; retries++)
        {
            var codigo = GenerateRandomCode(6);
            var existing = await repository.GetByCodigoAccesoAsync(codigo, cancellationToken);
            if (existing is null)
            {
                return codigo;
            }
        }

        throw new ConflictException("No se pudo generar un código único.");
    }

    private static string GenerateRandomCode(int length)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var result = new StringBuilder(length);
        for (var i = 0; i < length; i++)
        {
            result.Append(chars[RandomNumberGenerator.GetInt32(chars.Length)]);
        }

        return result.ToString();
    }
}
