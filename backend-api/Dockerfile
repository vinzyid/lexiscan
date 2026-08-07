# Backend LexiScan untuk Railway.
#
# FrankenPHP dipakai karena satu proses sudah mencakup web server + PHP, jadi
# tidak perlu nginx, php-fpm, maupun supervisor. Aplikasi wajib berada di /app
# karena image ini menyajikan /app/public.
FROM dunglas/frankenphp:1-php8.4-bookworm

# pdo_pgsql untuk Supabase, pdo_mysql sebagai cadangan kalau pindah database.
RUN install-php-extensions \
    pdo_pgsql \
    pdo_mysql \
    intl \
    zip \
    opcache \
    pcntl

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Dependensi dipasang lebih dulu supaya lapisan ini dipakai ulang selama
# composer.lock tidak berubah. Autoloader dibuat belakangan karena butuh
# seluruh kode aplikasi.
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --no-interaction

COPY . .

# Berkas SQLite kosong disiapkan supaya `migrate` punya tujuan tanpa perlu
# database eksternal. Endpoint AI sendiri tidak menyentuh database, jadi isinya
# boleh hilang setiap deploy. Untuk data yang harus bertahan, isi DB_* dengan
# kredensial Supabase lewat Variables.
RUN composer dump-autoload --optimize --no-dev \
    && touch database/database.sqlite \
    && chmod -R ug+rw storage bootstrap/cache database/database.sqlite

# Cache konfigurasi sengaja dibuat saat container jalan, bukan di sini: env var
# Railway belum ada pada tahap build.
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
