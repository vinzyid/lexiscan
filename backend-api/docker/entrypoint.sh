#!/bin/sh
set -e

# Railway menentukan nomor port lewat $PORT, sedangkan FrankenPHP membacanya
# dari SERVER_NAME. Titik dua di depan berarti "semua alamat, port sekian".
export SERVER_NAME=":${PORT:-8080}"

php artisan config:cache
php artisan route:cache
php artisan view:cache

# --graceful supaya container tetap hidup kalau database belum disiapkan:
# endpoint AI tidak membutuhkan database sama sekali.
php artisan migrate --force --graceful

exec frankenphp run --config /etc/caddy/Caddyfile --adapter caddyfile
