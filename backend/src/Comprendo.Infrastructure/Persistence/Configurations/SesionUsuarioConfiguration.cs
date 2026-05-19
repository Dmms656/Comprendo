using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Comprendo.Infrastructure.Persistence.Configurations;

public class SesionUsuarioConfiguration : IEntityTypeConfiguration<SesionUsuario>
{
    public void Configure(EntityTypeBuilder<SesionUsuario> builder)
    {
        builder.ToTable("sesiones_usuario");

        builder.HasKey(x => x.IdSesion);
        builder.Property(x => x.IdSesion).HasColumnName("id_sesion");
        builder.Property(x => x.IdUsuario).HasColumnName("id_usuario");
        builder.Property(x => x.TokenHash).HasColumnName("token_hash").IsRequired();
        builder.Property(x => x.FechaInicio).HasColumnName("fecha_inicio");
        builder.Property(x => x.FechaExpiracion).HasColumnName("fecha_expiracion");
        builder.Property(x => x.IpOrigen).HasColumnName("ip_origen").HasMaxLength(50);
        builder.Property(x => x.UserAgent).HasColumnName("user_agent");
        builder.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).HasDbEnumConversion<EstadoSesion>();

        builder.HasOne(x => x.Usuario).WithMany(x => x.Sesiones).HasForeignKey(x => x.IdUsuario);
    }
}
