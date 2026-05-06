# Comprendo — Visión general

**Comprendo** es un prototipo orientado al aula: los estudiantes reciben una pregunta de cierre de clase por **WhatsApp** (vía **Twilio**) y el servidor registra las respuestas para que el docente pueda revisarlas (`GET /report` o notificación al número del docente).

En el roadmap está documentada una **migración futura a Telegram** (variables y flujo descritos en el `README.md` y en `.env.example`); el código actual sigue usando únicamente Twilio/WhatsApp.

## Flujo resumido (implementación actual)

1. El backend expone `POST /start-class` con el tema (`topic`) y el número del estudiante; genera una pregunta vía Zhipu AI (GLM) y la envía por WhatsApp con Twilio.
2. Twilio entrega las respuestas del alumno al webhook `POST /whatsapp` (configurado en el panel de Twilio / Sandbox).
3. El estado en memoria guarda la pregunta activa y las respuestas para consulta rápida en desarrollo.

## Carpetas

| Carpeta | Uso |
|---------|-----|
| `src/` | Servidor Express, Twilio/WhatsApp, generación de preguntas |
| `tests/` | Pruebas automatizadas (`npm test`) |
| `docs/` | Documentación de alto nivel y entregables |

Para instalación y variables de entorno, ver el `README.md` en la raíz del repositorio.
