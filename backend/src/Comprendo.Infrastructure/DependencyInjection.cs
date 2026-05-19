using Comprendo.Application.Abstractions.Persistence;
using Comprendo.Application.Common.Interfaces;
using Comprendo.Infrastructure.Identity;
using Comprendo.Infrastructure.Persistence;
using Comprendo.Infrastructure.Persistence.Repositories;
using Comprendo.Infrastructure.Options;
using Comprendo.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Comprendo.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));

        services.AddDbContext<ComprendoDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddHttpContextAccessor();

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IAuthRepository, AuthRepository>();
        services.AddScoped<IAcademicoRepository, AcademicoRepository>();
        services.AddScoped<IAsignacionRepository, AsignacionRepository>();
        services.AddScoped<IEstudianteRepository, EstudianteRepository>();
        services.AddScoped<ILeccionRepository, LeccionRepository>();
        services.AddScoped<IPreguntaRepository, PreguntaRepository>();
        services.AddScoped<IResultadoRepository, ResultadoRepository>();
        services.AddScoped<IIntegracionRepository, IntegracionRepository>();
        services.AddScoped<IDashboardRepository, DashboardRepository>();

        services.AddSingleton<IPasswordHasher, Identity.PasswordHasher>();
        services.AddSingleton<IJwtTokenGenerator, Identity.JwtTokenGenerator>();
        services.AddSingleton<IDateTimeProvider, DateTimeProvider>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        return services;
    }
}
