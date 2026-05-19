# Comprendo API (.NET)

Backend de la plataforma Comprendo con **arquitectura limpia**, **PostgreSQL**, **JWT** y **Swagger** como documentación viva.

No incluye integración con Telegram ni llamadas a APIs de IA: eso lo consumen otros servicios mediante los endpoints de **integración** (API key).

## Estructura

```text
backend/
├── Comprendo.sln
└── src/
    ├── Comprendo.Domain/          # Entidades, enums, excepciones de dominio
    ├── Comprendo.Application/     # Casos de uso (MediatR), DTOs, validación
    ├── Comprendo.Infrastructure/ # EF Core, repositorios, JWT, hash
    └── Comprendo.Api/            # Controllers, Swagger, middleware
```

### Dependencias entre capas

```text
Api → Application → Domain
Api → Infrastructure → Application → Domain
```

## Requisitos

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- PostgreSQL con el esquema aplicado (`../database/schema.sql` y opcionalmente `seed.sql`)

## Configuración

Copia la plantilla local (no se sube a Git) y ajusta tu contraseña de PostgreSQL si no es `postgres`:

```bash
copy src\Comprendo.Api\appsettings.Local.json.example src\Comprendo.Api\appsettings.Local.json
```

El archivo `appsettings.Local.json` define la conexión a tu base **COMPRENDO** y está en `.gitignore`.

`appsettings.Development.json` conserva JWT e integración:

```json
{
  "Jwt": {
    "Secret": "dev_secret_key_minimum_32_characters_long",
    "Issuer": "Comprendo",
    "Audience": "Comprendo.Api",
    "ExpirationMinutes": 480
  },
  "Integration": {
    "ApiKey": "dev-integration-api-key"
  }
}
```

## Ejecutar

```bash
cd backend
dotnet restore
dotnet run --project src/Comprendo.Api
```

En desarrollo, Swagger UI está en la raíz: `http://localhost:5253` (puerto según `launchSettings.json`).

### Login demo (tras `seed.sql`)

- **Correo:** `docente@comprendo.local`
- **Contraseña:** `comprendo123`

En Swagger: `POST /api/auth/login` → copiar `token` → **Authorize** → `Bearer {token}`.

## API principal

| Área | Ruta base | Auth |
|------|-----------|------|
| Auth | `/api/auth` | Público (login) |
| Dashboard | `/api/dashboard` | JWT `DOCENTE` |
| Catálogo académico | `/api/academico/*` | JWT `ADMIN` o `DOCENTE` |
| Asignaciones | `/api/asignaciones` | JWT `DOCENTE` |
| Estudiantes | `/api/estudiantes` | JWT `DOCENTE` |
| Lecciones | `/api/lecciones` | JWT `DOCENTE` |
| Preguntas | `/api/lecciones/{id}/preguntas` | JWT `DOCENTE` |
| Resultados | `/api/lecciones/{id}/resultados` | JWT `DOCENTE` |

## Integración (otro equipo: Telegram / IA)

Rutas bajo `/api/integracion` **no usan JWT**. Header obligatorio:

```http
X-Integration-Api-Key: dev-integration-api-key
```

| Método | Ruta | Uso |
|--------|------|-----|
| POST | `/api/integracion/envios` | Registrar envío Telegram |
| POST | `/api/integracion/respuestas` | Registrar respuesta del estudiante |
| POST | `/api/integracion/solicitudes-ia` | Auditar solicitud de IA |

## Compilar

```bash
dotnet build
```

## Patrones usados

- **CQRS** con MediatR (comandos y consultas por feature)
- **FluentValidation** en pipeline de MediatR
- **Repositorios** definidos en Application, implementados en Infrastructure
- **Excepciones de dominio** → `ProblemDetails` HTTP (404, 403, 409)
- **EF Core** con mapeo a tablas PostgreSQL (`snake_case`)
