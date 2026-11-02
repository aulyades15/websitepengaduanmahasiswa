# 🚀 Panduan Deploy — CampusCare

> Frontend → **Vercel** · Backend → **Railway / Render** (butuh WebSocket + filesystem) · Database → **Neon / Railway PostgreSQL**

---

## ⚠️ Kenapa backend tidak di Vercel?

| Kebutuhan | Vercel (Serverless) | Railway/Render |
|---|---|---|
| REST API biasa | ✅ | ✅ |
| **Socket.io (WebSocket)** | ❌ Tidak mendukung WS upgrade | ✅ |
| **Upload file** (folder `uploads/`) | ❌ Filesystem ephemeral | ✅ (Railway: gunakan Volume) |
| Cron/long-lived process | Terbatas | ✅ |

Backend & frontend tetap jadi Satu repo git yang sama. Frontend saja yang dianyam ke Vercel; backend dipasang di Railway ( gratis tier tersedia ).

---

## 1️⃣ Deploy Database — Neon (gratis)

1. Daftar di [neon.tech](https://neon.tech) → buat project baru.
2. Salin **Connection String**, format:
   ```
   postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
3. Isi database: dari lokal, jalankan sekali saja:
   ```powershell
   cd backend
   $env:DATABASE_URL="postgresql://...neon..."; node src/config/initDb.js
   ```
   *(atau copy-paste `DATABASE_SCHEMA.sql` di SQL Editor Neon, lalu jalankan seed)*

> Alternatif: Railway postgreSQL plugin — tinggal klik *Add Database → PostgreSQL*.

## 2️⃣ Deploy Backend — Railway

1. Buka [railway.app](https://railway.app) → *New Project → Deploy from GitHub repo* → pilih `websitepengaduanmahasiswa`.
2. Di tab **Settings**, set:
   - **Root Directory**: `backend`
   - **Start Command**: `node src/server.js`
3. Di tab **Variables**, tambahkan:
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=<connection string Neon>
   JWT_SECRET=<string acak panjang>
   JWT_REFRESH_SECRET=<string acak panjang lain>
   FRONTEND_URL=https://<nama-app>.vercel.app   ← akan diisi setelah Vercel deploy
   SMTP_HOST=smtp.gmail.com                     ← konfigurasi notifikasi (bisa belakangan)
   SMTP_PORT=587
   SMTP_USER=<gmail>
   SMTP_PASS=<app password>
   EMAIL_FROM_NAME=CampusCare
   WHATSAPP_WEBHOOK_URL=<opsional>
   WHATSAPP_WEBHOOK_TOKEN=<opsional>
   ```
4. Jalankan sync/Deploy.
5. Buka tab **Settings → Networking → Generate Domain** → dapat `https://campuscare-api.up.railway.app`. Kasih nama yang jelas — host API ini nanti dipakai frontend.
6. Test: buka `https://<backend>/health` → harus keluar `{"status":"OK"}`.

> **Uploads**: Railway pakai filesystem ephemeral — kalau dokumen lampiran perlu persist, masukkan **Volume** di Railway dan mount ke `/app/uploads`. Untuk produksi penuh, pindahkan ke object storage (Cloudflare R2 / S3) bila butuh.

## 3️⃣ Deploy Frontend — Vercel

1. Buka [vercel.com](https://vercel.com) → *Add New → Project* → pilih repo `aulyades15/websitepengaduanmahasiswa`.
2. Konfigurasi:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` · **Output**: `dist`
   - **Environment Variables** (*Production*):
     ```
     VITE_API_URL=https://campuscare-api.up.railway.app
     ```
3. **Deploy**. Setelah jadi, alamat web akan `https://<nama-app>.vercel.app`.
4. Balik ke Railway: update `FRONTEND_URL` Electric = alamat Vercel di atas → restart backend (CORS).

## 4️⃣ Re-Deploy Otomatis

Semua sudah git-connected:
```bash
git add .
git commit -m "perubahan"
git push origin master     # → Vercel & Railway otomatis build ulang
```

---

## 🧪 Checklist setelah Deploy

- [ ] `https://<backend>/health` → OK
- [ ] Landing `https://<frontend>/#/(publik)` tampil & statistik live
- [ ] Login admin → dashboard tanpa error
- [ ] Buat pengaduan + upload lampiran → lampiran bisa dibuka (klik) dari detail
- [ ] Chat admin ↔ mahasiswa — indikator **"Live · tersambung"**
- [ ] Notifikasi in-app + email masuk
- [ ] Registrasi akun mahasiswa baru via `#/register`

---

## 🔐 Tips keamanan

- `JWT_SECRET` ≠ `JWT_REFRESH_SECRET` — keduanya harus geser random 32+ karakter.
- Gunakan Gmail App Password, **bukan** password utama (aktifkan 2FA lalu buat app password: myaccount.google.com/apppasswords).
- Database Neon default *pooling* — gunakan `?sslmode=require`.
