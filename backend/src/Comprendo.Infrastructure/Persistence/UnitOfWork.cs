using Comprendo.Application.Common.Interfaces;

namespace Comprendo.Infrastructure.Persistence;

public class UnitOfWork(ComprendoDbContext dbContext) : IUnitOfWork
{
    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        dbContext.SaveChangesAsync(cancellationToken);
}
