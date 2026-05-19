using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Comprendo.Infrastructure.Persistence.Configurations;

public class SolicitudIaConfiguration : IEntityTypeConfiguration<SolicitudIa>
{
    public void Configure(EntityTypeBuilder<SolicitudIa> builder)
    {
        builder.ToTable("solicitudes_ia");

        builder.HasKey(x => x.IdSolicitudIa);
        builder.Property(x => x.IdSolicitudIa).HasColumnName("id_solicitud_ia");
        builder.Property(x => x.IdDocente).HasColumnName("id_docente");
        builder.Property(x => x.IdLeccion).HasColumnName("id_leccion");
        builder.Property(x => x.Proveedor).HasColumnName("proveedor").HasMaxLength(50).IsRequired();
        builder.Property(x => x.Modelo).HasColumnName("modelo").HasMaxLength(100);
        builder.Property(x => x.Prompt).HasColumnName("prompt").IsRequired();
        builder.Property(x => x.RespuestaIa).HasColumnName("respuesta_ia");
        builder.Property(x => x.CantidadPreguntasGeneradas).HasColumnName("cantidad_preguntas_generadas");
        builder.Property(x => x.TokensEntrada).HasColumnName("tokens_entrada");
        builder.Property(x => x.TokensSalida).HasColumnName("tokens_salida");
        builder.Property(x => x.FechaSolicitud).HasColumnName("fecha_solicitud");
        builder.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).HasDbEnumConversion<EstadoSolicitudIa>();
        builder.Property(x => x.Error).HasColumnName("error");

        builder.HasOne(x => x.Docente).WithMany(x => x.SolicitudesIa).HasForeignKey(x => x.IdDocente);
        builder.HasOne(x => x.Leccion).WithMany(x => x.SolicitudesIa).HasForeignKey(x => x.IdLeccion);
    }
}
