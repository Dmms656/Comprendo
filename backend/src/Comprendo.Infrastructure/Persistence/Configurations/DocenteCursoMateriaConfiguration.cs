using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Comprendo.Infrastructure.Persistence.Configurations;

public class DocenteCursoMateriaConfiguration : IEntityTypeConfiguration<DocenteCursoMateria>
{
    public void Configure(EntityTypeBuilder<DocenteCursoMateria> builder)
    {
        builder.ToTable("docente_curso_materia");

        builder.HasKey(x => x.IdDocenteCursoMateria);
        builder.Property(x => x.IdDocenteCursoMateria).HasColumnName("id_docente_curso_materia");
        builder.Property(x => x.IdDocente).HasColumnName("id_docente");
        builder.Property(x => x.IdCurso).HasColumnName("id_curso");
        builder.Property(x => x.IdMateria).HasColumnName("id_materia");
        builder.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).HasDbEnumConversion<EstadoAsignacion>();
        builder.Property(x => x.FechaAsignacion).HasColumnName("fecha_asignacion");

        builder.HasIndex(x => new { x.IdDocente, x.IdCurso, x.IdMateria }).IsUnique();

        builder.HasOne(x => x.Docente).WithMany(x => x.DocenteCursoMaterias).HasForeignKey(x => x.IdDocente);
        builder.HasOne(x => x.Curso).WithMany(x => x.DocenteCursoMaterias).HasForeignKey(x => x.IdCurso);
        builder.HasOne(x => x.Materia).WithMany(x => x.DocenteCursoMaterias).HasForeignKey(x => x.IdMateria);
    }
}
