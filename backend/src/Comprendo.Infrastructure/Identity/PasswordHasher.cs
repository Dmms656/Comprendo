using System.Security.Cryptography;
using System.Text;
using Comprendo.Application.Common.Interfaces;

namespace Comprendo.Infrastructure.Identity;

public class PasswordHasher : IPasswordHasher
{
    public string Hash(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public bool Verify(string password, string passwordHash) =>
        string.Equals(Hash(password), passwordHash, StringComparison.OrdinalIgnoreCase);
}
