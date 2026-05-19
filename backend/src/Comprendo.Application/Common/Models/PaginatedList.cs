namespace Comprendo.Application.Common.Models;

public class PaginatedList<T>
{
    public PaginatedList(IReadOnlyList<T> items, int count, int pageNumber, int pageSize)
    {
        Items = items;
        TotalCount = count;
        PageNumber = pageNumber;
        PageSize = pageSize;
        TotalPages = pageSize > 0 ? (int)Math.Ceiling(count / (double)pageSize) : 0;
    }

    public IReadOnlyList<T> Items { get; }

    public int PageNumber { get; }

    public int TotalPages { get; }

    public int TotalCount { get; }

    public int PageSize { get; }

    public bool HasPreviousPage => PageNumber > 1;

    public bool HasNextPage => PageNumber < TotalPages;

    public static PaginatedList<T> Create(IEnumerable<T> source, int count, int pageNumber, int pageSize)
    {
        var items = source.ToList();
        return new PaginatedList<T>(items, count, pageNumber, pageSize);
    }
}
