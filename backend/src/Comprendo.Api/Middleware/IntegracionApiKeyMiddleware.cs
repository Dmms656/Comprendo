using Microsoft.AspNetCore.Mvc;

namespace Comprendo.Api.Middleware;

public class IntegracionApiKeyMiddleware(
    RequestDelegate next,
    IConfiguration configuration)
{
    public const string HeaderName = "X-Integration-Api-Key";

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Path.StartsWithSegments("/api/integracion", StringComparison.OrdinalIgnoreCase))
        {
            await next(context);
            return;
        }

        var expectedKey = configuration["Integration:ApiKey"];
        if (string.IsNullOrWhiteSpace(expectedKey))
        {
            context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = StatusCodes.Status503ServiceUnavailable,
                Title = "Integration API key is not configured."
            });
            return;
        }

        if (!context.Request.Headers.TryGetValue(HeaderName, out var providedKey)
            || !string.Equals(providedKey.ToString(), expectedKey, StringComparison.Ordinal))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Invalid or missing integration API key.",
                Detail = $"Provide a valid key in the {HeaderName} header."
            });
            return;
        }

        await next(context);
    }
}
