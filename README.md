# Comprendo — Preguntas de comprensión por Telegram para docentes

> *Porque el silencio en clase no siempre es sinónimo de comprensión.*

**Comprendo** es una plataforma educativa que permite a los docentes enviar evaluaciones formativas a sus estudiantes a través de **Telegram**, con preguntas generadas por **Inteligencia Artificial**, y visualizar los resultados en tiempo real desde un **panel web**.

---

## Problema / Motivación

En muchos entornos educativos, los docentes terminan una clase sin saber con certeza si sus estudiantes comprendieron el contenido. Las evaluaciones tradicionales son tardadas, costosas en tiempo y difíciles de analizar de manera inmediata.

**Comprendo** resuelve esto permitiendo que, al finalizar cada sesión, el docente dispare una evaluación formativa de pocos minutos directamente por Telegram —una app que los estudiantes ya usan— sin instalar nada adicional. Los resultados llegan en segundos al panel del docente, cerrando el ciclo de retroalimentación dentro de la misma clase.

---

## Estado actual

> **Validado con usuarios reales — mayo 2026**

- Piloto completado con **10 usuarios reales** (docentes y estudiantes) en mayo de 2026.
- El flujo completo (creación de lección → generación de preguntas con IA → envío por Telegram → recepción de respuestas → visualización de resultados) funciona de extremo a extremo en producción.
- Desplegado en **Render** (API + Bot) y **Supabase** (PostgreSQL).

---

## Qué hace el sistema

| Componente | Descripción |
|---|---|
| **Bot de Telegram** | Envía preguntas de opción múltiple a los estudiantes y recibe sus respuestas directamente en Telegram. |
| **Generación con IA** | Genera preguntas contextualizadas a partir del tema de la lección usando Zhipu AI (GLM) con Groq como fallback. |
| **Panel docente** | Dashboard web donde el docente crea lecciones, gestiona preguntas, lanza evaluaciones y visualiza resultados y estadísticas. |
| **API principal (.NET)** | Backend que centraliza toda la lógica de negocio, autenticación JWT y persistencia en PostgreSQL. |

**Flujo resumido:**

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

---

## Stack tecnológico

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
| Next.js | 15+ |
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

## Arquitectura general

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

## Estructura del repositorio

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
├── integration-bot/            # Bot de Telegram + IA (Node.js)
│   └── src/
│       ├── index.js            # Servidor Express + lógica del bot de Telegram
│       └── services/           # Servicio de generación con Zhipu AI / Groq
├── database/                   # Scripts SQL de PostgreSQL
│   ├── schema.sql              # Esquema completo de la base de datos
│   ├── schema_no_ext.sql       # Esquema sin extensiones (entornos restringidos)
│   ├── seed.sql                # Datos de prueba/demo
│   └── queries.sql             # Consultas de utilidad
├── docs/                       # Documentación complementaria
├── deploy/                     # Dockerfiles y scripts de despliegue
├── .env.example                # Plantilla de variables de entorno (raíz)
├── render.yaml                 # Despliegue en Render (servicio único)
├── render.multi-service.yaml   # Despliegue en Render (tres servicios separados)
└── README.md
```

---

## Instalación y configuración

### Requisitos previos

- **[.NET 10 SDK](https://dotnet.microsoft.com/download)** — para el backend
- **[Node.js 18+](https://nodejs.org/)** — para el bot de integración
- **[pnpm](https://pnpm.io/)** — gestor de paquetes del frontend (`npm install -g pnpm`)
- **[PostgreSQL](https://www.postgresql.org/)** 14 o superior
- **Cuenta en [Zhipu AI / BigModel](https://open.bigmodel.cn/)** — para la generación de preguntas con IA
- **Cuenta en [Groq](https://groq.com/)** — proveedor IA de respaldo
- **Bot de Telegram** — token obtenido desde [@BotFather](https://t.me/BotFather)

---

### 1. Clonar el repositorio

```bash
git clone https://github.com/Dmms656/Comprendo.git
cd Comprendo
```

---

### 2. Configurar la base de datos

```bash
# Crear la base de datos
psql -U postgres -c "CREATE DATABASE \"COMPRENDO\";"

# Aplicar esquema (tablas, triggers, funciones, vistas)
psql -U postgres -d COMPRENDO -f database/schema.sql

# Cargar datos de prueba (opcional)
psql -U postgres -d COMPRENDO -f database/seed.sql
```

---

### 3. Configurar variables de entorno

#### Backend (`backend/src/Comprendo.Api/appsettings.Local.json`)

Crea el archivo a partir de la plantilla:

```bash
copy backend\src\Comprendo.Api\appsettings.Local.json.example backend\src\Comprendo.Api\appsettings.Local.json
```

Contenido de ejemplo:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=COMPRENDO;Username=tu_usuario;Password=tu_contraseña"
  }
}
```

El archivo `appsettings.Development.json` ya incluye configuración de JWT para desarrollo:

```json
{
  "Jwt": {
    "Secret": "clave_secreta_de_al_menos_32_caracteres",
    "Issuer": "Comprendo",
    "Audience": "Comprendo.Api",
    "ExpirationMinutes": 480
  },
  "Integration": {
    "ApiKey": "tu-api-key-de-integracion"
  }
}
```

#### Bot de Integración (`.env` en `/integration-bot`)

```bash
copy integration-bot\.env.example integration-bot\.env
```

Variables principales (ver `.env.example` para la lista completa):

```env
PORT=3000
ZHIPU_API_KEY=tu_zhipu_api_key_aqui
ZHIPU_MODEL=glm-4-flash
GROQ_API_KEY=tu_groq_api_key_aqui
TELEGRAM_BOT_TOKEN=tu_telegram_bot_token_aqui
CORE_API_URL=http://localhost:5253
INTEGRATION_API_KEY=tu-api-key-de-integracion
```

