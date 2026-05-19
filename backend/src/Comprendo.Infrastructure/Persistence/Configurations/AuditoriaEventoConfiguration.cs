using Comprendo.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Comprendo.Infrastructure.Persistence.Configurations;

public class AuditoriaEventoConfiguration : IEntityTypeConfiguration<AuditoriaEvento>
{
    public void Configure(EntityTypeBuilder<AuditoriaEvento> builder)
    {
        builder.ToTable("auditoria_eventos");

        builder.HasKey(x => x.IdEvento);
        builder.Property(x => x.IdEvento).HasColumnName("id_evento");
        builder.Property(x => x.IdUsuario).HasColumnName("id_usuario");
        builder.Property(x => x.Accion).HasColumnName("accion").HasMaxLength(100).IsRequired();
        builder.Property(x => x.Entidad).HasColumnName("entidad").HasMaxLength(100);
        builder.Property(x => x.IdEntidad).HasColumnName("id_entidad");
        builder.Property(x => x.Descripcion).HasColumnName("descripcion");
        builder.Property(x => x.FechaEvento).HasColumnName("fecha_evento");
        builder.Property(x => x.IpOrigen).HasColumnName("ip_origen").HasMaxLength(50);

        builder.HasOne(x => x.Usuario).WithMany(x => x.AuditoriaEventos).HasForeignKey(x => x.IdUsuario);
    }
}
