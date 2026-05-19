using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Comprendo.Infrastructure.Persistence.Configurations;

public class EstudianteCursoConfiguration : IEntityTypeConfiguration<EstudianteCurso>
{
    public void Configure(EntityTypeBuilder<EstudianteCurso> builder)
    {
        builder.ToTable("estudiante_curso");

        builder.HasKey(x => x.IdEstudianteCurso);
        builder.Property(x => x.IdEstudianteCurso).HasColumnName("id_estudiante_curso");
        builder.Property(x => x.IdEstudiante).HasColumnName("id_estudiante");
        builder.Property(x => x.IdCurso).HasColumnName("id_curso");
        builder.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).HasDbEnumConversion<EstadoAsignacion>();
        builder.Property(x => x.FechaMatricula).HasColumnName("fecha_matricula");

        builder.HasIndex(x => new { x.IdEstudiante, x.IdCurso }).IsUnique();

        builder.HasOne(x => x.Estudiante).WithMany(x => x.EstudianteCursos).HasForeignKey(x => x.IdEstudiante);
        builder.HasOne(x => x.Curso).WithMany(x => x.EstudianteCursos).HasForeignKey(x => x.IdCurso);
    }
}
