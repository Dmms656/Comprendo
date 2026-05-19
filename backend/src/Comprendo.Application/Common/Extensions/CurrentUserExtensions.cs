using Comprendo.Application.Common.Interfaces;
using Comprendo.Domain.Exceptions;

namespace Comprendo.Application.Common.Extensions;

public static class CurrentUserExtensions
{
    public static int RequireUserId(this ICurrentUserService currentUser)
    {
        if (!currentUser.IsAuthenticated || currentUser.UserId is null)
        {
            throw new ForbiddenException();
        }

        return currentUser.UserId.Value;
    }

    public static int RequireDocenteId(this ICurrentUserService currentUser)
    {
        if (!currentUser.IsAuthenticated || currentUser.DocenteId is null)
        {
            throw new ForbiddenException("A docente account is required for this operation.");
        }

        return currentUser.DocenteId.Value;
    }
}
