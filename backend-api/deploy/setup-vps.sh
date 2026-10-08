#!/usr/bin/env bash
#
# setup-vps.sh — pasang seluruh kebutuhan deploy LexiScan di VPS Ubuntu.
#
# Sekali jalan. Skrip ini:
#   1. Memasang Docker + plugin compose (kalau belum ada)
#   2. Memasang Caddy sebagai reverse proxy dengan HTTPS otomatis
#   3. Menyiapkan direktori kerja di ~/lexiscan
#
# Setelah skrip ini selesai, lanjutkan dengan langkah di deploy/README.md:
# isi ~/lexiscan/backend-api/.env.production, lalu `docker compose up -d`.
#
# Pakai:
#   bash deploy/setup-vps.sh
#
# Aman dijalankan berulang: langkah yang sudah beres akan dilewati.

set -euo pipefail

# --- Tampilan --------------------------------------------------------------
info() { printf '\033[1;34m==>\033[0m %s\n' "$1"; }
ok()   { printf '\033[1;32m  ✓\033[0m %s\n' "$1"; }
warn() { printf '\033[1;33m  !\033[0m %s\n' "$1"; }
die()  { printf '\033[1;31m  ✗ %s\033[0m\n' "$1" >&2; exit 1; }

# --- Pemeriksaan awal ------------------------------------------------------
if [ "$(id -u)" -eq 0 ]; then
  SUDO=""
elif command -v sudo >/dev/null 2>&1; then
  SUDO="sudo"
else
  die "Butuh hak root. Jalankan sebagai root atau pasang sudo dulu."
fi

if ! grep -qi ubuntu /etc/os-release 2>/dev/null; then
  warn "Skrip ini diuji di Ubuntu. Di distro lain beberapa langkah mungkin gagal."
fi

info "Memperbarui daftar paket"
$SUDO apt-get update -y

# --- 1. Docker -------------------------------------------------------------
if command -v docker >/dev/null 2>&1; then
  ok "Docker sudah terpasang ($(docker --version))"
else
  info "Memasang Docker"
  $SUDO apt-get install -y ca-certificates curl gnupg git
  curl -fsSL https://get.docker.com | $SUDO sh
  ok "Docker terpasang"
fi

# Pastikan layanan jalan dan ikut hidup lagi setelah reboot.
$SUDO systemctl enable --now docker >/dev/null 2>&1 || true

# Izinkan pengguna non-root memakai docker tanpa sudo.
if [ -n "${SUDO_USER:-}" ]; then
  $SUDO usermod -aG docker "$SUDO_USER" || true
  if [ "${USER:-}" != "$SUDO_USER" ]; then
    $SUDO usermod -aG docker "${USER:-$(id -un)}" || true
  fi
  ok "Pengguna '${SUDO_USER}' dimasukkan ke grup docker (perlu re-login agar aktif)"
fi

if docker compose version >/dev/null 2>&1; then
  ok "Docker Compose plugin tersedia"
else
  die "Docker Compose plugin tidak ditemukan. Pasang paket docker-compose-plugin."
fi

# --- 2. Caddy --------------------------------------------------------------
if command -v caddy >/dev/null 2>&1; then
  ok "Caddy sudah terpasang ($(caddy version | head -1))"
else
  info "Memasang Caddy"
  $SUDO apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | $SUDO gpg --batch --yes --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | $SUDO tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  $SUDO apt-get update -y
  $SUDO apt-get install -y caddy
  ok "Caddy terpasang"
fi

# --- 3. Direktori kerja ----------------------------------------------------
# Skrip bisa dijalankan dari mana saja; cari Caddyfile relatif ke lokasi skrip,
# lalu jatuh ke lokasi repo standar.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

WORKDIR="${HOME:-/root}/lexiscan"
mkdir -p "$WORKDIR"
ok "Direktori kerja siap di $WORKDIR"

# Salin Caddyfile bawaan kalau belum ada di lokasi sistem.
CADDY_SRC=""
for candidate in \
  "$SCRIPT_DIR/Caddyfile" \
  "$WORKDIR/backend-api/deploy/Caddyfile" \
  "$SCRIPT_DIR/../backend-api/deploy/Caddyfile"
do
  if [ -f "$candidate" ]; then
    CADDY_SRC="$candidate"
    break
  fi
done

# Domain diminta saat dijalankan, bukan disimpan di repo. Tujuannya supaya
# alamat backend tidak ikut terbit ke GitHub.
if [ -n "$CADDY_SRC" ]; then
  if [ -t 0 ]; then
    printf 'Domain backend (mis. api.contoh.my.id): '
    read -r DOMAIN
  else
    DOMAIN="${DOMAIN:-}"
  fi

  if [ -z "$DOMAIN" ]; then
    warn "Domain kosong. Salin Caddyfile manual dan isi domainnya sendiri."
  else
    info "Menyalin Caddyfile ke /etc/caddy/Caddyfile untuk $DOMAIN"
    # Ganti placeholder di repo dengan domain yang baru dimasukkan.
    sed "s/DOMAIN_BACKEND_ANDA/$DOMAIN/g" "$CADDY_SRC" | $SUDO tee /etc/caddy/Caddyfile >/dev/null

    # Beritahu .env.production (kalau ada) soal APP_URL supaya ikut sinkron.
    ENV_FILE="$SCRIPT_DIR/../.env.production"
    if [ -f "$ENV_FILE" ] && grep -q '^APP_URL=' "$ENV_FILE"; then
      sed -i "s|^APP_URL=.*|APP_URL=https://$DOMAIN|" "$ENV_FILE"
      ok "APP_URL di .env.production diset ke https://$DOMAIN"
    fi

    $SUDO systemctl reload caddy 2>/dev/null || $SUDO systemctl restart caddy 2>/dev/null || \
      warn "Muat ulang Caddy gagal; jalankan 'sudo systemctl restart caddy' manual."
    ok "Caddy memakai domain $DOMAIN"
  fi
else
  warn "Caddyfile tidak ditemukan; buat manual di /etc/caddy/Caddyfile (lihat deploy/Caddyfile)."
fi

# --- Ringkasan -------------------------------------------------------------
cat <<EOF

$(printf '\033[1;32mSelesai.\033[0m') Langkah berikutnya:

  1. Kalau Anda baru saja dimasukkan ke grup docker, keluar lalu masuk lagi:
       exit
       ssh <user>@<ip-vps>

  2. Clone repo (kalau belum ada):
       git clone https://github.com/vinzyid/lexiscan.git ~/lexiscan

  3. Siapkan konfigurasi produksi:
       cp ~/lexiscan/backend-api/deploy/.env.production.example \\
          ~/lexiscan/backend-api/.env.production
       nano ~/lexiscan/backend-api/.env.production

  4. Isi domain di Caddyfile (kalau belum dilakukan di atas), lalu jalankan:
       sudo nano /etc/caddy/Caddyfile
       sudo systemctl reload caddy
       cd ~/lexiscan/backend-api && docker compose up -d --build

  5. Cek:  curl -s https://<domain-anda>/api/ai/health

Panduan lengkap: deploy/README.md
EOF
