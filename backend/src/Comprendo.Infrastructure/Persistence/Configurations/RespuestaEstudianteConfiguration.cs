using Comprendo.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Comprendo.Infrastructure.Persistence.Configurations;

public class RespuestaEstudianteConfiguration : IEntityTypeConfiguration<RespuestaEstudiante>
{
    public void Configure(EntityTypeBuilder<RespuestaEstudiante> builder)
    {
        builder.ToTable("respuestas_estudiantes");

        builder.HasKey(x => x.IdRespuesta);
        builder.Property(x => x.IdRespuesta).HasColumnName("id_respuesta");
        builder.Property(x => x.IdEnvio).HasColumnName("id_envio");
        builder.Property(x => x.IdEstudiante).HasColumnName("id_estudiante");
        builder.Property(x => x.IdPregunta).HasColumnName("id_pregunta");
        builder.Property(x => x.RespuestaTexto).HasColumnName("respuesta_texto").IsRequired();
        builder.Property(x => x.EsCorrecta).HasColumnName("es_correcta");
        builder.Property(x => x.PuntajeObtenido).HasColumnName("puntaje_obtenido").HasPrecision(5, 2);
        builder.Property(x => x.FechaRespuesta).HasColumnName("fecha_respuesta");
        builder.Property(x => x.TiempoRespuestaSegundos).HasColumnName("tiempo_respuesta_segundos");
        builder.Property(x => x.EvaluadaPorIa).HasColumnName("evaluada_por_ia");
        builder.Property(x => x.Retroalimentacion).HasColumnName("retroalimentacion");

        builder.HasIndex(x => x.IdEnvio).IsUnique();

        builder.HasOne(x => x.Estudiante).WithMany(x => x.RespuestasEstudiante).HasForeignKey(x => x.IdEstudiante);
        builder.HasOne(x => x.Pregunta).WithMany(x => x.RespuestasEstudiante).HasForeignKey(x => x.IdPregunta);
    }
}
