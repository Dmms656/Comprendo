# Comprendo — Visión general

**Comprendo** es una plataforma educativa que conecta docentes y estudiantes a través de evaluaciones formativas automatizadas. Al finalizar cada clase, el docente envía preguntas de opción múltiple a los estudiantes por **Telegram**, con preguntas generadas mediante **Inteligencia Artificial** (Zhipu AI / GLM con Groq como fallback). Los resultados se registran en tiempo real en una base de datos PostgreSQL y son consultables desde el panel web docente.

## Arquitectura del sistema

El sistema está compuesto por tres servicios que trabajan en conjunto:

| Servicio | Tecnología | Puerto | Descripción |
|---|---|---|---|
| **Core API** | .NET 10 / ASP.NET Core | 5253 | API principal con autenticación JWT, lógica de negocio y persistencia |
| **Bot de Integración** | Node.js + Express | 3000 | Bot de Telegram y generación de preguntas con IA |
| **Panel Docente** | Next.js + React | 3001 | Interfaz web para el docente |

## Flujo resumido

1. El docente crea una lección en el panel web, define el tema y genera preguntas con IA (o las crea manualmente).
2. Al enviar la evaluación, el Core API notifica al bot de integración con los datos de la lección.
3. El bot envía cada pregunta al chat de Telegram del estudiante via `POST /start-class` o `POST /start-evaluation`.
4. El estudiante responde directamente en Telegram con la letra de la opción (A, B, C o D).
5. El bot registra la respuesta en el Core API (`POST /api/integracion/respuestas`).
6. Un trigger de PostgreSQL recalcula automáticamente el resultado consolidado del estudiante.
7. El docente visualiza los resultados en tiempo real desde el panel web.

## Registro de estudiantes vía Telegram

Los estudiantes se vinculan al sistema a través del bot de Telegram con dos métodos:

- **`/start`** — El bot solicita el número de teléfono mediante un botón de contacto nativo de Telegram, y lo vincula al perfil del estudiante en el Core API.
- **`/start <CÓDIGO>`** — El estudiante usa un código de acceso de la materia para registrarse e inscribirse directamente en la asignatura correspondiente.

## Carpetas principales

| Carpeta | Descripción |
|---|---|
| `backend/` | Core API (.NET — Clean Architecture): dominio, aplicación, infraestructura y controladores |
| `frontend/` | Panel docente (Next.js): login, gestión de lecciones, preguntas, estudiantes y resultados |
| `integration-bot/` | Bot de Telegram + servicio de generación de preguntas con Zhipu AI / Groq |
| `database/` | Scripts SQL de PostgreSQL: esquema, seed y consultas de utilidad |
| `docs/` | Documentación técnica del proyecto |

Para instalación detallada, variables de entorno y endpoints, ver el [`README.md`](../README.md) en la raíz del repositorio.
