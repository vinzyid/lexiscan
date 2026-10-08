# Deploy Backend LexiScan ke VPS Tencent

Panduan ini memasang backend Laravel LexiScan di VPS Tencent (Ubuntu) memakai
Docker + Caddy. Database tetap di **Supabase cloud**; VPS hanya menjalankan
container backend. HTTPS diurus otomatis oleh Caddy (Let's Encrypt).

Asumsi:
- VPS Ubuntu 22.04/24.04, login SSH pakai **password** (bukan kunci).
- Domain sudah dimiliki dan bisa diarahkan ke IP VPS.
- Kode sudah ada di GitHub: `github.com/vinzyid/lexiscan`.

---

## 1. Siapkan instance & security group

Buat CVM minimal **2 vCPU / 2 GB RAM** (1 GB bisa kehabisan memori saat
`docker build`; kalau terpaksa, tambahkan swap).

Di **Security Group** Tencent, buka port masuk:

| Port | Untuk | Catatan |
|------|-------|---------|
| 22   | SSH   | Batasi ke IP Anda saja |
| 80   | HTTP  | Validasi sertifikat Caddy |
| 443  | HTTPS | Akses aplikasi |

Jangan buka `8080` ke publik — cukup localhost.

---

## 2. Arahkan domain

Di pengaturan DNS domain Anda, buat **A record** menuju IP publik VPS:

```
api.contoh.my.id   A   <IP_PUBLIK_VPS>
```

Tunggu propagasi, verifikasi dari VPS:

```bash
dig +short api.contoh.my.id
```

Harus membalas IP VPS. Caddy tidak akan bisa menerbitkan sertifikat sebelum ini
benar.

---

## 3. Login ke VPS

```bash
ssh ubuntu@<IP_PUBLIK_VPS>
# masukkan password yang Anda buat tadi
```

Clone repo dulu:

```bash
git clone https://github.com/vinzyid/lexiscan.git ~/lexiscan
cd ~/lexiscan/backend-api
```

> Kalau repo privat, gunakan Personal Access Token atau SSH key GitHub. Untuk
> repo publik, clone langsung seperti di atas.

---

## 4. Siapkan `.env.production`

Salin template, lalu isi nilainya:

```bash
cd ~/lexiscan/backend-api
cp deploy/.env.production.example .env.production
nano .env.production
```

Yang **wajib** diisi:

1. **`APP_KEY`** — hasilkan:
   ```bash
   php -r "echo 'base64:'.base64_encode(random_bytes(32)), PHP_EOL;"
   ```
   (kalau `php` belum ada di VPS, jalankan di laptop Anda lalu tempel)

2. **`APP_URL`** — biarkan `https://DOMAIN_BACKEND_ANDA` dulu; langkah 5 akan
   mengisinya otomatis dengan domain yang Anda masukkan.

3. **`AI_API_KEY`** — hasilkan:
   ```bash
   php -r "echo bin2hex(random_bytes(24)), PHP_EOL;"
   ```
   Simpan nilainya; **harus sama persis** dengan `EXPO_PUBLIC_API_KEY` di
   `mobile-app/eas.json`.

4. **Kredensial Supabase** — pakai host **pooler**, bukan direct:
   ```
   DB_HOST=aws-1-<region>.pooler.supabase.com
   DB_USERNAME=postgres.<project-ref>
   DB_PASSWORD=<password>
   ```
   Host `db.<ref>.supabase.co` hanya IPv6 dan akan gagal.

5. **`GEMINI_API_KEY`** — kunci dari Google AI Studio.

Simpan (Ctrl+O, Enter, Ctrl+X).

---

## 5. Jalankan setup otomatis

```bash
cd ~/lexiscan/backend-api
bash deploy/setup-vps.sh
```

Skrip ini memasang Docker, Docker Compose plugin, dan Caddy, lalu menanyakan
**domain backend** Anda. Jawabannya dipakai untuk mengisi `/etc/caddy/Caddyfile`
dan menyinkronkan `APP_URL` di `.env.production` — jadi domain asli tidak perlu
tersimpan di repo. Aman dijalankan ulang.

Kalau dimasukkan ke grup `docker`, **logout lalu login lagi** agar perintah
`docker` tidak perlu `sudo`:

```bash
exit
ssh ubuntu@<IP_PUBLIK_VPS>
cd ~/lexiscan/backend-api && bash deploy/setup-vps.sh   # sekali lagi, untuk Caddy
```

---

## 6. Pastikan Caddyfile sudah memakai domain Anda

Skrip langkah 5 sudah mengisinya. Kalau tadi Anda menjawab kosong atau memasang
Caddy manual, sunting dulu:

```bash
sudo nano /etc/caddy/Caddyfile   # ganti DOMAIN_BACKEND_ANDA
sudo systemctl reload caddy
```

---

## 7. Build & jalankan backend

```bash
cd ~/lexiscan/backend-api
docker compose up -d --build
```

Build pertama agak lama. Pantau log:

```bash
docker compose logs -f
```

Kalau muncul `Please provide a valid cache path` atau error database, cek bagian
Pemecahan Masalah di bawah.

---

## 8. Verifikasi

```bash
curl -s https://api.contoh.my.id/api/ai/health
curl -s http://127.0.0.1:8080/api/ai/health   # dari dalam VPS
```

Buka panel admin: `https://api.contoh.my.id/admin`.

---

## 9. Arahkan aplikasi mobile ke backend baru

Di `mobile-app/eas.json`, set environment EAS:

```json
"env": {
  "EXPO_PUBLIC_API_URL": "https://<domain-anda>",
  "EXPO_PUBLIC_API_KEY": "<sama dengan AI_API_KEY>"
}
```

Lalu dari laptop:

```bash
cd mobile-app
eas update     # perubahan JS/env saja -> OTA, sampai ke pengguna tanpa APK baru
```

`EXPO_PUBLIC_API_KEY` **wajib sama** dengan `AI_API_KEY`, kalau tidak endpoint AI
menolak dengan 503.

---

## 10. Update backend berikutnya

```bash
cd ~/lexiscan
git pull
cd backend-api
docker compose up -d --build
```

Data riil ada di Supabase, jadi membuat ulang container aman.

---

## Perintah harian

| Tujuan | Perintah |
|--------|----------|
| Lihat log | `docker compose logs -f` |
| Restart | `docker compose restart` |
| Hentikan | `docker compose down` |
| Masuk ke container | `docker compose exec backend sh` |
| Jalankan artisan | `docker compose exec backend php artisan <cmd>` |
| Status | `docker compose ps` |

---

## Pemecahan masalah

**Build gagal karena memori habis (`Killed`)**
Tambahkan swap:
```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Caddy tidak menerbitkan sertifikat / HTTPS gagal**
- Pastikan A record sudah mengarah ke VPS (`dig +short <domain>`).
- Port 80 dan 443 terbuka di Security Group Tencent.
- Cek log Caddy: `sudo journalctl -u caddy -n 50 --no-pager`.

**`could not translate host name`**
Anda memakai host Supabase direct (`db.<ref>.supabase.co`). Ganti ke host pooler
`aws-1-<region>.pooler.supabase.com` dengan username `postgres.<project-ref>`.

**Endpoint AI balas 503**
`AI_API_KEY` kosong atau `APP_ENV` bukan `production` dengan penjagaan aktif.
Isi `AI_API_KEY` lalu `docker compose up -d`.

**`Please provide a valid cache path`**
Biasanya karena `storage/` tidak lengkap. Build ulang image dari awal
(`docker compose build --no-cache`) — `Dockerfile` sudah membuat direktori
`storage/framework/*`.

---

## Keamanan

Alamat backend pada akhirnya terlihat siapa saja yang memakai aplikasi (traffic
HP bisa diperiksa), jadi yang melindungi bukan kerahasiaan domain, melainkan
hal-hal berikut:

**Di repo / build**
- **Jangan commit** `.env.production` (sudah masuk `.gitignore`).
- File sisi server di repo ini memakai `DOMAIN_BACKEND_ANDA`; domain asli hanya
  masuk lewat `setup-vps.sh` saat dijalankan. Yang tetap memuat domain nyata
  hanyalah `mobile-app/eas.json`, karena nilainya ditanam ke APK.
- `APP_DEBUG=false` agar stack trace dan isi konfigurasi tidak bocor ke publik.

**Di VPS**
- Batasi port `22` di Security Group ke IP Anda; jangan pernah buka `8080`.
- Setelah semuanya jalan, matikan login password SSH dan pakai SSH key:
  ```bash
  # dari laptop
  ssh-copy-id ubuntu@<IP_VPS>
  # lalu di VPS, di /etc/ssh/sshd_config:
  #   PasswordAuthentication no
  sudo systemctl restart ssh
  ```
- Pasang `fail2ban` untuk meredam percobaan login brute force:
  ```bash
  sudo apt install -y fail2ban && sudo systemctl enable --now fail2ban
  ```
- Aktifkan pembaruan keamanan otomatis:
  ```bash
  sudo apt install -y unattended-upgrades
  sudo dpkg-reconfigure --priority=low unattended-upgrades
  ```
- Pantau siapa yang mengakses admin: `docker compose logs -f` dan log Caddy di
  `/var/log/caddy/lexiscan.log`.

**Di aplikasi**
- `/admin` sudah dijaga login Filament dan `Authenticate` middleware, jadi tidak
  terbuka tanpa akun. Pastikan akun admin memakai kata sandi kuat dan tidak
  memakai kredensial dari pengembangan.
- `AI_API_KEY` bukan pengganti autentikasi; ia hanya gerbang agar endpoint AI
  tidak dipanggil sembarang klien. Endpoint AI memang sengaja tanpa token agar
  fitur baca bisa dicoba sebelum mendaftar, jadi andalkan rate limit (20/menit
  per endpoint) plus pembatasan di Caddy bila perlu.
