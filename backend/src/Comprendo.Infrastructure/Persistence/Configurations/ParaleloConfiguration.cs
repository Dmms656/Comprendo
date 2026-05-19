using Comprendo.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Comprendo.Infrastructure.Persistence.Configurations;

public class ParaleloConfiguration : IEntityTypeConfiguration<Paralelo>
{
    public void Configure(EntityTypeBuilder<Paralelo> builder)
    {
        builder.ToTable("paralelos");

        builder.HasKey(x => x.IdParalelo);
        builder.Property(x => x.IdParalelo).HasColumnName("id_paralelo");
        builder.Property(x => x.Nombre).HasColumnName("nombre").HasMaxLength(10).IsRequired();
        builder.Property(x => x.Descripcion).HasColumnName("descripcion");

        builder.HasIndex(x => x.Nombre).IsUnique();
    }
}
