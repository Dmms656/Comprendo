# Imagen para despliegue en Render (Docker). Requiere .NET 10.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Comprendo.slnx ./
COPY src/Comprendo.Api/Comprendo.Api.csproj src/Comprendo.Api/
COPY src/Comprendo.Application/Comprendo.Application.csproj src/Comprendo.Application/
COPY src/Comprendo.Domain/Comprendo.Domain.csproj src/Comprendo.Domain/
COPY src/Comprendo.Infrastructure/Comprendo.Infrastructure.csproj src/Comprendo.Infrastructure/

RUN dotnet restore src/Comprendo.Api/Comprendo.Api.csproj

COPY src/ src/
RUN dotnet publish src/Comprendo.Api/Comprendo.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

ENTRYPOINT ["dotnet", "Comprendo.Api.dll"]
