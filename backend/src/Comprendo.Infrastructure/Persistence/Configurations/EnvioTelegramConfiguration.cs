using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Comprendo.Infrastructure.Persistence.Configurations;

public class EnvioTelegramConfiguration : IEntityTypeConfiguration<EnvioTelegram>
{
    public void Configure(EntityTypeBuilder<EnvioTelegram> builder)
    {
        builder.ToTable("envios_telegram");

        builder.HasKey(x => x.IdEnvio);
        builder.Property(x => x.IdEnvio).HasColumnName("id_envio");
        builder.Property(x => x.IdLeccion).HasColumnName("id_leccion");
        builder.Property(x => x.IdPregunta).HasColumnName("id_pregunta");
        builder.Property(x => x.IdEstudiante).HasColumnName("id_estudiante");
        builder.Property(x => x.TelegramChatId).HasColumnName("telegram_chat_id").HasMaxLength(100).IsRequired();
        builder.Property(x => x.MensajeEnviado).HasColumnName("mensaje_enviado");
        builder.Property(x => x.TelegramMessageId).HasColumnName("telegram_message_id").HasMaxLength(100);
        builder.Property(x => x.FechaEnvio).HasColumnName("fecha_envio");
        builder.Property(x => x.EstadoEnvio).HasColumnName("estado_envio").HasMaxLength(20).HasDbEnumConversion<EstadoEnvioTelegram>();
        builder.Property(x => x.ErrorEnvio).HasColumnName("error_envio");

        builder.HasIndex(x => new { x.IdPregunta, x.IdEstudiante }).IsUnique();

        builder.HasOne(x => x.Leccion).WithMany(x => x.EnviosTelegram).HasForeignKey(x => x.IdLeccion);
        builder.HasOne(x => x.Pregunta).WithMany(x => x.EnviosTelegram).HasForeignKey(x => x.IdPregunta);
        builder.HasOne(x => x.Estudiante).WithMany(x => x.EnviosTelegram).HasForeignKey(x => x.IdEstudiante);
        builder.HasOne(x => x.RespuestaEstudiante).WithOne(x => x.EnvioTelegram).HasForeignKey<RespuestaEstudiante>(x => x.IdEnvio);
    }
}
