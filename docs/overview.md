# Comprendo — Visión general

**Comprendo** es un prototipo orientado al aula: los estudiantes reciben una pregunta de cierre de clase por **Telegram** y el servidor registra las respuestas para que el docente pueda revisarlas (endpoint `/report` o notificación al chat del docente).

## Flujo resumido

1. El backend expone `POST /start-class` con el tema (`topic`) y opcionalmente el chat del estudiante; genera una pregunta vía Groq y la envía por la API de Telegram.
2. Telegram entrega las respuestas del alumno al webhook `POST /telegram` (HTTPS público en producción).
3. El estado en memoria guarda la pregunta activa y las respuestas para consulta rápida en desarrollo.

## Carpetas

| Carpeta | Uso |
|---------|-----|
| `src/` | Servidor Express, integración Telegram, generación de preguntas |
| `tests/` | Pruebas automatizadas (`npm test`) |
| `docs/` | Documentación de alto nivel y entregables |

Para instalación y variables de entorno, ver el `README.md` en la raíz del repositorio.
