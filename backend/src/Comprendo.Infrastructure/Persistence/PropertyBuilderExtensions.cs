using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Comprendo.Infrastructure.Persistence;

internal static class PropertyBuilderExtensions
{
    public static PropertyBuilder<TEnum> HasDbEnumConversion<TEnum>(this PropertyBuilder<TEnum> builder)
        where TEnum : struct, Enum =>
        builder.HasConversion(
            v => EnumConverters.ToDatabase(v),
            v => EnumConverters.FromDatabase<TEnum>(v));
}
