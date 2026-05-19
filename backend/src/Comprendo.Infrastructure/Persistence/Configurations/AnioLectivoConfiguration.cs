using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Comprendo.Infrastructure.Persistence.Configurations;

public class AnioLectivoConfiguration : IEntityTypeConfiguration<AnioLectivo>
{
    public void Configure(EntityTypeBuilder<AnioLectivo> builder)
    {
        builder.ToTable("anios_lectivos");

        builder.HasKey(x => x.IdAnioLectivo);
        builder.Property(x => x.IdAnioLectivo).HasColumnName("id_anio_lectivo");
        builder.Property(x => x.Nombre).HasColumnName("nombre").HasMaxLength(20).IsRequired();
        builder.Property(x => x.FechaInicio).HasColumnName("fecha_inicio");
        builder.Property(x => x.FechaFin).HasColumnName("fecha_fin");
        builder.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).HasDbEnumConversion<EstadoAnioLectivo>();

        builder.HasIndex(x => x.Nombre).IsUnique();
    }
}
