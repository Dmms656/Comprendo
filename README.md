# Comprendo — Star Lab

> *Porque el silencio en clase no siempre es sinónimo de comprensión.*

---

## Descripción breve del sistema

**Comprendo** es una plataforma educativa orientada a reducir la brecha de comunicación entre docentes y estudiantes. Permite que al finalizar cada clase, el docente envíe automáticamente preguntas de evaluación formativa a los estudiantes a través de **Telegram**, con preguntas generadas por **Inteligencia Artificial** (Zhipu AI / GLM). Los resultados se registran en tiempo real en una base de datos relacional y son accesibles desde un panel web para el docente.

---

## Objetivo del proyecto

Brindar a los docentes una herramienta digital accesible que les permita conocer el nivel de comprensión de sus estudiantes al cierre de cada clase, a través de evaluaciones formativas automatizadas enviadas por Telegram, con el apoyo de Inteligencia Artificial para la generación de preguntas contextualizadas.

---

## Tecnologías utilizadas

### Backend (API principal — .NET)
| Tecnología | Versión / Detalle |
|---|---|
| .NET | 10 SDK |
| ASP.NET Core | Web API |
| Entity Framework Core | ORM con PostgreSQL (`snake_case`) |
| MediatR | Implementación CQRS |
| FluentValidation | Validación en pipeline MediatR |
| JWT (JSON Web Tokens) | Autenticación stateless |
| Swagger / Swashbuckle | Documentación interactiva de la API |
| PostgreSQL | Motor de base de datos relacional |

### Bot de Integración (Node.js)
| Tecnología | Versión / Detalle |
|---|---|
| Node.js | 18 o superior |
| Express | Framework HTTP |
| node-telegram-bot-api | Cliente del Telegram Bot API |
| Zhipu AI (GLM) | Generación de preguntas con IA |
| Groq AI | Proveedor de IA alternativo (fallback) |
| dotenv | Gestión de variables de entorno |

### Frontend (Panel Docente)
| Tecnología | Versión / Detalle |
|---|---|
| Next.js | 16.2.6 |
| React | 19 |
| TypeScript | 5.7.3 |
| Tailwind CSS | 4.x |
| Radix UI | Componentes accesibles |
| Recharts | Gráficos y estadísticas |
| React Hook Form + Zod | Formularios con validación |
| Lucide React | Iconografía |

### Base de datos
| Tecnología | Detalle |
|---|---|
| PostgreSQL | Esquema relacional con triggers y vistas |
| pgcrypto | Extensión para hash de contraseñas |

---

## Requisitos previos

Antes de instalar el proyecto, asegúrate de contar con:

