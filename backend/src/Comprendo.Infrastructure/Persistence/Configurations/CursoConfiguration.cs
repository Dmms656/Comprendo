using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Comprendo.Infrastructure.Persistence.Configurations;

public class CursoConfiguration : IEntityTypeConfiguration<Curso>
{
    public void Configure(EntityTypeBuilder<Curso> builder)
    {
        builder.ToTable("cursos");

        builder.HasKey(x => x.IdCurso);
        builder.Property(x => x.IdCurso).HasColumnName("id_curso");
        builder.Property(x => x.IdAnioLectivo).HasColumnName("id_anio_lectivo");
        builder.Property(x => x.IdNivel).HasColumnName("id_nivel");
        builder.Property(x => x.IdParalelo).HasColumnName("id_paralelo");
        builder.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).HasDbEnumConversion<EstadoCurso>();

        builder.HasIndex(x => new { x.IdAnioLectivo, x.IdNivel, x.IdParalelo }).IsUnique();

        builder.HasOne(x => x.AnioLectivo).WithMany(x => x.Cursos).HasForeignKey(x => x.IdAnioLectivo);
        builder.HasOne(x => x.Nivel).WithMany(x => x.Cursos).HasForeignKey(x => x.IdNivel);
        builder.HasOne(x => x.Paralelo).WithMany(x => x.Cursos).HasForeignKey(x => x.IdParalelo);
    }
}
