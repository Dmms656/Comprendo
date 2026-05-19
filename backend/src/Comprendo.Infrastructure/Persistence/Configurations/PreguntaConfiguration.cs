using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Comprendo.Infrastructure.Persistence.Configurations;

public class PreguntaConfiguration : IEntityTypeConfiguration<Pregunta>
{
    public void Configure(EntityTypeBuilder<Pregunta> builder)
    {
        builder.ToTable("preguntas");

        builder.HasKey(x => x.IdPregunta);
        builder.Property(x => x.IdPregunta).HasColumnName("id_pregunta");
        builder.Property(x => x.IdLeccion).HasColumnName("id_leccion");
        builder.Property(x => x.Enunciado).HasColumnName("enunciado").IsRequired();
        builder.Property(x => x.TipoPregunta).HasColumnName("tipo_pregunta").HasMaxLength(30).HasDbEnumConversion<TipoPregunta>();
        builder.Property(x => x.RespuestaCorrecta).HasColumnName("respuesta_correcta");
        builder.Property(x => x.Explicacion).HasColumnName("explicacion");
        builder.Property(x => x.Puntaje).HasColumnName("puntaje").HasPrecision(5, 2);
        builder.Property(x => x.Orden).HasColumnName("orden");
        builder.Property(x => x.GeneradaPorIa).HasColumnName("generada_por_ia");
        builder.Property(x => x.IdSolicitudIa).HasColumnName("id_solicitud_ia");
        builder.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).HasDbEnumConversion<EstadoPregunta>();

        builder.HasIndex(x => new { x.IdLeccion, x.Orden }).IsUnique();

        builder.HasOne(x => x.Leccion).WithMany(x => x.Preguntas).HasForeignKey(x => x.IdLeccion);
        builder.HasOne(x => x.SolicitudIa).WithMany(x => x.Preguntas).HasForeignKey(x => x.IdSolicitudIa);
    }
}
