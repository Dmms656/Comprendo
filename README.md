# Plataforma Comprendo — Star Lab

**Comprendo** es una solución tecnológica pensada para reducir la brecha de comunicación en el aula. El prototipo permite enviar un **cierre de clase** al estudiante por **Telegram** (pregunta de opción múltiple generada con IA) y registrar las respuestas para que el docente pueda revisar el pulso de la clase antes de evaluaciones sumativas.

> Porque el silencio en clase no siempre es sinónimo de comprensión.

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Runtime | [Node.js](https://nodejs.org/) |
| HTTP API | [Express](https://expressjs.com/) |
| Bot | [Telegram Bot API](https://core.telegram.org/bots/api) (mensajes salientes + webhook de actualizaciones) |
| IA (preguntas) | [Groq](https://groq.com/) API (`llama-3.1-8b-instant`) |
| Pruebas | `node:test` + [supertest](https://github.com/ladjs/supertest) |

El despliegue típico expone HTTPS para registrar el webhook de Telegram (`POST /telegram`). En local suele usarse un túnel (por ejemplo ngrok, Cloudflare Tunnel) con la URL pública que Telegram exige.

---

## Características principales

1. **Canal familiar**: el estudiante usa Telegram; no hace falta instalar otra app.
2. **Preguntas contextualizadas**: el docente indica el tema (`topic`) y el servidor genera una pregunta coherente vía Groq (con respaldo local si la API falla).
3. **Reporte rápido**: endpoint `GET /report` con la pregunta activa y las respuestas en memoria; opcionalmente notificación al chat del docente.
4. **Webhook seguro opcional**: variable `TELEGRAM_WEBHOOK_SECRET` alineada con `secret_token` en Telegram.

---

## Requisitos previos

- [Node.js](https://nodejs.org/) **18 o superior** (se usa `fetch` nativo y `node --watch` en desarrollo).
- Cuenta en Telegram y un bot creado con [@BotFather](https://t.me/BotFather) (`TELEGRAM_BOT_TOKEN`).
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

En macOS/Linux use `cp .env.example .env`. Descubre tu **chat ID** escribiendo al bot [@userinfobot](https://t.me/userinfobot) en Telegram y copiando el número que muestra.

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Por defecto el servidor escucha en `http://localhost:3000`.

### 5. Producción / webhook

1. Despliega el servidor con HTTPS.
2. Configura el webhook de Telegram apuntando a `https://TU_DOMINIO/telegram` (documentación oficial: [setWebhook](https://core.telegram.org/bots/api#setwebhook)).
3. Si usas `secret_token`, define también `TELEGRAM_WEBHOOK_SECRET` con el mismo valor.

Para disparar una clase de prueba (desde tu máquina o Postman), con el servidor en marcha:

```bash
curl -X POST http://localhost:3000/start-class ^
  -H "Content-Type: application/json" ^
  -d "{\"topic\":\"Fracciones equivalentes\",\"studentChatId\":\"TU_CHAT_ID\"}"
```

*(En PowerShell puedes usar `Invoke-RestMethod` en lugar de `curl` si lo prefieres.)*

---

## Pruebas automatizadas

```bash
npm test
```

Ejecuta las pruebas bajo `tests/` (por ejemplo el chequeo de `GET /health`).

---

## Credenciales y datos de prueba

Estos valores son **solo de ejemplo** para documentación y evaluación; debes sustituirlos por tus IDs y tokens reales en `.env` (no los publiques en el repositorio).

| Concepto | Valor de ejemplo | Notas |
|----------|------------------|--------|
| URL del prototipo desplegado | `https://tu-servicio.onrender.com` | Sustituir por tu URL real cuando exista despliegue. |
| Usuario docente (dashboard web) | _No aplica en esta versión_ | El prototipo actual expone API REST + Telegram; no incluye panel web con login. |
| Chat estudiante (Telegram) | Usar tu `TELEGRAM_STUDENT_CHAT_ID` | Obtener con @userinfobot o similar. |
| Bot Telegram | Token desde @BotFather | Variable `TELEGRAM_BOT_TOKEN` en `.env`. |

Para una demo controlada, usa un único chat de estudiante y un chat de docente opcional (`TELEGRAM_TEACHER_CHAT_ID`) para recibir copias del informe de cada respuesta.

---

## Estructura del repositorio

```text
/
├── src/                 # Código fuente (Express, Telegram, Groq)
├── docs/                # Documentación complementaria
├── tests/               # Pruebas automatizadas
├── .env.example         # Plantilla de variables (sin secretos reales)
├── package.json
└── README.md
```

---

## Licencia y uso académico

Proyecto académico Star Lab — Comprendo. Ajusta licencia y créditos según las normas de tu institución.
