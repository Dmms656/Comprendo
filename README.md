# Comprendo — Plataforma de evaluaciones formativas por Telegram

**Comprendo** es una plataforma educativa que permite a los docentes enviar evaluaciones formativas a sus estudiantes a través de **Telegram**, con preguntas generadas por **Inteligencia Artificial**, y visualizar los resultados en tiempo real desde un **panel web**.

El sistema está compuesto por tres servicios desacoplados:

| Servicio | Tecnología | Descripción |
|---|---|---|
| **API principal** | .NET 10 / ASP.NET Core | Lógica de negocio, autenticación JWT, persistencia PostgreSQL |
| **Bot de integración** | Node.js / Express | Interacción con estudiantes por Telegram y generación de preguntas con IA |
| **Panel docente** | Next.js / React / TypeScript | Dashboard web para gestión de lecciones, preguntas y resultados |

---

## Estructura de carpetas

```
Comprendo/
├── backend/                    # API principal (.NET — Clean Architecture)
│   └── src/
│       ├── Comprendo.Api/          # Controladores, Swagger, middleware, Program.cs
│       ├── Comprendo.Application/  # Casos de uso (CQRS/MediatR), DTOs, validación
│       ├── Comprendo.Domain/       # Entidades, enums, excepciones de dominio
│       └── Comprendo.Infrastructure/ # EF Core, repositorios, JWT, hash de contraseñas
├── frontend/                   # Panel docente (Next.js + React + TypeScript)
│   ├── app/                    # Páginas y rutas (App Router de Next.js)
│   ├── components/             # Componentes reutilizables de UI
│   ├── hooks/                  # Custom hooks de React
│   └── lib/                    # Utilidades y configuración de cliente API
├── integration-bot/            # Bot de Telegram + generación con IA (Node.js)
│   └── src/
│       ├── index.js            # Servidor Express + lógica del bot de Telegram
│       └── services/           # Servicio de generación de preguntas (Groq / Gemini)
├── database/                   # Scripts SQL de PostgreSQL
│   ├── schema.sql              # Esquema completo (tablas, triggers, vistas, funciones)
│   ├── seed.sql                # Datos de prueba para entorno de desarrollo
│   └── migrations/             # Scripts de migración incremental
├── deploy/                     # Configuración de despliegue en producción
│   ├── Dockerfile              # Imagen unificada (API + bot + frontend con nginx)
│   ├── nginx.conf.template     # Configuración del proxy inverso
│   └── supervisord.conf        # Orquestación de los tres procesos en un solo contenedor
├── docs/                       # Documentación complementaria
│   └── DEPLOY.md               # Guía de despliegue en Render + Supabase
├── .env.example                # Plantilla de variables de entorno (raíz, referencia)
├── render.yaml                 # Despliegue en Render como servicio único
└── render.multi-service.yaml   # Despliegue en Render como tres servicios separados
```

---

## Requisitos previos

Instala las siguientes herramientas antes de continuar:

