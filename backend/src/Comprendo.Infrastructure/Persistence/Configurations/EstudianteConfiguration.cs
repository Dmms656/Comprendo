using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Comprendo.Infrastructure.Persistence.Configurations;

public class EstudianteConfiguration : IEntityTypeConfiguration<Estudiante>
{
    public void Configure(EntityTypeBuilder<Estudiante> builder)
    {
        builder.ToTable("estudiantes");

        builder.HasKey(x => x.IdEstudiante);
        builder.Property(x => x.IdEstudiante).HasColumnName("id_estudiante");
        builder.Property(x => x.IdUsuario).HasColumnName("id_usuario");
        builder.Property(x => x.CodigoEstudiante).HasColumnName("codigo_estudiante").HasMaxLength(50);
        builder.Property(x => x.TelefonoTelegram).HasColumnName("telefono_telegram").HasMaxLength(20).IsRequired();
        builder.Property(x => x.TelegramChatId).HasColumnName("telegram_chat_id").HasMaxLength(100);
        builder.Property(x => x.TelegramUsername).HasColumnName("telegram_username").HasMaxLength(100);
        builder.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).HasDbEnumConversion<EstadoEstudiante>();
        builder.Property(x => x.FechaRegistro).HasColumnName("fecha_registro");

        builder.HasIndex(x => x.TelefonoTelegram).IsUnique();
        builder.HasIndex(x => x.TelegramChatId).IsUnique();
    }
}
