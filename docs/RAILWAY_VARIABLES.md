# 🔑 Railway Variables — CampusCare (copy-paste ke Raw Editor Railway)

> Buka Railway → Service → tab **Variables → Raw Editor** → paste blok di bawah,
> lalu ganti DUA nilai beranda sangat penting:
> 1. `DATABASE_URL`  ← diperoleh dari sesi LOKASI (Vercel Storage)
> 2. `FRONTEND_URL`  ← alamat aba-frontend Vercel final kamu

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=GANTI_DENGAN_CONNECTION_STRING_NEON
JWT_SECRET=9fK2mXv7QpL4RnTs8WjY3hZ5cVbN1aMx
JWT_REFRESH_SECRET=Ld7Ka2sX9Hf4QmZ8Tn3WpV6bCy1RtJu5Eg0DsOr2
FRONTEND_URL=https://GANTI-ALAMAT-VERCEL.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM_NAME=CampusCare UIN Gus Dur
WHATSAPP_WEBHOOK_URL=
WHATSAPP_WEBHOOK_TOKEN=
```

## Pengaturan Service Railway

| Setting | Nilai |
|---------|-------|
| Root Directory | `backend` |
| Start Command | `node src/server.js` |
| Networking | **Generate Domain** → simpan alamatnya (dipakai `VITE_API_URL` di Vercel) |

## Setelah generate domain backend, di Vercel:

```
VITE_API_URL=https://<domain-railway-tanpa-slash>
```
→ Project Settings → Redeploy.

## Volume Railway (biar lampiran tak hilang saat redeploy)

Service → **Settings → Volumes → Add**:
- Attach path: `/app/uploads`
- Mount path sama juga → otomatis di-mount pada start.
