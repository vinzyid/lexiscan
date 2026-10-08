#!/usr/bin/env bash
#
# deploy.sh — perbarui backend LexiScan di VPS dengan satu perintah.
#
# Melakukan: tarik kode terbaru -> build image -> ganti container lama.
# Data riil ada di Supabase, jadi mengganti container aman.
#
# Pakai:
#   bash deploy.sh            # dari dalam backend-api/
#   bash deploy/deploy.sh     # dari mana saja di dalam repo
#
# Prasyarat: ada .env.production di direktori backend-api/ (lihat deploy/README.md).

set -euo pipefail

info() { printf '\033[1;34m==>\033[0m %s\n' "$1"; }
ok()   { printf '\033[1;32m  ✓\033[0m %s\n' "$1"; }
die()  { printf '\033[1;31m  ✗ %s\033[0m\n' "$1" >&2; exit 1; }

# Tentukan lokasi root repo dan direktori backend.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/docker-compose.yml" ]; then
  BACKEND_DIR="$SCRIPT_DIR"
elif [ -f "$SCRIPT_DIR/../docker-compose.yml" ]; then
  BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
else
  die "Tidak menemukan docker-compose.yml. Jalankan skrip ini dari dalam backend-api/."
fi

REPO_DIR="$(cd "$BACKEND_DIR/.." && pwd)"

command -v docker >/dev/null 2>&1 || die "Docker belum terpasang. Jalankan deploy/setup-vps.sh dulu."

[ -f "$BACKEND_DIR/.env.production" ] || \
  die "Berkas $BACKEND_DIR/.env.production tidak ada. Salin dari deploy/.env.production.example lalu isi nilainya."

# 1. Tarik kode terbaru (hanya kalau ini repo Git).
if [ -d "$REPO_DIR/.git" ]; then
  info "Menarik kode terbaru"
  git -C "$REPO_DIR" pull --ff-only
  ok "Kode diperbarui"
else
  info "Bukan repo Git — melewati git pull"
fi

cd "$BACKEND_DIR"

# 2. Build image terbaru.
info "Membangun image"
docker compose build --pull

# 3. Naikkan container dengan image baru.
info "Menjalankan ulang container"
docker compose up -d

# 4. Buang image lama yang tidak terpakai agar disk tidak menumpuk.
info "Membersihkan image lama"
docker image prune -f >/dev/null 2>&1 || true

# 5. Cek status akhir.
echo
docker compose ps
echo
ok "Deploy selesai. Pantau log dengan:  docker compose logs -f"
