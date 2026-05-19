using System.Text;

namespace Comprendo.Infrastructure.Persistence;

public static class EnumConverters
{
    public static string ToDatabase<T>(T value) where T : struct, Enum
    {
        var name = value.ToString();
        if (name.Length == 0)
        {
            return name;
        }

        var sb = new StringBuilder(name.Length + 4);
        for (var i = 0; i < name.Length; i++)
        {
            if (i > 0 && char.IsUpper(name[i]))
            {
                sb.Append('_');
            }

            sb.Append(char.ToUpperInvariant(name[i]));
        }

        return sb.ToString();
    }

    public static T FromDatabase<T>(string value) where T : struct, Enum
    {
        var parts = value.Split('_', StringSplitOptions.RemoveEmptyEntries);
        var pascal = string.Concat(parts.Select(static part =>
        {
            var lower = part.ToLowerInvariant();
            return char.ToUpperInvariant(lower[0]) + lower[1..];
        }));

        return Enum.Parse<T>(pascal, ignoreCase: false);
    }
}