#### Frontend (`frontend/.env.local`)

El panel Next.js consume las APIs mediante variables de entorno estándar de Next.js. Crea un `.env.local` en `/frontend` si necesitas sobrescribir la URL del backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:5253
```

---

### 4. Instalar dependencias

```bash
# Backend (.NET)
cd backend
dotnet restore

# Bot de Integración
cd integration-bot
npm install

# Frontend
cd frontend
pnpm install
```

---

## Ejecutar el sistema en local

Los tres servicios deben correr simultáneamente en terminales separadas.

### Backend (.NET API)

```bash
cd backend
dotnet run --project src/Comprendo.Api
```

- API disponible en: `http://localhost:5253`
- Swagger UI: `http://localhost:5253` (en modo desarrollo)

### Bot de Integración (Node.js)

```bash
cd integration-bot
npm run dev        # Modo desarrollo (auto-reload)
# npm start        # Modo producción
```

- Bot disponible en: `http://localhost:3000`

### Frontend (Next.js)

```bash
cd frontend
pnpm dev
```

- Panel docente disponible en: `http://localhost:3001`

---

## Despliegue en producción

Para publicar en **Supabase** (base de datos) y **Render**, sigue la guía detallada:

→ **[docs/DEPLOY.md](docs/DEPLOY.md)**

| Opción | Descripción |
|---|---|
| **Recomendada** | Un solo servicio en Render (`render.yaml` + `deploy/Dockerfile`) con API, bot y frontend juntos |
| **Alternativa** | Tres servicios separados (`render.multi-service.yaml`) |

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

> La autenticación de integración usa el header: `X-Integration-Api-Key: <tu-api-key>`

### Bot de Integración (`http://localhost:3000`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servicio y del bot de Telegram |
| GET | `/api/bot-info` | Información del bot (username, estado) |
| POST | `/api/questions/generate` | Generar pregunta con IA |
| POST | `/start-class` | Enviar una pregunta individual a un estudiante |
| POST | `/start-evaluation` | Enviar todas las preguntas de una lección secuencialmente |

---

## Base de datos

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
| `preguntas` | Preguntas de cada lección (manuales o por IA) |
| `opciones_pregunta` | Opciones A–D de cada pregunta |
| `envios_telegram` | Registro de mensajes enviados por Telegram |
| `respuestas_estudiantes` | Respuestas de los estudiantes |
| `resultados_leccion` | Resultado consolidado por estudiante y lección |
| `solicitudes_ia` | Auditoría de solicitudes a APIs de IA |
| `sesiones_usuario` | Sesiones activas (tokens JWT) |
| `auditoria_eventos` | Log de eventos del sistema |

### Triggers automáticos

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

1. El docente hace `POST /api/auth/login` con email y contraseña.
2. El servidor retorna un `token` JWT.
3. El cliente incluye el token en todas las peticiones protegidas:
   ```http
   Authorization: Bearer <token>
   ```

**En Swagger UI:** ejecutar `POST /api/auth/login` → copiar el `token` → clic en **Authorize** → introducir `Bearer <token>`.

### Roles del sistema

| Rol | Descripción | Acceso |
|---|---|---|
| `ADMIN` | Administrador del sistema | Gestión de catálogos (años lectivos, niveles, etc.) |
| `DOCENTE` | Docente registrado | Panel docente, lecciones, preguntas, estudiantes, resultados |
| `ESTUDIANTE` | Estudiante | Solo interactúa por Telegram (sin acceso al panel web) |

### Credenciales demo (tras aplicar `seed.sql`)

| Concepto | Valor de ejemplo |
|---|---|
| Email del docente | `docente@comprendo.local` |
| Contraseña | `comprendo123` |

> ⚠️ Estas credenciales son solo para el entorno de desarrollo/demo. Cámbialas antes de publicar en producción.

---

## Funcionalidades principales

1. **Gestión de docentes y estudiantes**: registro con roles diferenciados (`ADMIN`, `DOCENTE`, `ESTUDIANTE`).
2. **Estructura académica**: años lectivos, niveles, paralelos, cursos y materias.
3. **Asignación docente-curso-materia**: cada docente puede estar asignado a múltiples materias.
4. **Creación de lecciones**: título, descripción, tema y número de preguntas.
5. **Generación de preguntas con IA**: opción múltiple (A–D) a partir del tema, con Zhipu AI + Groq de fallback.
6. **Creación manual de preguntas**: opción múltiple, verdadero/falso, respuesta corta, abierta.
7. **Envío de evaluaciones por Telegram**: el bot envía las preguntas individualmente o en lote.
8. **Recepción de respuestas**: los estudiantes responden con A, B, C o D directamente en Telegram.
9. **Retroalimentación inmediata**: el bot responde al estudiante indicando si acertó o no.
10. **Registro automático de resultados**: triggers PostgreSQL recalculan resultados en tiempo real.
11. **Panel de resultados**: estadísticas de participación y resultados por lección.
12. **Vinculación por Telegram**: los estudiantes se registran con `/start` o con un código de acceso de la materia.
13. **Auditoría**: registro de eventos y sesiones de usuario.

---

## Equipo

Proyecto desarrollado por el equipo **Star Lab**:

| Nombre | Rol |
|---|---|
| Dylan Medina | Desarrollador — Líder de proyecto |
| Doménica Arcos | Desarrolladora |
| Dana Bahamonde | Desarrolladora |
| Juan Morales | Desarrollador |

---

## Licencia y uso académico

Proyecto académico — **Star Lab / Comprendo**. Todos los derechos reservados por sus autores © 2026.
