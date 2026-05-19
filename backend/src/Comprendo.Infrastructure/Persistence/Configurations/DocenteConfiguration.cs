using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Comprendo.Infrastructure.Persistence.Configurations;

public class DocenteConfiguration : IEntityTypeConfiguration<Docente>
{
    public void Configure(EntityTypeBuilder<Docente> builder)
    {
        builder.ToTable("docentes");

        builder.HasKey(x => x.IdDocente);
        builder.Property(x => x.IdDocente).HasColumnName("id_docente");
        builder.Property(x => x.IdUsuario).HasColumnName("id_usuario");
        builder.Property(x => x.TituloProfesional).HasColumnName("titulo_profesional").HasMaxLength(150);
        builder.Property(x => x.Especialidad).HasColumnName("especialidad").HasMaxLength(150);
        builder.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).HasDbEnumConversion<EstadoDocente>();

        builder.HasIndex(x => x.IdUsuario).IsUnique();
    }
}
