namespace Comprendo.Application.Common.Models;

public class Result
{
    protected Result(bool succeeded, string? error = null)
    {
        Succeeded = succeeded;
        Error = error;
    }

    public bool Succeeded { get; }

    public string? Error { get; }

    public static Result Success() => new(true);

    public static Result Failure(string error) => new(false, error);

    public static Result<T> Success<T>(T data) => new(data, true);

    public static Result<T> Failure<T>(string error) => new(default, false, error);
}

public class Result<T> : Result
{
    public Result(T? data, bool succeeded, string? error = null)
        : base(succeeded, error)
    {
        Data = data;
    }

    public T? Data { get; }
}
