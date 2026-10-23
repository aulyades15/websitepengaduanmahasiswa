# CampusCare — Sistem Pengaduan Mahasiswa UIN Gus Dur

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg)](https://vitejs.dev/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-black.svg)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Sistem pengaduan mahasiswa berbasis web dengan **real-time chat**, **file upload**, **landing page publik**, dan **multi-channel notification** (in-app + email + WhatsApp infrastructure).

---

## ✨ Fitur Utama

| Kategori | Fitur |
|----------|-------|
| **Autentikasi** | JWT (access + refresh token), bcrypt password hash, registrasi mahasiswa self-service |
| **Pengaduan** | CRUD lengkap, upload lampiran (max 5×10 MB), mode anonim, SLA tracking, auto-urgent (Bullying) |
| **Verifikasi & Tindak Lanjut** | Admin assign unit, bulk verify, update status, catatan internal, tolak/selesaikan |
| **Chat Real-time** | Socket.io 2-arah, indikator Live, room per pengaduan, pesan internal (staff only) |
| **Landing Page Publik** | Statistik agregat, 5 kategori, daftar pengaduan anonim, search, CTA login/daftar |
| **Notifikasi Multi-channel** | In-app (DB), Email (SMTP), WhatsApp (webhook generik) — infrastructure ready |
| **Analytics & Dashboard** | KPI, trend, performa unit, SLA compliance, rating kepuasan |
| **Profil & Pengaturan** | Update profil, ganti password, preferensi notifikasi per channel & tipe |

---

## 🏗️ Arsitektur

```
┌─────────────────┐     HTTPS      ┌─────────────────┐
│   Frontend      │ ─────────────► │    Backend      │
│  (Vite + SPA)   │ ◄───────────── │ (Express + PG)  │
└────────┬────────┘   REST + WS    └────────┬────────┘
         │                                 │
         │          ┌──────────────────────┘
         │          ▼
         │   ┌───────────────┐
         └──►│  PostgreSQL   │
             │   (Data)      │
             └───────────────┘
```

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | Vite 5, ES Modules, Hash-routing, Vanilla JS (modular), CSS Variables (design tokens) |
| **Backend** | Node 18+, Express 4, PostgreSQL (pg), JWT (jsonwebtoken), Socket.io 4, Multer, Nodemailer |
| **Database** | PostgreSQL 15+ (migrasi via `initDb.js`, seed via `seedData.js`) |
| **Real-time** | Socket.io (namespace `/`, rooms `pengaduan-{id}`, `pengaduan-{id}-internal`) |

---

## 🚀 Quick Start

### Prasyarat
- Node.js ≥ 18
- PostgreSQL ≥ 15
- (Opsional) SMTP server untuk email, WhatsApp webhook provider (Twilio/Fonnte/Wablas/custom)

### 1. Clone & Install
```bash
git clone https://github.com/aulyades15/websitepengaduanmahasiswa.git
cd websitepengaduanmahasiswa

# Backend
cd backend
npm install
cp .env.example .env    # edit konfigurasi

# Frontend
cd ../frontend
npm install
```

### 2. Konfigurasi Environment (`.env`)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pengaduan_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Email (SMTP) — opsional
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.ac.id
EMAIL_FROM_NAME=CampusCare UIN Gus Dur

# WhatsApp Webhook — opsional
WHATSAPP_WEBHOOK_URL=https://api.yourprovider.com/send
WHATSAPP_WEBHOOK_TOKEN=your-webhook-token
```

### 3. Inisialisasi Database
```bash
cd backend
npm run db:init   # buat tabel, index, trigger
npm run db:seed   # isi data demo (5 kategori, 5 unit, 2 akun demo)
```

### 4. Jalankan Development
```bash
# Terminal 1 — Backend (port 3000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Buka: **http://localhost:5173/**

---

## 🔑 Akun Demo (setelah `db:seed`)

| Role | NIM / Username | Password |
|------|----------------|----------|
| **Mahasiswa** | `2210511042` | `mahasiswa123` |
| **Admin** | `9999999999` | `admin123` |

> Bisa juga daftar akun mahasiswa baru via **#/register** (validasi NIM unik, email unik, bcrypt hash).

---

## 📁 Struktur Project

```
.
├── backend/
│   ├── src/
│   │   ├── config/          # DB, Socket.io registry
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, validation
│   │   ├── routes/          # Express routers
│   │   ├── services/        # Business logic (DB, notif, chat)
│   │   ├── validators/      # Joi schemas
│   │   └── server.js        # Entry point
│   ├── package.json
│   ├── .env.example
│   └── DATABASE_SCHEMA.sql
│
├── frontend/
│   ├── css/                 # 5 file: variables, base, layout, components, pages
│   ├── js/
│   │   ├── api.js           # Axios-like wrapper + upload
│   │   ├── app.js           # Layout, routing, auth guard
│   │   ├── router.js        # Hash navigation
│   │   ├── store.js         # State, cache, theme, unread count
│   │   ├── ui.js            # Helpers (toast, modal, format, dll)
│   │   ├── icons.js         # SVG icon library
│   │   ├── router.js
│   │   └── pages/           # 8 halaman: dashboard, pengaduan (list/new/detail), chat, notifikasi, analitik, profil, login, register, landing
│   ├── index.html
│   ├── main.js              # Bootstrap
│   ├── vite.config.js       # Proxy /api, /uploads, /socket.io
│   └── package.json
│
├── docs/
│   ├── WORKFLOW_PENGADUAN_MAHASISWA.md   # Blueprint lengkap
│   ├── API_DOCUMENTATION.md
│   └── REKOMENDASI_IMPROVEMENT_WEBSITE.md
│
├── .gitignore
└── README.md
```

---

## 🔌 API Endpoints (Ringkas)

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `POST` | `/api/auth/login` | ❌ | Login → access + refresh token |
| `POST` | `/api/auth/register` | ❌ | Registrasi mahasiswa |
| `POST` | `/api/auth/refresh` | ❌ | Refresh access token |
| `GET`  | `/api/auth/me` | ✅ | Profil user login |
| `GET`  | `/api/pengaduan` | ✅ | List (filter, search, pagination) |
| `POST` | `/api/pengaduan` | ✅ (mahasiswa) | Buat pengaduan + upload lampiran |
| `GET`  | `/api/pengaduan/:id` | ✅ | Detail + lampiran + chat + timeline |
| `PUT`  | `/api/pengaduan/:id/status` | ✅ (admin/unit) | Update status + notifikasi |
| `POST` | `/api/chat/:id/messages` | ✅ | Kirim pesan (broadcast WS) |
| `GET`  | `/api/chat/:id/messages` | ✅ | History pesan |
| `GET`  | `/api/public/stats` | ❌ | Statistik landing page |
| `GET`  | `/api/public/pengaduan` | ❌ | Daftar pengaduan anonim |
| `GET`  | `/api/notifications` | ✅ | In-app notifications |
| `GET`  | `/api/analytics/dashboard` | ✅ (admin/pimpinan) | KPI dashboard |

> Lengkap di `docs/API_DOCUMENTATION.md`

---

## 🧪 Testing & Verifikasi

```bash
# Backend test
cd backend && npm test

# Frontend lint
cd frontend && npm run lint

# Playwright E2E (manual via browser automation skill)
# - Landing → Login → 8 routes → Upload → Chat 2-arah → Logout
```

**Hasil verifikasi terakhir:**
- ✅ 0 console errors
- ✅ 0 failed network requests
- ✅ 8 route autentikasi render bersih
- ✅ Upload lampiran → link `/uploads/...` → HTTP 200
- ✅ Chat real-time 2 arah (mahasiswa ↔ admin) tanpa duplikat
- ✅ Auth guard & logout → landing page

---

## 📦 Production Build

```bash
# Frontend
cd frontend && npm run build   # output: dist/

# Backend
cd backend
NODE_ENV=production node src/server.js
```

**Deploy tips:**
- Reverse proxy (Nginx) → frontend static + backend API + WS upgrade
- SSL termination di proxy
- PM2 / systemd untuk process management
- PostgreSQL connection pooling (PgBouncer)
- Set `NODE_ENV=production`, `FRONTEND_URL=https://yourdomain.ac.id`

---

## 🗺️ Roadmap / Rekomendasi Lanjutan

| Prioritas | Fitur | Status |
|-----------|-------|--------|
| **High** | Email verification & Forgot password | 📋 Planned |
| **High** | WhatsApp/Email notifikasi (isi `.env`) | 🏗️ Infra ready |
| **Medium** | Export PDF/CSV laporan | 📋 Planned |
| **Medium** | File preview (image/PDF inline) | 📋 Planned |
| **Low** | PWA (Service Worker, offline) | 📋 Planned |
| **Low** | i18n (ID/EN) | 📋 Planned |
| **Low** | Rate limiting per IP, CAPTCHA login | 📋 Planned |

> Detail di `docs/REKOMENDASI_IMPROVEMENT_WEBSITE.md`

---

## 🤝 Kontribusi

1. Fork repo
2. Buat branch: `git checkout -b feat/nama-fitur`
3. Commit: `git commit -m "feat: deskripsi singkat"`
4. Push: `git push origin feat/nama-fitur`
5. Buat **Pull Request**

---

## 📄 Lisensi

MIT License — lihat [LICENSE](LICENSE) (atau tambahkan file LICENSE jika perlu).

---

## 🙏 Acknowledgments

- **UIN Gus Dur** — Inspirasi & konteks domain
- **Open Source** — Express, Socket.io, Vite, PostgreSQL, dll.
- **Design Tokens** — Custom vibrant palette (Indigo→Violet gradient, Slate neutrals)

---

> **CampusCare** — *Suarakan Pengaduanmu, Wujudkan Kampus yang Lebih Baik.*