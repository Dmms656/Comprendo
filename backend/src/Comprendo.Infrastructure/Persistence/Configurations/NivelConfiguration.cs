using Comprendo.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Comprendo.Infrastructure.Persistence.Configurations;

public class NivelConfiguration : IEntityTypeConfiguration<Nivel>
{
    public void Configure(EntityTypeBuilder<Nivel> builder)
    {
        builder.ToTable("niveles");

        builder.HasKey(x => x.IdNivel);
        builder.Property(x => x.IdNivel).HasColumnName("id_nivel");
        builder.Property(x => x.Nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
        builder.Property(x => x.Descripcion).HasColumnName("descripcion");

        builder.HasIndex(x => x.Nombre).IsUnique();
    }
}
