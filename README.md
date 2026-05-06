# Plataforma Comprendo — Star Lab

**Comprendo** es una solución tecnológica pensada para reducir la brecha de comunicación en el aula. El prototipo actual envía un **cierre de clase** al estudiante por **WhatsApp** (integración **Twilio**), con preguntas de opción múltiple generadas mediante **IA**, y registra las respuestas para que el docente pueda revisar el pulso de la clase antes de evaluaciones sumativas.

> Porque el silencio en clase no siempre es sinónimo de comprensión.

---

## Stack tecnológico (implementación actual)

| Capa | Tecnología |
|------|------------|
| Runtime | [Node.js](https://nodejs.org/) |
| HTTP API | [Express](https://expressjs.com/) |
| Bot | [Twilio API for WhatsApp](https://www.twilio.com/whatsapp) |
| IA (preguntas) | [Groq](https://groq.com/) API (`llama-3.1-8b-instant`) |
| Pruebas | `node:test` + [supertest](https://github.com/ladjs/supertest) |

En producción necesitas una URL pública HTTPS para el webhook de Twilio (`POST /whatsapp`) y credenciales del Sandbox o número de WhatsApp aprobado según tu cuenta.

---

## Migración prevista a Telegram

La carpeta del proyecto y la documentación ya contemplan el **siguiente paso**: pasar el mismo flujo (pregunta generada + respuestas A–D + informe al docente) al **Telegram Bot API**, usando por ejemplo un webhook `POST /telegram` y variables como `TELEGRAM_BOT_TOKEN`, `TELEGRAM_STUDENT_CHAT_ID`, etc.

Esa migración está **descrita** en `.env.example` (bloque comentado al final) y en esta guía; **el código que ejecutas hoy sigue siendo únicamente WhatsApp/Twilio**. Cuando se implemente en código, actualiza esta sección para reflejar rutas y variables definitivas.

---

## Características principales

1. **Interacción por WhatsApp**: el estudiante responde en el mismo canal donde recibe la pregunta (Sandbox o número configurado en Twilio).
2. **Preguntas contextualizadas**: el docente indica el tema (`topic`) y el servidor genera una pregunta coherente vía Groq (con respaldo local si la API falla).
3. **Reporte rápido**: endpoint `GET /report` con la pregunta activa y las respuestas en memoria; opcionalmente notificación por WhatsApp al docente (`TEACHER_NUMBER`).

---

## Requisitos previos

- [Node.js](https://nodejs.org/) **18 o superior** (se usa `fetch` nativo y `node --watch` en desarrollo).
- Cuenta en [Twilio](https://www.twilio.com/) con WhatsApp Sandbox o número habilitado (`TWILIO_*`).
- Clave de API de [Groq Console](https://console.groq.com/) para generar preguntas (`GROQ_API_KEY`).

---

## Instalación local

### 1. Clonar el repositorio

```bash
git clone https://github.com/Dmms656/Comprendo.git
cd Comprendo
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Variables de entorno

Copia la plantilla y edítala con tus valores (nunca subas `.env`):

```bash
copy .env.example .env
```

En macOS/Linux use `cp .env.example .env`.

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Por defecto el servidor escucha en `http://localhost:3000`.

### 5. Webhook de Twilio

Configura en Twilio la URL pública de tu servidor para mensajes entrantes de WhatsApp apuntando a `POST /whatsapp` (y utiliza túnel HTTPS en local si pruebas desde fuera).

Para disparar una clase de prueba (con el servidor en marcha):

```bash
curl -X POST http://localhost:3000/start-class ^
  -H "Content-Type: application/json" ^
  -d "{\"topic\":\"Fracciones equivalentes\",\"studentNumber\":\"whatsapp:+XXXXXXXXXXX\"}"
```

*(En PowerShell puedes usar `Invoke-RestMethod` si lo prefieres.)*

---

## Pruebas automatizadas

```bash
npm test
```

Ejecuta las pruebas bajo `tests/` (por ejemplo el chequeo de `GET /health`).

---

## Credenciales y datos de prueba

Estos valores son **solo de ejemplo** para documentación y evaluación; debes sustituirlos por tus números y tokens reales en `.env` (no los publiques en el repositorio).

| Concepto | Valor de ejemplo | Notas |
|----------|------------------|--------|
| URL del prototipo desplegado | `https://tu-servicio.onrender.com` | Sustituir por tu URL real cuando exista despliegue. |
| WhatsApp estudiante (Twilio) | Formato `whatsapp:+...` según Sandbox | También puedes fijar `STUDENT_NUMBER` en `.env`. |
| WhatsApp docente (opcional) | `TEACHER_NUMBER` | Recibe copia del informe por cada respuesta. |
| Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER` | Ver consola Twilio. |

*(Usuario/contraseña de un dashboard web no aplica en esta versión: solo API REST + WhatsApp.)*

---

## Estructura del repositorio

```text
/
├── src/                 # Código fuente (Express, Twilio/WhatsApp, Groq)
├── docs/                # Documentación complementaria
├── tests/               # Pruebas automatizadas
├── .env.example         # Plantilla de variables (sin secretos reales)
├── package.json
└── README.md
```

---

## Licencia y uso académico

Proyecto académico Star Lab — Comprendo. Ajusta licencia y créditos según las normas de tu institución.
