using Comprendo.Domain.Entities;
using Comprendo.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Comprendo.Infrastructure.Persistence.Configurations;

public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("usuarios");

        builder.HasKey(x => x.IdUsuario);
        builder.Property(x => x.IdUsuario).HasColumnName("id_usuario");
        builder.Property(x => x.Nombres).HasColumnName("nombres").HasMaxLength(100).IsRequired();
        builder.Property(x => x.Apellidos).HasColumnName("apellidos").HasMaxLength(100).IsRequired();
        builder.Property(x => x.Correo).HasColumnName("correo").HasMaxLength(150).IsRequired();
        builder.Property(x => x.Telefono).HasColumnName("telefono").HasMaxLength(20);
        builder.Property(x => x.PasswordHash).HasColumnName("password_hash");
        builder.Property(x => x.TipoUsuario).HasColumnName("tipo_usuario").HasMaxLength(20).HasDbEnumConversion<TipoUsuario>();
        builder.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).HasDbEnumConversion<EstadoUsuario>();
        builder.Property(x => x.FechaCreacion).HasColumnName("fecha_creacion");

        builder.HasIndex(x => x.Correo).IsUnique();

        builder.HasOne(x => x.Docente).WithOne(x => x.Usuario).HasForeignKey<Docente>(x => x.IdUsuario);
        builder.HasOne(x => x.Estudiante).WithOne(x => x.Usuario).HasForeignKey<Estudiante>(x => x.IdUsuario);
    }
}