- **[.NET 10 SDK](https://dotnet.microsoft.com/download)** — para el backend (API principal)
- **[Node.js 18+](https://nodejs.org/)** — para el bot de integración
- **[pnpm](https://pnpm.io/)** — gestor de paquetes para el frontend (`npm install -g pnpm`)
- **[PostgreSQL](https://www.postgresql.org/)** — base de datos relacional (versión 14 o superior recomendada)
- **Cuenta en [Zhipu AI / BigModel](https://open.bigmodel.cn/)** — para obtener `ZHIPU_API_KEY` (generación de preguntas con IA)
- **Cuenta en [Groq](https://groq.com/)** — para `GROQ_API_KEY` (proveedor de IA alternativo/fallback)
- **Bot de Telegram** — token obtenido desde [@BotFather](https://t.me/BotFather) (`TELEGRAM_BOT_TOKEN`)

---

## Despliegue en producción

Para publicar en **Supabase** (base de datos) y **Render**, sigue la guía detallada:

→ **[docs/DEPLOY.md](docs/DEPLOY.md)**

**Recomendado:** un solo servicio en Render (`render.yaml` + `deploy/Dockerfile`) con API, bot y frontend juntos.  
**Alternativa:** tres servicios separados (`render.multi-service.yaml`).

---

## Instalación del proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/Dmms656/Comprendo.git
cd Comprendo
```

### 2. Configurar la base de datos

Aplica el esquema en tu instancia de PostgreSQL (crea la base de datos `COMPRENDO` primero):

```bash
psql -U postgres -d COMPRENDO -f database/schema.sql
psql -U postgres -d COMPRENDO -f database/seed.sql   # Datos de prueba (opcional)
```

### 3. Instalar dependencias del Backend

```bash
cd backend
dotnet restore
```

### 4. Instalar dependencias del Bot de Integración

```bash
cd integration-bot
npm install
```

### 5. Instalar dependencias del Frontend

```bash
cd frontend
pnpm install
```

---

## Configuración de variables de entorno

### Backend (`backend/src/Comprendo.Api/appsettings.Local.json`)

Copia la plantilla y edita con tus datos reales:

```bash
copy backend\src\Comprendo.Api\appsettings.Local.json.example backend\src\Comprendo.Api\appsettings.Local.json
```

Contenido mínimo de `appsettings.Local.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=COMPRENDO;Username=postgres;Password=TU_CLAVE"
  }
}
```

El archivo `appsettings.Development.json` ya incluye la configuración de JWT e integración para desarrollo:

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

### Bot de Integración (`.env` en `/integration-bot`)

Copia la plantilla y completa los valores:

```bash
copy integration-bot\.env.example integration-bot\.env
```

Variables principales:

```env
PORT=3000
ZHIPU_API_KEY=tu_api_key_aqui
ZHIPU_MODEL=glm-4-flash
GROQ_API_KEY=tu_groq_api_key_aqui
TELEGRAM_BOT_TOKEN=tu_telegram_bot_token_aqui
CORE_API_URL=http://localhost:5253
INTEGRATION_API_KEY=dev-integration-api-key
```

### Frontend

El frontend Next.js consume las APIs mediante variables de entorno estándar de Next.js. Crea un `.env.local` en `/frontend` si requieres sobrescribir la URL del backend.

---

## Cómo ejecutar el sistema

Los tres servicios deben correr simultáneamente en terminales separadas.

### 1. Backend (.NET API)

```bash
cd backend
dotnet run --project src/Comprendo.Api
```

La API queda disponible en: `http://localhost:5253`  
Swagger UI: `http://localhost:5253` (en modo desarrollo)

### 2. Bot de Integración (Node.js)

```bash
cd integration-bot
npm run dev
```

El bot queda disponible en: `http://localhost:3000`

Para producción:

```bash
npm start
```

### 3. Frontend (Next.js)

```bash
cd frontend
pnpm dev
```

El panel docente queda disponible en: `http://localhost:3001` (o el puerto que asigne Next.js)

---

## Estructura general del proyecto

```text
Comprendo/
├── backend/                    # API principal (.NET — Clean Architecture)
│   ├── Comprendo.slnx          # Solución .NET
│   └── src/
│       ├── Comprendo.Api/          # Controllers, Swagger, middleware, Program.cs
│       ├── Comprendo.Application/  # Casos de uso (MediatR/CQRS), DTOs, validación
│       ├── Comprendo.Domain/       # Entidades, enums, excepciones de dominio
│       └── Comprendo.Infrastructure/ # EF Core, repositorios, JWT, hash
├── frontend/                   # Panel docente (Next.js + React + TypeScript)
│   ├── app/                    # Páginas y rutas (App Router de Next.js)
│   ├── components/             # Componentes reutilizables (UI y de página)
│   ├── hooks/                  # Custom hooks de React
│   ├── lib/                    # Utilidades y configuración
│   └── styles/                 # Estilos globales
├── integration-bot/            # Bot de Telegram + generación de preguntas con IA (Node.js)
│   └── src/
│       ├── index.js            # Servidor Express + lógica del bot de Telegram
│       └── services/           # Servicio de generación de preguntas con Zhipu AI
├── database/                   # Scripts SQL de PostgreSQL
│   ├── schema.sql              # Esquema completo de la base de datos
│   ├── schema_no_ext.sql       # Esquema sin extensiones (para entornos restringidos)
│   ├── seed.sql                # Datos de prueba/demo
│   └── queries.sql             # Consultas de utilidad
├── docs/                       # Documentación complementaria
├── .env.example                # Plantilla de variables de entorno (raíz)
├── .gitignore
└── README.md
```

---

## Explicación de carpetas importantes

| Carpeta | Descripción |
|---|---|
| `backend/src/Comprendo.Api` | Capa de presentación: controllers HTTP, configuración de Swagger, middleware de errores y autenticación JWT |
| `backend/src/Comprendo.Application` | Lógica de negocio: comandos y queries (CQRS con MediatR), DTOs y validaciones con FluentValidation |
| `backend/src/Comprendo.Domain` | Entidades puras, enums y excepciones de dominio (sin dependencias externas) |
| `backend/src/Comprendo.Infrastructure` | Implementación de repositorios, contexto EF Core, servicios de JWT y hash de contraseñas |
| `frontend/app` | Rutas y páginas del panel docente (Next.js App Router): login, grados, cursos, lecciones |
| `frontend/components` | Componentes de página (dashboard, lecciones, estudiantes, resultados) y componentes UI base (Radix UI) |
| `integration-bot/src` | Servidor Express que orquesta el bot de Telegram: envía preguntas, recibe respuestas, registra datos en el Core API |
| `integration-bot/src/services` | Servicio de integración con Zhipu AI (GLM) y Groq para generación de preguntas |
| `database` | Scripts SQL para crear y poblar la base de datos PostgreSQL |
| `docs` | Documentación técnica adicional del proyecto |

---

## Funcionalidades principales

1. **Gestión de docentes y estudiantes**: registro de usuarios con roles diferenciados (`ADMIN`, `DOCENTE`, `ESTUDIANTE`).
2. **Estructura académica**: gestión de años lectivos, niveles, paralelos, cursos y materias.
3. **Asignación docente-curso-materia**: cada docente puede estar asignado a múltiples materias y cursos.
4. **Creación de lecciones**: el docente crea lecciones con título, descripción, tema y número de preguntas.
5. **Generación de preguntas con IA**: el sistema genera preguntas de opción múltiple (A–D) a partir del tema de la lección usando Zhipu AI (GLM) con Groq como fallback.
6. **Creación manual de preguntas**: el docente puede crear preguntas manualmente (opción múltiple, verdadero/falso, respuesta corta, abierta).
7. **Envío de evaluaciones por Telegram**: el bot envía las preguntas de la lección a los estudiantes mediante Telegram Bot API, de forma individual o secuencial (todas las preguntas de la lección una por una).
8. **Recepción de respuestas**: los estudiantes responden directamente en Telegram enviando la letra de la opción (A, B, C o D).
9. **Retroalimentación inmediata**: el bot responde al estudiante indicando si su respuesta fue correcta o incorrecta.
10. **Registro automático de resultados**: cada respuesta se registra en la base de datos con triggers PostgreSQL que recalculan automáticamente los resultados consolidados.
11. **Panel de resultados**: el docente visualiza estadísticas de participación y resultados por lección en el panel web.
12. **Vinculación de estudiantes vía Telegram**: los estudiantes se registran en el bot con `/start` o usando un código de acceso de la materia.
13. **Auditoría**: registro de eventos y sesiones de usuarios.

---

## Flujo básico de uso

```
Docente crea lección         Bot envía pregunta
en el panel web        →     por Telegram          →    Estudiante responde
      ↓                            ↓                          ↓
 Selecciona tema         Core API registra envío       Bot evalúa respuesta
 y preguntas (IA              y estado                 y da retroalimentación
 o manual)                        ↓                          ↓
                          Trigger PostgreSQL         Core API registra
                          recalcula resultados  ←    respuesta del estudiante
                                  ↓
                          Docente consulta
                          resultados en panel
```

**Paso a paso detallado:**

1. El docente inicia sesión en el panel web (`POST /api/auth/login`).
2. Crea una lección con tema y número de preguntas.
3. Genera preguntas con IA o las crea manualmente.
4. Envía la evaluación — el backend notifica al bot de integración.
5. El bot de integración envía cada pregunta al chat de Telegram del estudiante.
6. El estudiante responde con A, B, C o D.
7. El bot registra la respuesta en el Core API (`.NET`).
8. Un trigger PostgreSQL recalcula automáticamente el resultado consolidado de la lección.
9. El docente consulta el panel para ver participación y resultados.

---

## Endpoints principales

### Backend Core API (`http://localhost:5253`)

#### Autenticación
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Inicio de sesión, retorna JWT | Público |
| POST | `/api/auth/register` | Registro de nuevo usuario | Público |

#### Panel docente
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/api/dashboard` | Resumen estadístico del docente | JWT `DOCENTE` |

#### Catálogo académico
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET/POST | `/api/academico/anios-lectivos` | Años lectivos | JWT |
| GET/POST | `/api/academico/niveles` | Niveles educativos | JWT |
| GET/POST | `/api/academico/paralelos` | Paralelos | JWT |
| GET/POST | `/api/academico/cursos` | Cursos | JWT |
| GET/POST | `/api/academico/materias` | Materias | JWT |

#### Asignaciones y estudiantes
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET/POST | `/api/asignaciones` | Asignaciones docente-curso-materia | JWT `DOCENTE` |
| GET/POST/PUT | `/api/estudiantes` | Gestión de estudiantes | JWT `DOCENTE` |

#### Lecciones y preguntas
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET/POST | `/api/lecciones` | Lecciones del docente | JWT `DOCENTE` |
| GET/PUT/DELETE | `/api/lecciones/{id}` | Gestión de lección específica | JWT `DOCENTE` |
| GET/POST | `/api/lecciones/{id}/preguntas` | Preguntas de la lección | JWT `DOCENTE` |
| GET | `/api/lecciones/{id}/resultados` | Resultados de la lección | JWT `DOCENTE` |

#### Integración (Bot → Core API)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/api/integracion/envios` | Registrar envío de Telegram | API Key |
| POST | `/api/integracion/respuestas` | Registrar respuesta del estudiante | API Key |
| POST | `/api/integracion/solicitudes-ia` | Auditar solicitud de IA | API Key |
| POST | `/api/integracion/vincular-estudiante` | Vincular estudiante por teléfono | API Key |
| POST | `/api/integracion/vincular-estudiante-codigo` | Vincular estudiante por código de acceso | API Key |

> La autenticación de integración usa el header: `X-Integration-Api-Key: dev-integration-api-key`

### Bot de Integración (`http://localhost:3000`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servicio y del bot de Telegram |
| GET | `/api/bot-info` | Información del bot (username, estado) |
| POST | `/api/questions/generate` | Generar pregunta con IA (usado por el frontend) |
| POST | `/start-class` | Enviar una pregunta individual a un estudiante |
| POST | `/start-evaluation` | Enviar todas las preguntas de una lección secuencialmente |

---

## Scripts o comandos útiles

### Backend

```bash
# Restaurar paquetes NuGet
cd backend && dotnet restore

# Compilar el proyecto
cd backend && dotnet build

# Ejecutar en desarrollo (con Swagger)
cd backend && dotnet run --project src/Comprendo.Api
```

### Bot de Integración

```bash
# Modo desarrollo (con auto-reload)
cd integration-bot && npm run dev

# Modo producción
cd integration-bot && npm start
```

### Frontend

```bash
# Modo desarrollo
cd frontend && pnpm dev

# Compilar para producción
cd frontend && pnpm build

# Iniciar en modo producción
cd frontend && pnpm start

# Linting
cd frontend && pnpm lint
```

---

## Configuración de base de datos

El sistema utiliza **PostgreSQL** con un esquema relacional completo.

### Aplicar el esquema

```bash
# Crear la base de datos
psql -U postgres -c "CREATE DATABASE \"COMPRENDO\";"

# Aplicar esquema (tablas, triggers, funciones, vistas)
psql -U postgres -d COMPRENDO -f database/schema.sql

# Cargar datos de prueba (opcional, para desarrollo)
psql -U postgres -d COMPRENDO -f database/seed.sql
```

### Tablas principales

| Tabla | Descripción |
|---|---|
| `usuarios` | Usuarios del sistema (ADMIN, DOCENTE, ESTUDIANTE) |
| `docentes` | Perfil extendido del docente |
| `estudiantes` | Perfil del estudiante con datos de Telegram |
| `anios_lectivos` | Períodos académicos |
| `niveles` | Niveles educativos (ej. 8vo, 9no, 10mo) |
| `paralelos` | Paralelos (ej. A, B, C) |
| `cursos` | Combinación año lectivo + nivel + paralelo |
| `materias` | Asignaturas del currículo |
| `docente_curso_materia` | Asignación de docente a curso y materia |
| `estudiante_curso` | Matrícula de estudiantes en cursos |
| `lecciones` | Clases/evaluaciones creadas por el docente |
| `preguntas` | Preguntas de cada lección (manuales o generadas por IA) |
| `opciones_pregunta` | Opciones A–D de cada pregunta |
| `envios_telegram` | Registro de mensajes enviados por Telegram |
| `respuestas_estudiantes` | Respuestas de los estudiantes |
| `resultados_leccion` | Resultado consolidado por estudiante y lección |
| `solicitudes_ia` | Auditoría de las solicitudes a APIs de IA |
| `sesiones_usuario` | Sesiones activas (tokens JWT) |
| `auditoria_eventos` | Log de eventos del sistema |

### Triggers y funciones automáticas

- **`tg_respuesta_actualiza_resultado`**: Al registrar una respuesta, recalcula automáticamente el resultado consolidado del estudiante en la lección.
- **`tg_sync_numero_preguntas_leccion`**: Mantiene sincronizado el campo `numero_preguntas` en `lecciones` al insertar/eliminar preguntas.

### Vistas de utilidad

| Vista | Descripción |
|---|---|
| `v_docente_asignaciones` | Asignaciones completas del docente (con nombres de materia, nivel, paralelo) |
| `v_estudiantes_por_materia` | Estudiantes inscritos por asignación docente-curso-materia |
| `v_resultados_leccion_detalle` | Resultados de lección con datos completos de estudiante |

---

## Autenticación y roles

### JWT (Backend .NET)

El backend usa **JWT Bearer Tokens** para proteger los endpoints del docente y administrador.

**Flujo de autenticación:**

1. El docente hace `POST /api/auth/login` con email y contraseña.
2. El servidor retorna un `token` JWT.
3. El cliente incluye el token en todas las peticiones protegidas:
   ```http
   Authorization: Bearer <token>
   ```

**En Swagger UI:**
1. Ejecutar `POST /api/auth/login`
2. Copiar el valor de `token`
3. Hacer clic en **Authorize** → introducir `Bearer <token>`

### Roles del sistema

| Rol | Descripción | Acceso |
|---|---|---|
| `ADMIN` | Administrador del sistema | Gestión de catálogos (años lectivos, niveles, etc.) |
| `DOCENTE` | Docente registrado | Panel docente, lecciones, preguntas, estudiantes, resultados |
| `ESTUDIANTE` | Estudiante | Solo interactúa por Telegram (no tiene acceso al panel web) |

### Integración (Bot de Integración → Core API)

Los endpoints bajo `/api/integracion` **no usan JWT**. En su lugar requieren:

```http
X-Integration-Api-Key: dev-integration-api-key
```

Esto permite que el bot de Node.js se comunique con el Core API de .NET sin necesitar credenciales de usuario.

### Credenciales demo (tras aplicar `seed.sql`)

| Concepto | Valor |
|---|---|
| Email del docente | `docente@comprendo.local` |
| Contraseña | `comprendo123` |



---

## Arquitectura general del sistema

El sistema sigue una arquitectura de **tres servicios desacoplados** que se comunican entre sí:

```
┌─────────────────────┐       JWT        ┌────────────────────────────┐
│   Frontend          │◄────────────────►│   Backend Core API         │
│   (Next.js)         │   REST/HTTP      │   (.NET — Clean Architecture)│
│   Panel docente     │                  │   Puerto: 5253             │
└─────────────────────┘                  └───────────┬────────────────┘
                                                     │ EF Core
                                                     ▼
                                          ┌─────────────────────┐
                                          │   PostgreSQL        │
                                          │   (Base de datos)   │
                                          └─────────────────────┘
                                                     ▲
                                          X-Integration-Api-Key
                                                     │
┌─────────────────────┐     Telegram     ┌───────────┴────────────────┐
│   Estudiantes       │◄────────────────►│   Bot de Integración       │
│   (Telegram)        │   Bot API        │   (Node.js + Express)      │
└─────────────────────┘                  │   Puerto: 3000             │
                                         │   + Zhipu AI / Groq (IA)  │
                                         └────────────────────────────┘
```

### Capas del Backend (Clean Architecture)

```
Comprendo.Api          ← HTTP, Swagger, Middleware, Controllers
       ↓
Comprendo.Application  ← CQRS (MediatR), DTOs, Validaciones (FluentValidation)
       ↓
Comprendo.Domain       ← Entidades, Enums, Excepciones de dominio
       ↑
Comprendo.Infrastructure ← EF Core, Repositorios, JWT, Hash (pgcrypto)
```

**Patrones aplicados:**
- **CQRS** con MediatR (comandos y queries separados por feature)
- **Repositorio** (definido en Application, implementado en Infrastructure)
- **Excepciones de dominio** mapeadas a `ProblemDetails` HTTP (404, 403, 409)
- **Pipeline de validación** con FluentValidation antes de cada handler

---

## Autores / Colaboradores

Este proyecto fue desarrollado por el equipo **Star Lab**:

| Nombre | Rol |
|---|---|
| Doménica Arcos | Colaboradora |
| Dana Bahamonde | Colaboradora |
| Dylan Medina | Colaborador |
| Juan Morales | Colaborador |

---

## Licencia y uso académico

Proyecto académico — **Star Lab / Comprendo**. Todos los derechos reservados por sus autores © 2026.
