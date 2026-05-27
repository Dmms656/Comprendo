using System.Text;
using Comprendo.Api.Extensions;
using Comprendo.Api.Middleware;
using Comprendo.Application;
using Comprendo.Infrastructure;
using Comprendo.Infrastructure.Options;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Credenciales locales (gitignore). Ruta explícita al proyecto, no a bin/Debug.
var localSettings = Path.Combine(builder.Environment.ContentRootPath, "appsettings.Local.json");
builder.Configuration.AddJsonFile(localSettings, optional: true, reloadOnChange: true);

// Render / Supabase: la BD se configura solo con variables de entorno (no en JSON).
// Prioridad: ConnectionStrings__DefaultConnection (recomendado) → DATABASE_URL (alias).
var connectionFromEnv =
    Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? Environment.GetEnvironmentVariable("DATABASE_URL");

if (!string.IsNullOrWhiteSpace(connectionFromEnv))
{
    builder.Configuration["ConnectionStrings:DefaultConnection"] =
        Comprendo.Api.ConnectionStringHelper.Normalize(connectionFromEnv);
}
else
{
    var fromConfig = builder.Configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrWhiteSpace(fromConfig))
    {
        builder.Configuration["ConnectionStrings:DefaultConnection"] =
            Comprendo.Api.ConnectionStringHelper.Normalize(fromConfig);
    }
}

if (builder.Environment.IsProduction()
    && string.IsNullOrWhiteSpace(builder.Configuration.GetConnectionString("DefaultConnection")))
{
    throw new InvalidOperationException(
        "Configure ConnectionStrings__DefaultConnection o DATABASE_URL en las variables de entorno de Render.");
}

// Servicio API solo en Render: usa PORT. En despliegue unificado, ASPNETCORE_URLS apunta a 127.0.0.1:8080.
if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ASPNETCORE_URLS")))
{
    var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
});

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddControllers();
builder.Services.AddSwaggerWithJwt();

var corsOrigins = builder.Configuration["CORS_ALLOWED_ORIGINS"]
    ?? Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS")
    ?? "http://localhost:3000,http://localhost:3001";

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(corsOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var jwtSettings = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()
    ?? throw new InvalidOperationException("Jwt configuration is required.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Comprendo API v1");
        options.RoutePrefix = string.Empty;
    });
}

app.UseForwardedHeaders();
app.UseCors("AllowFrontend");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseMiddleware<IntegracionApiKeyMiddleware>();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "comprendo-api" }));

app.Run();
