# Comprendo API (.NET)

Backend principal de la plataforma Comprendo con **Clean Architecture**, **PostgreSQL**, **JWT** y **Swagger** como documentación interactiva.

Se comunica con el bot de integración (Node.js) a través de endpoints protegidos por API Key bajo `/api/integracion`, sin necesidad de credenciales JWT para esa capa.

## Estructura

```text
backend/
├── Comprendo.slnx
└── src/
    ├── Comprendo.Domain/           # Entidades, enums, excepciones de dominio
    ├── Comprendo.Application/      # Casos de uso (MediatR/CQRS), DTOs, validación
    ├── Comprendo.Infrastructure/   # EF Core, repositorios, JWT, hash
    └── Comprendo.Api/              # Controllers, Swagger, middleware, Program.cs
```

### Dependencias entre capas

```text
Api → Application → Domain
Api → Infrastructure → Application → Domain
```

## Requisitos

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- PostgreSQL con el esquema aplicado (`../database/schema.sql` y opcionalmente `../database/seed.sql`)

## Configuración

Copia la plantilla local (no se sube a Git):

```bash
copy src\Comprendo.Api\appsettings.Local.json.example src\Comprendo.Api\appsettings.Local.json
```

El archivo `appsettings.Local.json` define la cadena de conexión a la base de datos **COMPRENDO** y está excluido del repositorio por `.gitignore`.

`appsettings.Development.json` contiene la configuración de JWT e integración para el entorno de desarrollo:

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

En desarrollo, Swagger UI está disponible en la raíz: `http://localhost:5253`

### Credenciales demo (tras aplicar `seed.sql`)

- **Correo:** `docente@comprendo.local`
- **Contraseña:** `comprendo123`

En Swagger: `POST /api/auth/login` → copiar `token` → **Authorize** → `Bearer {token}`.

## API principal

| Área | Ruta base | Auth |
|---|---|---|
| Autenticación | `/api/auth` | Público |
| Dashboard | `/api/dashboard` | JWT `DOCENTE` |
| Catálogo académico | `/api/academico/*` | JWT `ADMIN` o `DOCENTE` |
| Asignaciones | `/api/asignaciones` | JWT `DOCENTE` |
| Estudiantes | `/api/estudiantes` | JWT `DOCENTE` |
| Lecciones | `/api/lecciones` | JWT `DOCENTE` |
| Preguntas | `/api/lecciones/{id}/preguntas` | JWT `DOCENTE` |
| Resultados | `/api/lecciones/{id}/resultados` | JWT `DOCENTE` |

## Integración con el Bot de Telegram

Los endpoints bajo `/api/integracion` son consumidos exclusivamente por el bot de integración (Node.js) y **no usan JWT**. Requieren el siguiente header:

```http
X-Integration-Api-Key: dev-integration-api-key
```

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/integracion/envios` | Registrar envío de pregunta por Telegram |
| POST | `/api/integracion/respuestas` | Registrar respuesta del estudiante |
| POST | `/api/integracion/solicitudes-ia` | Auditar solicitud realizada a la IA |
| POST | `/api/integracion/vincular-estudiante` | Vincular estudiante por número de teléfono |
| POST | `/api/integracion/vincular-estudiante-codigo` | Vincular e inscribir estudiante por código de acceso de materia |

## Compilar

```bash
cd backend
dotnet build
```

## Patrones aplicados

- **CQRS** con MediatR (comandos y queries separados por feature)
- **FluentValidation** en pipeline de MediatR (validación antes de cada handler)
- **Repositorios** definidos en Application, implementados en Infrastructure
- **Excepciones de dominio** mapeadas a `ProblemDetails` HTTP (404, 403, 409)
- **EF Core** con mapeo a tablas PostgreSQL en `snake_case`
