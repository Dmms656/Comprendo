using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Comprendo.Infrastructure.Persistence.Configurations;

public class EstudianteMateriaConfiguration : IEntityTypeConfiguration<EstudianteMateria>
{
    public void Configure(EntityTypeBuilder<EstudianteMateria> builder)
    {
        builder.ToTable("estudiante_materia");

        builder.HasKey(x => x.IdEstudianteMateria);
        builder.Property(x => x.IdEstudianteMateria).HasColumnName("id_estudiante_materia");
        builder.Property(x => x.IdEstudiante).HasColumnName("id_estudiante");
        builder.Property(x => x.IdDocenteCursoMateria).HasColumnName("id_docente_curso_materia");
        builder.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).HasDbEnumConversion<EstadoAsignacion>();
        builder.Property(x => x.FechaRegistro).HasColumnName("fecha_registro");

        builder.HasIndex(x => new { x.IdEstudiante, x.IdDocenteCursoMateria }).IsUnique();

        builder.HasOne(x => x.Estudiante).WithMany(x => x.EstudianteMaterias).HasForeignKey(x => x.IdEstudiante);
        builder.HasOne(x => x.DocenteCursoMateria).WithMany(x => x.EstudianteMaterias).HasForeignKey(x => x.IdDocenteCursoMateria);
    }
}
