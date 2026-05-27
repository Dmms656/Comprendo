# Prueba de conexión a Supabase (PostgreSQL)
# Uso:
#   $env:ConnectionStrings__DefaultConnection = "postgresql://postgres:TU_PASSWORD@db.vophfrxqguobngyplrdc.supabase.co:5432/postgres?sslmode=require"
#   .\scripts\test-db-connection.ps1

param(
    [string]$ConnectionString = $env:ConnectionStrings__DefaultConnection
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ConnectionString)) {
    Write-Host "ERROR: Define la cadena de conexión." -ForegroundColor Red
    Write-Host ""
    Write-Host "Ejemplo (reemplaza TU_PASSWORD):" -ForegroundColor Yellow
    Write-Host '  $env:ConnectionStrings__DefaultConnection = "postgresql://postgres:TU_PASSWORD@db.vophfrxqguobngyplrdc.supabase.co:5432/postgres"'
    Write-Host "  .\scripts\test-db-connection.ps1"
    exit 1
}

if ($ConnectionString -match '\[YOUR-PASSWORD\]|TU_PASSWORD') {
    Write-Host "ERROR: Sustituye TU_PASSWORD por la contraseña real de Supabase." -ForegroundColor Red
    exit 1
}

Write-Host "Probando conexión a Supabase..." -ForegroundColor Cyan
if ($ConnectionString -match '@([^/:]+)') {
    Write-Host "(host: $($Matches[1]))" -ForegroundColor DarkGray
}

$project = Join-Path $PSScriptRoot "..\backend\src\Comprendo.Infrastructure\Comprendo.Infrastructure.csproj"
$code = @'
using Npgsql;

static string Normalize(string cs)
{
    if (!cs.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase)
        && !cs.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
        return cs;
    var uri = new Uri(cs);
    var userInfo = uri.UserInfo.Split(':', 2);
    var user = Uri.UnescapeDataString(userInfo[0]);
    var pass = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
    var db = string.IsNullOrEmpty(uri.AbsolutePath.TrimStart('/')) ? "postgres" : uri.AbsolutePath.TrimStart('/');
    var port = uri.Port > 0 ? uri.Port : 5432;
    return $"Host={uri.Host};Port={port};Database={db};Username={user};Password={pass};SSL Mode=Require;Trust Server Certificate=true";
}

var cs = Normalize(Environment.GetEnvironmentVariable("TEST_DB_CONNECTION")!);
await using var conn = new NpgsqlConnection(cs);
await conn.OpenAsync();
await using var cmd = new NpgsqlCommand("SELECT current_database(), current_user, version();", conn);
await using var reader = await cmd.ExecuteReaderAsync();
await reader.ReadAsync();
Console.WriteLine("OK — Conexión exitosa");
Console.WriteLine($"  Base de datos : {reader.GetString(0)}");
Console.WriteLine($"  Usuario       : {reader.GetString(1)}");
Console.WriteLine($"  PostgreSQL    : {reader.GetString(2).Split(",")[0]}");
'@

$tempDir = Join-Path $env:TEMP "comprendo-db-test"
$tempProj = Join-Path $tempDir "DbTest.csproj"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
@'
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Npgsql" Version="10.0.0" />
  </ItemGroup>
</Project>
'@ | Set-Content -Path $tempProj -Encoding UTF8
$code | Set-Content -Path (Join-Path $tempDir "Program.cs") -Encoding UTF8

$env:TEST_DB_CONNECTION = $ConnectionString
Push-Location $tempDir
try {
    dotnet run --verbosity quiet
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Write-Host ""
    Write-Host "La cadena de conexión es válida. Puedes usarla en Render y en appsettings.Local.json" -ForegroundColor Green
}
finally {
    Pop-Location
}
