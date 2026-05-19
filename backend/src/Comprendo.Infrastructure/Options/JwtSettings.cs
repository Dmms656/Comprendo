namespace Comprendo.Infrastructure.Options;

public class JwtSettings
{
    public const string SectionName = "Jwt";

    public string Secret { get; set; } = string.Empty;

    public string Issuer { get; set; } = "Comprendo";

    public string Audience { get; set; } = "Comprendo";

    public int ExpirationMinutes { get; set; } = 480;
}
