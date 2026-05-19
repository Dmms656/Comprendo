using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Comprendo.Infrastructure.Persistence.Configurations;

public class ResultadoLeccionConfiguration : IEntityTypeConfiguration<ResultadoLeccion>
{
    public void Configure(EntityTypeBuilder<ResultadoLeccion> builder)
    {
        builder.ToTable("resultados_leccion");

        builder.HasKey(x => x.IdResultado);
        builder.Property(x => x.IdResultado).HasColumnName("id_resultado");
        builder.Property(x => x.IdLeccion).HasColumnName("id_leccion");
        builder.Property(x => x.IdEstudiante).HasColumnName("id_estudiante");
        builder.Property(x => x.TotalPreguntas).HasColumnName("total_preguntas");
        builder.Property(x => x.PreguntasRespondidas).HasColumnName("preguntas_respondidas");
        builder.Property(x => x.RespuestasCorrectas).HasColumnName("respuestas_correctas");
        builder.Property(x => x.RespuestasIncorrectas).HasColumnName("respuestas_incorrectas");
        builder.Property(x => x.PuntajeTotal).HasColumnName("puntaje_total").HasPrecision(6, 2);
        builder.Property(x => x.PuntajeObtenido).HasColumnName("puntaje_obtenido").HasPrecision(6, 2);
        builder.Property(x => x.Porcentaje).HasColumnName("porcentaje").HasPrecision(5, 2);
        builder.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).HasDbEnumConversion<EstadoResultadoLeccion>();
        builder.Property(x => x.FechaInicio).HasColumnName("fecha_inicio");
        builder.Property(x => x.FechaFinalizacion).HasColumnName("fecha_finalizacion");

        builder.HasIndex(x => new { x.IdLeccion, x.IdEstudiante }).IsUnique();

        builder.HasOne(x => x.Leccion).WithMany(x => x.ResultadosLeccion).HasForeignKey(x => x.IdLeccion);
        builder.HasOne(x => x.Estudiante).WithMany(x => x.ResultadosLeccion).HasForeignKey(x => x.IdEstudiante);
    }
}
