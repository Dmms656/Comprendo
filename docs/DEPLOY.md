# Despliegue — Supabase + Render

| Componente | Plataforma |
|---|---|
| PostgreSQL | [Supabase](https://supabase.com) |
| API + Bot + Frontend | [Render](https://render.com) — **1 Web Service** (recomendado) o 3 separados |

---

## Modo recomendado: un solo servicio en Render

Todo corre en **una instancia** con Docker (`deploy/Dockerfile`):

- **nginx** escucha el puerto de Render y enruta el tráfico.
- **API .NET** en `127.0.0.1:8080` → expuesta como `/api/*`
- **Bot Node** en `127.0.0.1:3001` → expuesto como `/bot/*`
- **Next.js** en `127.0.0.1:3000` → expuesto como `/`

### Ventajas

- Un solo servicio en el plan free de Render (ahorra cuota y costo).
- Una URL pública para todo; el frontend usa rutas relativas (`/api`, `/bot`).
- El bot habla con el API por red interna (`CORE_API_URL=http://127.0.0.1:8080`).

### Arquitectura unificada

```
                    https://comprendo.onrender.com
                                  │
                           nginx (PORT)
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
              Next.js:3000   API:8080    Bot:3001
                    │             │             │
                    └─────────────┴──────┬──────┘
                                         ▼
                                   Supabase (PostgreSQL)
                                         ▲
                                    Telegram
```

### Desplegar (Blueprint)

1. Aplica el esquema en Supabase (sección 1).
2. En Render: **New → Blueprint** → repo con [`render.yaml`](../render.yaml).
3. Completa las variables secretas (plantilla: [`deploy/render.env.example`](../deploy/render.env.example)).
4. Tras el deploy, abre `https://<tu-servicio>.onrender.com`.

| Ruta pública | Servicio interno |
|---|---|
| `/` | Panel docente (Next.js) |
| `/api/*` | Core API (.NET) |
| `/bot/*` | Bot de integración |
| `/health` | Health check de Render |

> **Telegram polling:** sigue habiendo un solo proceso del bot; no escales a varias instancias del servicio unificado.

---

## Modo alternativo: tres servicios separados

Si prefieres escalar o desplegar por partes, usa [`render.multi-service.yaml`](../render.multi-service.yaml) en lugar de `render.yaml`.

```
Frontend (Render) ──► API (Render) ──► Supabase
       └──► Bot (Render) ──► API
```

Ver la sección **Despliegue multi-servicio** al final de este documento.

---

## 1. Base de datos en Supabase

### 1.1 Crear proyecto

1. Entra en [supabase.com](https://supabase.com) → **New project**.
2. Anota la **database password** (la necesitarás para Render).

### 1.2 Aplicar el esquema

1. Ve a **SQL Editor** → **New query**.
2. Copia y pega el contenido completo de [`database/schema.sql`](../database/schema.sql).
3. Pulsa **Run**. Debe completarse sin errores (`pgcrypto` está disponible en Supabase).

> **Datos demo (opcional):** ejecuta también [`database/seed.sql`](../database/seed.sql) en un entorno de pruebas. Credenciales demo: `docente@comprendo.local` / `comprendo123`.

### 1.3 Cadena de conexión (solo en Render, no en el código)

La contraseña y el host **no van en `appsettings*.json`**. Se configuran en el dashboard de Render.

En Supabase → **Project Settings → Database → Connection string → URI** → elige **Session pooler** (recomendado):

```text
postgresql://postgres.vophfrxqguobngyplrdc:<TU_PASSWORD>@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

> Usa el **Session pooler** (`aws-1-us-east-1`, usuario `postgres.vophfrxqguobngyplrdc`). Funciona mejor desde redes sin IPv6 y en Render.  
> La conexión directa (`db....supabase.co`) solo tiene IPv6 y puede fallar en desarrollo local.  
> El API convierte automáticamente la URI `postgresql://` al formato Npgsql con SSL.

En Render → servicio **comprendo** (o `comprendo-api` si usas multi-servicio) → **Environment**:

| Variable | Valor |
|---|---|
| `ConnectionStrings__DefaultConnection` | La URI completa de arriba (con tu contraseña) |

**Alternativa:** puedes usar `DATABASE_URL` con el mismo valor (el API acepta ambas).

> No subas la contraseña al repositorio. `appsettings.Production.json` no contiene `ConnectionStrings`.

---

## 2. Variables del servicio unificado

En el servicio **comprendo** de Render, configura (ver [`deploy/render.env.example`](../deploy/render.env.example)):

| Variable | Obligatoria | Descripción |
|---|---|---|
| `ConnectionStrings__DefaultConnection` | Sí | URI de Supabase |
| `Jwt__Secret` | Sí | ≥ 32 caracteres |
| `Integration__ApiKey` | Sí | Clave bot ↔ API (`INTEGRATION_API_KEY` se sincroniza sola) |
| `TELEGRAM_BOT_TOKEN` | Sí | Token de BotFather |
| `ZHIPU_API_KEY` | Sí | IA para preguntas |
| `GROQ_API_KEY` | Recomendada | Fallback de IA |
| `CORS_ALLOWED_ORIGINS` | No | Solo si el panel llama desde otro dominio |

---

## 3. Orden de despliegue (unificado)

1. **Supabase** — esquema SQL aplicado.
2. **Render Blueprint** con `render.yaml` → un servicio `comprendo`.
3. Completa variables secretas y espera el build Docker (~5–10 min).
4. Verifica `https://<servicio>.onrender.com/health`.
5. Abre `https://<servicio>.onrender.com` e inicia sesión.

---

## 4. Verificación (unificado)

| Prueba | URL |
|---|---|
| Servicio vivo | `GET /health` |
| API | `POST /api/auth/login` |
| Bot | `GET /bot/health` |
| Panel | `/` (login docente) |
| Telegram | `/start` en el bot |

---

## Despliegue multi-servicio (opcional)

Usa [`render.multi-service.yaml`](../render.multi-service.yaml) si prefieres **3 Web Services** separados.

### Blueprint multi-servicio

1. Renombra o selecciona `render.multi-service.yaml` como blueprint.
2. Completa las variables de cada servicio.

### Servicios manuales

#### Servicio 1: `comprendo-api` (Backend)

| Campo | Valor |
|---|---|
| Runtime | **Docker** |
| Root Directory | `backend` |
| Dockerfile Path | `Dockerfile` |
| Health Check Path | `/health` |

**Variables de entorno:**

| Variable | Valor |
|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ConnectionStrings__DefaultConnection` | URI de Supabase con contraseña (sección 1.3) — **obligatoria** |
| `Jwt__Secret` | Clave aleatoria ≥ 32 caracteres |
| `Jwt__Issuer` | `Comprendo` |
| `Jwt__Audience` | `Comprendo.Api` |
| `Integration__ApiKey` | Clave secreta compartida con el bot |
| `CORS_ALLOWED_ORIGINS` | URL del frontend, ej. `https://comprendo-frontend.onrender.com` |

#### Servicio 2: `comprendo-bot` (Integración)

| Campo | Valor |
|---|---|
| Runtime | **Node** |
| Root Directory | `integration-bot` |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

**Variables de entorno:**

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `CORE_API_URL` | URL pública del API, ej. `https://comprendo-api.onrender.com` |
| `INTEGRATION_API_KEY` | **Mismo valor** que `Integration__ApiKey` del API |
| `TELEGRAM_BOT_TOKEN` | Token de [@BotFather](https://t.me/BotFather) |
| `ZHIPU_API_KEY` | Clave Zhipu AI |
| `GROQ_API_KEY` | Clave Groq (fallback) |
| `CORS_ALLOWED_ORIGINS` | Misma URL del frontend |

> El bot usa **polling** de Telegram. Mantén **una sola instancia** del servicio; no escales a varias réplicas.

#### Servicio 3: `comprendo-frontend` (Panel)

| Campo | Valor |
|---|---|
| Runtime | **Node** |
| Root Directory | `frontend` |
| Build Command | `corepack enable && pnpm install --frozen-lockfile && pnpm build` |
| Start Command | `pnpm start` |

**Variables de entorno (build + runtime):**

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL pública del API |
| `NEXT_PUBLIC_BOT_API_URL` | URL pública del bot |

> Las variables `NEXT_PUBLIC_*` deben existir **antes del build** en Render.

---

## 5. Variables de entorno — resumen

Copia las plantillas locales antes de producción:

```bash
# Backend (solo desarrollo local)
copy backend\src\Comprendo.Api\appsettings.Local.json.example backend\src\Comprendo.Api\appsettings.Local.json

# Bot
copy integration-bot\.env.example integration-bot\.env

# Frontend
copy frontend\.env.example frontend\.env.local
```

En Render **no** subas `.env`; configura todo en el dashboard de cada servicio.

**Base de datos (servicio unificado o `comprendo-api`):**

```env
ConnectionStrings__DefaultConnection=postgresql://postgres.vophfrxqguobngyplrdc:TU_PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

Desarrollo local: usa `appsettings.Local.json` (gitignore), no variables de Render.

---

## 6. Consideraciones de producción

- **Plan free de Render:** los servicios se suspenden tras inactividad; el primer request puede tardar ~30 s.
- **HTTPS:** Render provee TLS; usa siempre URLs `https://` en `CORE_API_URL` y `NEXT_PUBLIC_*`.
- **Secretos:** genera `Jwt__Secret` e `Integration__ApiKey` únicos; no reutilices los de desarrollo.
- **Swagger:** deshabilitado en `Production` (solo disponible en `Development`).
- **.NET 10:** el despliegue unificado usa Docker (`deploy/Dockerfile`) con nginx + supervisord.
- **Imagen Docker:** más pesada (~1 GB); el build inicial puede tardar varios minutos.

---

## 7. Solución de problemas

| Síntoma | Posible causa |
|---|---|
| API no arranca | `ConnectionStrings__DefaultConnection` incorrecta o sin SSL |
| CORS en el panel | Falta la URL del frontend en `CORS_ALLOWED_ORIGINS` del API |
| Bot no registra respuestas | `INTEGRATION_API_KEY` ≠ `Integration__ApiKey` |
| Frontend no conecta | `NEXT_PUBLIC_*` mal configuradas o build anterior sin re-desplegar |
| Login falla tras seed | Contraseña `comprendo123`; verifica que `seed.sql` se ejecutó |
| Telegram no responde | Token inválido o segunda instancia del bot en polling |
| 502 en `/` o `/api` | Algún proceso interno no arrancó; revisa logs de Render |
| Bot 404 en el panel | Verifica que las rutas usen prefijo `/bot` (build unificado) |

---

## Referencias

- [Render — Environment variables](https://render.com/docs/environment-variables)
- [Render — Deploy Docker](https://render.com/docs/docker)
- [Supabase — Connecting to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Npgsql connection strings](https://www.npgsql.org/doc/connection-string-parameters.html)
