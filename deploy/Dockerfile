# Comprendo — despliegue unificado (API + Bot + Frontend + nginx)
# Un solo Web Service en Render.

# ── API .NET ────────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api-build
WORKDIR /src
COPY backend/Comprendo.slnx ./
COPY backend/src/Comprendo.Api/Comprendo.Api.csproj src/Comprendo.Api/
COPY backend/src/Comprendo.Application/Comprendo.Application.csproj src/Comprendo.Application/
COPY backend/src/Comprendo.Domain/Comprendo.Domain.csproj src/Comprendo.Domain/
COPY backend/src/Comprendo.Infrastructure/Comprendo.Infrastructure.csproj src/Comprendo.Infrastructure/
RUN dotnet restore src/Comprendo.Api/Comprendo.Api.csproj
COPY backend/src/ src/
RUN dotnet publish src/Comprendo.Api/Comprendo.Api.csproj -c Release -o /app/api --no-restore

# ── Frontend Next.js (standalone) ───────────────────────────────────────────
FROM node:20-bookworm AS frontend-build
WORKDIR /app
# pnpm 9 explícito (lockfile v9); corepack en Docker suele fallar con ERR_UNKNOWN_BUILTIN_MODULE
RUN npm install -g pnpm@9.15.9
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ ./
# Mismo origen: rutas relativas vía nginx
ENV NEXT_PUBLIC_API_URL=
ENV NEXT_PUBLIC_BOT_API_URL=/bot
RUN pnpm build

# ── Bot Node.js ───────────────────────────────────────────────────────────────
FROM node:20-bookworm AS bot-deps
WORKDIR /app
COPY integration-bot/package.json integration-bot/package-lock.json ./
RUN npm ci --omit=dev
COPY integration-bot/src ./src

# ── Imagen final ──────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    nginx gettext-base supervisor curl ca-certificates gnupg \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /etc/nginx/templates /etc/nginx/sites-enabled

WORKDIR /app

COPY --from=api-build /app/api ./api
COPY --from=bot-deps /app ./bot
COPY --from=frontend-build /app/.next/standalone ./frontend
COPY --from=frontend-build /app/.next/static ./frontend/.next/static
COPY --from=frontend-build /app/public ./frontend/public

COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY deploy/start.sh /start.sh
COPY deploy/start-bot.sh /start-bot.sh
RUN sed -i 's/\r$//' /start.sh /start-bot.sh && chmod +x /start.sh /start-bot.sh

ENV ASPNETCORE_ENVIRONMENT=Production
ENV NODE_ENV=production

EXPOSE 10000
CMD ["/start.sh"]
