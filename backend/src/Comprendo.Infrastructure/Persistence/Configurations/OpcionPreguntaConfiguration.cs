using Comprendo.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Comprendo.Infrastructure.Persistence.Configurations;

public class OpcionPreguntaConfiguration : IEntityTypeConfiguration<OpcionPregunta>
{
    public void Configure(EntityTypeBuilder<OpcionPregunta> builder)
    {
        builder.ToTable("opciones_pregunta");

        builder.HasKey(x => x.IdOpcion);
        builder.Property(x => x.IdOpcion).HasColumnName("id_opcion");
        builder.Property(x => x.IdPregunta).HasColumnName("id_pregunta");
        builder.Property(x => x.Literal).HasColumnName("literal").HasMaxLength(5).IsRequired();
        builder.Property(x => x.Texto).HasColumnName("texto").IsRequired();
        builder.Property(x => x.EsCorrecta).HasColumnName("es_correcta");

        builder.HasIndex(x => new { x.IdPregunta, x.Literal }).IsUnique();

        builder.HasOne(x => x.Pregunta).WithMany(x => x.OpcionesPregunta).HasForeignKey(x => x.IdPregunta);
    }
}
