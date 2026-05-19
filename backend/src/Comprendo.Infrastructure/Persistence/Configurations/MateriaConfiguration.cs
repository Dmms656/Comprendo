using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Comprendo.Infrastructure.Persistence.Configurations;

public class MateriaConfiguration : IEntityTypeConfiguration<Materia>
{
    public void Configure(EntityTypeBuilder<Materia> builder)
    {
        builder.ToTable("materias");

        builder.HasKey(x => x.IdMateria);
        builder.Property(x => x.IdMateria).HasColumnName("id_materia");
        builder.Property(x => x.Nombre).HasColumnName("nombre").HasMaxLength(120).IsRequired();
        builder.Property(x => x.Descripcion).HasColumnName("descripcion");
        builder.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).HasDbEnumConversion<EstadoMateria>();

        builder.HasIndex(x => x.Nombre).IsUnique();
    }
}
