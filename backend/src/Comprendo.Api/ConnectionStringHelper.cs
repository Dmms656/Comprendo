namespace Comprendo.Api;

/// <summary>
/// Npgsql no acepta bien la URI postgresql:// de Supabase tal cual.
/// Convierte a formato clave=valor con SSL para conexión directa (puerto 5432).
/// </summary>
internal static class ConnectionStringHelper
{
    public static string? Normalize(string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            return connectionString;

        if (!connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase)
            && !connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
        {
            return connectionString;
        }

        var uri = new Uri(connectionString);
        var userInfo = uri.UserInfo.Split(':', 2);
        var username = Uri.UnescapeDataString(userInfo[0]);
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty;
        var database = uri.AbsolutePath.TrimStart('/');
        if (string.IsNullOrEmpty(database))
            database = "postgres";

        var port = uri.Port > 0 ? uri.Port : 5432;

        return $"Host={uri.Host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
    }
}
