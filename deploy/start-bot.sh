#!/bin/sh
# Arranca el bot heredando secretos de Render (TELEGRAM, GROQ, etc.)
cd /app/bot
export PORT=3001
export NODE_ENV=production
export CORE_API_URL="${CORE_API_URL:-http://127.0.0.1:8080}"
exec node src/index.js
