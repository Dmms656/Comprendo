#!/bin/sh
set -e

# Render asigna PORT al servicio web; nginx es el único que debe escucharlo.
export NGINX_PORT="${PORT:-10000}"
unset PORT

# El bot usa INTEGRATION_API_KEY; el API usa Integration__ApiKey (.NET)
if [ -z "$INTEGRATION_API_KEY" ] && [ -n "$Integration__ApiKey" ]; then
  export INTEGRATION_API_KEY="$Integration__ApiKey"
fi

mkdir -p /var/log/nginx /run/nginx
envsubst '${NGINX_PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/sites-enabled/default.conf
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
