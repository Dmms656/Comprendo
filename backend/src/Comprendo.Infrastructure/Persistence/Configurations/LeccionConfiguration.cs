using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Comprendo.Infrastructure.Persistence.Configurations;

public class LeccionConfiguration : IEntityTypeConfiguration<Leccion>
{
    public void Configure(EntityTypeBuilder<Leccion> builder)
    {
        builder.ToTable("lecciones");

        builder.HasKey(x => x.IdLeccion);
        builder.Property(x => x.IdLeccion).HasColumnName("id_leccion");
        builder.Property(x => x.IdDocenteCursoMateria).HasColumnName("id_docente_curso_materia");
        builder.Property(x => x.Titulo).HasColumnName("titulo").HasMaxLength(150).IsRequired();
        builder.Property(x => x.Descripcion).HasColumnName("descripcion");
        builder.Property(x => x.Tema).HasColumnName("tema").HasMaxLength(150);
        builder.Property(x => x.NumeroPreguntas).HasColumnName("numero_preguntas");
        builder.Property(x => x.FechaCreacion).HasColumnName("fecha_creacion");
        builder.Property(x => x.FechaProgramada).HasColumnName("fecha_programada");
        builder.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).HasDbEnumConversion<EstadoLeccion>();
        builder.Property(x => x.CreadaConIa).HasColumnName("creada_con_ia");

        builder.HasOne(x => x.DocenteCursoMateria).WithMany(x => x.Lecciones).HasForeignKey(x => x.IdDocenteCursoMateria);
    }
}