- **[.NET 10 SDK](https://dotnet.microsoft.com/download)**
- **[Node.js 18+](https://nodejs.org/)**
- **[pnpm](https://pnpm.io/)** — gestor de paquetes del frontend: `npm install -g pnpm`
- **[PostgreSQL](https://www.postgresql.org/)** 14 o superior
- **Token de bot de Telegram** — obtenido desde [@BotFather](https://t.me/BotFather)
- **Clave de API de Groq** — cuenta en [groq.com](https://groq.com/) (para generación de preguntas con IA)

---

## Instalación paso a paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/comprendopuce/Comprendo.git
cd Comprendo
```

### 2. Configurar la base de datos

```bash
# Crear la base de datos
psql -U postgres -c "CREATE DATABASE \"COMPRENDO\";"

# Aplicar el esquema completo (tablas, triggers, vistas)
psql -U postgres -d COMPRENDO -f database/schema.sql

# (Opcional) Cargar datos de prueba
psql -U postgres -d COMPRENDO -f database/seed.sql
```

### 3. Configurar variables de entorno

#### Backend

Crea el archivo de configuración local a partir de la plantilla:

```bash
# Windows (PowerShell)
copy backend\src\Comprendo.Api\appsettings.Local.json.example `
     backend\src\Comprendo.Api\appsettings.Local.json
```

Edita `appsettings.Local.json` con la cadena de conexión a tu instancia PostgreSQL:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=COMPRENDO;Username=<usuario>;Password=<contraseña>"
  }
}
```

> El archivo `appsettings.Development.json` ya incluye valores de desarrollo para JWT e `Integration.ApiKey`. Puedes modificarlos si lo necesitas.

#### Bot de integración

```bash
copy integration-bot\.env.example integration-bot\.env
```

Edita `integration-bot/.env` completando al menos las variables marcadas como requeridas (ver tabla de variables de entorno más abajo).

#### Frontend

```bash
copy frontend\.env.example frontend\.env.local
```

Edita `frontend/.env.local` apuntando a las URLs locales de los servicios.

### 4. Instalar dependencias

Ejecuta los siguientes comandos en terminales separadas o de forma secuencial:

```bash
# Backend (.NET)
cd backend
dotnet restore

# Bot de integración
cd integration-bot
npm install

# Frontend
cd frontend
pnpm install
```

---

## Variables de entorno

Los archivos `.env.example` incluidos en cada carpeta de servicio sirven como plantilla. **Nunca subas al repositorio archivos `.env` con valores reales.**

### Backend — `appsettings.Local.json` y variables de sistema

| Variable | Descripción | Requerida |
|---|---|---|
| `ConnectionStrings__DefaultConnection` | Cadena de conexión PostgreSQL | Sí |
| `DATABASE_URL` | Alias de la cadena de conexión (usado en Render) | En producción |
| `Jwt__Secret` | Clave secreta para firmar tokens JWT (mínimo 32 caracteres) | Sí |
| `Jwt__Issuer` | Emisor del JWT (ej. `Comprendo`) | Sí |
| `Jwt__Audience` | Audiencia del JWT (ej. `Comprendo.Api`) | Sí |
| `Jwt__ExpirationMinutes` | Tiempo de expiración del token en minutos | Sí |
| `Integration__ApiKey` | Clave compartida entre la API y el bot | Sí |
| `CORS_ALLOWED_ORIGINS` | Orígenes permitidos, separados por coma | Sí |
| `ASPNETCORE_ENVIRONMENT` | Entorno de ejecución (`Development` / `Production`) | Sí |

### Bot de integración — `integration-bot/.env`

| Variable | Descripción | Requerida |
|---|---|---|
| `PORT` | Puerto del servidor Express (por defecto `3000`) | Sí |
| `TELEGRAM_BOT_TOKEN` | Token del bot obtenido desde [@BotFather](https://t.me/BotFather) | Sí |
| `TELEGRAM_STUDENT_CHAT_ID` | ID del chat o grupo de estudiantes en Telegram | Sí |
| `CORE_API_URL` | URL base de la API .NET (ej. `http://localhost:5253`) | Sí |
| `INTEGRATION_API_KEY` | Debe coincidir con `Integration__ApiKey` del backend | Sí |
| `GROQ_API_KEY` | Clave de [Groq](https://groq.com/) para generación de preguntas con IA | Sí |
| `GEMINI_API_KEY` | Clave de Google Gemini (proveedor alternativo de IA) | Opcional |
| `GROQ_MODEL` | Identificador del modelo Groq a utilizar | Opcional |
| `XAI_MODEL` | Identificador del modelo xAI/Grok (si se usa este proveedor) | Opcional |
| `CORS_ALLOWED_ORIGINS` | Orígenes permitidos para el servidor Express | Opcional |

### Frontend — `frontend/.env.local`

| Variable | Descripción | Requerida |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL pública de la API .NET (ej. `http://localhost:5253`) | Sí |
| `NEXT_PUBLIC_BOT_API_URL` | URL pública del bot Node.js (ej. `http://localhost:3000`) | Sí |

> Las variables con prefijo `NEXT_PUBLIC_` son expuestas al navegador. No incluir en ellas ningún valor secreto.

---

## Ejecución local

Los tres servicios deben ejecutarse simultáneamente. Abre una terminal por cada uno.

### Terminal 1 — Backend (.NET API)

```bash
cd backend
dotnet run --project src/Comprendo.Api
```

Disponible en: `http://localhost:5253`
Swagger UI (modo desarrollo): `http://localhost:5253`

### Terminal 2 — Bot de integración (Node.js)

```bash
cd integration-bot
npm run dev       # Modo desarrollo con recarga automática
# npm start       # Modo producción
```

Disponible en: `http://localhost:3000`

### Terminal 3 — Frontend (Next.js)

```bash
cd frontend
pnpm dev
```

Panel docente disponible en: `http://localhost:3001`

---

### Credenciales de prueba (requiere haber ejecutado `database/seed.sql`)

| Campo | Valor |
|---|---|
| Email | `docente@comprendo.local` |
| Contraseña | `comprendo123` |

> Estas credenciales son exclusivas para el entorno de desarrollo. Deben cambiarse antes de cualquier despliegue en producción.

---

## Dependencias de terceros

A continuación se listan las bibliotecas externas utilizadas en cada servicio, con su licencia correspondiente.

### Backend — NuGet packages (.NET)

| Paquete | Versión | Licencia |
|---|---|---|
| `Microsoft.AspNetCore.Authentication.JwtBearer` | 10.0.0 | [MIT](https://github.com/dotnet/aspnetcore/blob/main/LICENSE.txt) |
| `Microsoft.EntityFrameworkCore` | 10.0.0 | [MIT](https://github.com/dotnet/efcore/blob/main/LICENSE.txt) |
| `Microsoft.Extensions.Configuration.Binder` | 10.0.0 | [MIT](https://github.com/dotnet/runtime/blob/main/LICENSE.TXT) |
| `Microsoft.Extensions.DependencyInjection.Abstractions` | 10.0.0 | [MIT](https://github.com/dotnet/runtime/blob/main/LICENSE.TXT) |
| `Npgsql.EntityFrameworkCore.PostgreSQL` | 10.0.0 | [MIT](https://github.com/npgsql/efcore.pg/blob/main/LICENSE) |
| `MediatR` | 12.4.1 | [Apache 2.0](https://github.com/jbogard/MediatR/blob/master/LICENSE) |
| `FluentValidation` | 11.11.0 | [Apache 2.0](https://github.com/FluentValidation/FluentValidation/blob/main/LICENSE) |
| `FluentValidation.DependencyInjectionExtensions` | 11.11.0 | [Apache 2.0](https://github.com/FluentValidation/FluentValidation/blob/main/LICENSE) |
| `Swashbuckle.AspNetCore` | 7.2.0 | [MIT](https://github.com/domaindrivendev/Swashbuckle.AspNetCore/blob/master/LICENSE) |

### Bot de integración — npm packages (Node.js)

| Paquete | Versión | Licencia |
|---|---|---|
| `express` | ^4.22.1 | [MIT](https://github.com/expressjs/express/blob/master/LICENSE) |
| `node-telegram-bot-api` | ^0.66.0 | [MIT](https://github.com/yagop/node-telegram-bot-api/blob/master/LICENSE) |
| `dotenv` | ^16.6.1 | [BSD-2-Clause](https://github.com/motdotla/dotenv/blob/master/LICENSE) |

### Frontend — npm packages (Next.js / React)

| Paquete | Versión | Licencia |
|---|---|---|
| `next` | 16.2.6 | [MIT](https://github.com/vercel/next.js/blob/canary/license.md) |
| `react` / `react-dom` | ^19 | [MIT](https://github.com/facebook/react/blob/main/LICENSE) |
| `typescript` | 5.7.3 | [Apache 2.0](https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt) |
| `tailwindcss` | ^4.2.0 | [MIT](https://github.com/tailwindlabs/tailwindcss/blob/next/LICENSE) |
| `@radix-ui/react-*` (20 componentes) | varios | [MIT](https://github.com/radix-ui/primitives/blob/main/LICENSE) |
| `react-hook-form` | ^7.54.1 | [MIT](https://github.com/react-hook-form/react-hook-form/blob/master/LICENSE) |
| `@hookform/resolvers` | ^3.9.1 | [MIT](https://github.com/react-hook-form/resolvers/blob/master/LICENSE) |
| `zod` | ^3.24.1 | [MIT](https://github.com/colinhacks/zod/blob/master/LICENSE) |
| `recharts` | 2.15.0 | [MIT](https://github.com/recharts/recharts/blob/master/LICENSE) |
| `lucide-react` | ^0.564.0 | [ISC](https://github.com/lucide-icons/lucide/blob/main/LICENSE) |
| `date-fns` | 4.1.0 | [MIT](https://github.com/date-fns/date-fns/blob/main/LICENSE.md) |
| `react-day-picker` | 9.13.2 | [MIT](https://github.com/gpbl/react-day-picker/blob/main/LICENSE) |
| `embla-carousel-react` | 8.6.0 | [MIT](https://github.com/davidjerleke/embla-carousel/blob/master/LICENSE) |
| `cmdk` | 1.1.1 | [MIT](https://github.com/pacocoursey/cmdk/blob/main/LICENSE) |
| `sonner` | ^1.7.1 | [MIT](https://github.com/emilkowalski/sonner/blob/main/LICENSE.md) |
| `vaul` | ^1.1.2 | [MIT](https://github.com/emilkowalski/vaul/blob/main/LICENSE.md) |
| `next-themes` | ^0.4.6 | [MIT](https://github.com/pacocoursey/next-themes/blob/main/LICENSE) |
| `class-variance-authority` | ^0.7.1 | [Apache 2.0](https://github.com/joe-bell/cva/blob/main/LICENSE) |
| `clsx` | ^2.1.1 | [MIT](https://github.com/lukeed/clsx/blob/master/license) |
| `tailwind-merge` | ^3.3.1 | [MIT](https://github.com/dcastil/tailwind-merge/blob/v1.14.0/LICENSE.md) |
| `input-otp` | 1.4.2 | [MIT](https://github.com/guilhermerodz/input-otp/blob/master/LICENSE) |
| `react-resizable-panels` | ^2.1.7 | [MIT](https://github.com/bvaughn/react-resizable-panels/blob/main/LICENSE) |
| `react-clock` | ^6.0.0 | [MIT](https://github.com/wojtekmaj/react-clock/blob/main/LICENSE) |
| `autoprefixer` | ^10.4.20 | [MIT](https://github.com/postcss/autoprefixer/blob/main/LICENSE) |
| `postcss` | ^8.5 | [MIT](https://github.com/postcss/postcss/blob/main/LICENSE) |
| `@vercel/analytics` | 1.6.1 | [MIT](https://github.com/vercel/analytics/blob/main/LICENSE) |

---

## Licencia

Distribuido bajo la licencia **MIT**. Consulta el archivo [`LICENSE`](LICENSE) para el texto completo.

© 2026 Star Lab — Dylan Medina, Doménica Arcos, Dana Bahamonde, Juan Morales.
