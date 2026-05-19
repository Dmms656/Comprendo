using Comprendo.Domain.Enums;

namespace Comprendo.Application.Common.Interfaces;

public interface ICurrentUserService
{
    int? UserId { get; }

    int? DocenteId { get; }

    TipoUsuario? TipoUsuario { get; }

    bool IsAuthenticated { get; }
}
