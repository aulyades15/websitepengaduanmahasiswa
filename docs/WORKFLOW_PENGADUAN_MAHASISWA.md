# Workflow Sistem Pengaduan Mahasiswa UIN Gus Dur

## 📊 Ringkasan Sistem

Website ini adalah platform pengaduan mahasiswa dengan 4 role pengguna:
- **Publik** - Pengunjung umum (bisa melihat pengaduan tanpa login)
- **Mahasiswa** - Membuat dan memantau pengaduan
- **Admin Kemahasiswaan** - Memverifikasi dan meneruskan pengaduan
- **Pimpinan** - Monitoring dan laporan eksekutif

---

## 🔄 ALUR UTAMA PENGADUAN

```
[MAHASISWA]                [ADMIN]                    [UNIT TERKAIT]           [MAHASISWA]
    |                         |                              |                       |
    | 1. Buat Pengaduan       |                              |                       |
    |------------------------>|                              |                       |
    |    Status: Menunggu     |                              |                       |
    |                         |                              |                       |
    |                         | 2. Verifikasi                |                       |
    |                         |    - Review laporan          |                       |
    |                         |    - Pilih unit terkait      |                       |
    |                         |    Status: Diproses          |                       |
    |                         |----------------------------->|                       |
    |                         |    3. Teruskan ke Unit       |                       |
    |                         |                              |                       |
    |                         |                              | 4. Tangani            |
    |                         |                              |    Pengaduan          |
    |                         |                              |                       |
    |<------------------------|<-----------------------------|                       |
    |    Notifikasi WA/Email  |                              |                       |
    |    (Update Progress)    |                              |                       |
    |                         |                              |                       |
    |                         | 5. Tandai Selesai            |                       |
    |                         |    Status: Selesai           |                       |
    |                         |----------------------------->|                       |
    |                         |                              |                       |
    |<------------------------|                              |                       |
    |    Notifikasi Selesai   |                              |                       |
    |                         |                              |                       |
    | 6. Beri Rating (1-5⭐)   |                              |                       |
    |------------------------>|                              |                       |
    |                         |                              |                       |
```

---

## 📝 DETAIL WORKFLOW PER ROLE

### 1️⃣ PUBLIK (Tanpa Login)

**Landing Page**
```
┌─────────────────────────────────────┐
│  Hero Section                       │
│  - Tagline: "Suarakan pengaduanmu"  │
│  - Search Bar (cari pengaduan)       │
│  - CTA: Sampaikan Pengaduan         │
├─────────────────────────────────────┤
│  Statistik                          │
│  ├─ Total Pengaduan                 │
│  ├─ Sedang Ditangani                │
│  ├─ Selesai                         │
│  └─ Rating Kepuasan                 │
├─────────────────────────────────────┤
│  Kategori (5 jenis)                 │
│  ├─ Akademik                        │
│  ├─ Fasilitas                       │
│  ├─ Keuangan                        │
│  ├─ Dosen                           │
│  └─ Bullying                        │
├─────────────────────────────────────┤
│  List Pengaduan Terbaru             │
│  - Dapat dicari                     │
│  - Nama pelapor disembunyikan       │
│  - Percakapan tidak terlihat        │
└─────────────────────────────────────┘
```

---

### 2️⃣ MAHASISWA

#### A. Registrasi & Login

```
Belum Punya Akun
    ↓
[Form Registrasi]
├─ NIM (8-12 digit)
├─ Nama Lengkap
├─ Program Studi
├─ Kata Sandi (min 8 karakter)
└─ Konfirmasi Kata Sandi
    ↓
Validasi:
- NIM belum terdaftar
- Format NIM valid
- Password match
- Password di-hash (SHA-256)
    ↓
Akun Tersimpan (LocalStorage)
    ↓
Auto Login

Sudah Punya Akun
    ↓
[Form Login]
├─ NIM
└─ Kata Sandi
    ↓
Verifikasi Hash
    ↓
Masuk ke Dashboard
```

#### B. Dashboard Mahasiswa

```
┌──────────────────────────────────┐
│  Header                          │
│  ├─ Nama Mahasiswa               │
│  ├─ NIM                          │
│  ├─ Program Studi                │
│  └─ [Buat Pengaduan Baru]        │
├──────────────────────────────────┤
│  Riwayat Pengaduan              │
│  ├─ Nomor Pengaduan              │
│  ├─ Judul                        │
│  ├─ Status Badge                 │
│  ├─ Tanggal                      │
│  └─ Kategori                     │
└──────────────────────────────────┘
```

#### C. Buat Pengaduan Baru

```
[Form Input]
├─ Judul Singkat (max 90 karakter)
├─ Kategori Dropdown:
│   ├─ Akademik
│   ├─ Fasilitas
│   ├─ Keuangan
│   ├─ Dosen
│   └─ Bullying
├─ Deskripsi Lengkap (textarea)
├─ Upload Bukti (opsional)
│   └─ Image/PDF
└─ ☐ Kirim sebagai Anonim
    ↓
Validasi:
- Judul & deskripsi wajib diisi
    ↓
Generate ID: PM-DDMM-XXXX
    ↓
Status: "Menunggu"
Auto-flag "Urgent" jika kategori = Bullying
    ↓
Simpan ke Database (LocalStorage)
    ↓
Notifikasi: "Pengaduan terkirim"
    ↓
Redirect ke Detail Pengaduan
```

#### D. Detail & Monitoring Pengaduan

```
┌────────────────────────────────────┐
│  Header Info                       │
│  ├─ Nomor Pengaduan                │
│  ├─ Status Badge                   │
│  ├─ Tag "Mendesak" (jika urgent)   │
│  ├─ Judul                          │
│  ├─ Kategori                       │
│  └─ Unit Penanganan                │
├────────────────────────────────────┤
│  Deskripsi                         │
│  - Cerita lengkap                  │
│  - Lampiran (jika ada)             │
├────────────────────────────────────┤
│  Percakapan Chat                   │
│  ├─ Pesan dari Admin               │
│  ├─ Pesan dari Mahasiswa           │
│  └─ [Input] Tulis Pesan Baru       │
├────────────────────────────────────┤
│  Timeline Status                   │
│  ├─ Pengaduan Diterima            │
│  ├─ Diverifikasi Admin            │
│  ├─ Diteruskan ke Unit            │
│  └─ Selesai                        │
├────────────────────────────────────┤
│  Rating (jika status = Selesai)    │
│  └─ ⭐⭐⭐⭐⭐ (1-5 bintang)          │
└────────────────────────────────────┘
```

---

### 3️⃣ ADMIN KEMAHASISWAAN

#### A. Dashboard Admin

```
┌────────────────────────────────────┐
│  Statistik Cards                   │
│  ├─ Menunggu (perlu aksi)          │
│  ├─ Diproses (ongoing)             │
│  ├─ Selesai                        │
│  └─ Ditolak                        │
├────────────────────────────────────┤
│  Filter Tabs                       │
│  [Semua][Menunggu][Diproses]...    │
├────────────────────────────────────┤
│  List Pengaduan                    │
│  ├─ Nomor Pengaduan                │
│  ├─ Judul                          │
│  ├─ Nama Pelapor (atau "Anonim")   │
│  ├─ NIM (jika tidak anonim)        │
│  ├─ Status Badge                   │
│  └─ Tag "Mendesak"                 │
├────────────────────────────────────┤
│  Chart: Pengaduan per Kategori     │
│  - Bar chart horizontal            │
└────────────────────────────────────┘
```

#### B. Workflow Verifikasi

```
Pengaduan Status: "Menunggu"
    ↓
Admin Buka Detail
    ↓
Review:
├─ Baca deskripsi
├─ Cek bukti lampiran
├─ Identifikasi kategori
└─ Tentukan unit penanganan
    ↓
[Pilihan 1: VERIFIKASI]
├─ Pilih Unit Terkait:
│   ├─ Bagian Akademik
│   ├─ Sarana & Prasarana
│   ├─ Bagian Keuangan
│   ├─ Wakil Dekan I
│   └─ Satgas Kekerasan Kampus
├─ Klik "Verifikasi dan Teruskan"
├─ Status → "Diproses"
├─ Log: "Diverifikasi admin"
├─ Log: "Diteruskan ke [Unit]"
└─ Notifikasi WA/Email ke Mahasiswa
    ↓
[Pilihan 2: TOLAK]
├─ Klik "Tolak"
├─ Status → "Ditolak"
├─ Log: "Ditolak: tidak memenuhi syarat"
└─ Notifikasi WA/Email ke Mahasiswa
```

#### C. Tindak Lanjut Pengaduan Diproses

```
Status: "Diproses"
    ↓
Admin Monitoring:
├─ Chat dengan Mahasiswa
├─ Update progress
└─ Koordinasi dengan unit terkait
    ↓
Unit Selesai Tangani
    ↓
Admin: "Tandai Selesai"
├─ Status → "Selesai"
├─ Log: "Selesai ditangani"
└─ Notifikasi WA/Email ke Mahasiswa
```

---

### 4️⃣ PIMPINAN

#### Dashboard Eksekutif

```
┌────────────────────────────────────┐
│  KPI Cards                         │
│  ├─ Total Pengaduan                │
│  ├─ Tingkat Penyelesaian (%)       │
│  └─ Kepuasan Mahasiswa (avg /5)    │
├────────────────────────────────────┤
│  Pengaduan Mendesak                │
│  └─ Filter: Urgent + Belum Selesai │
├────────────────────────────────────┤
│  Analytics                         │
│  ├─ Chart: Per Kategori            │
│  └─ Chart: Per Status              │
└────────────────────────────────────┘

Pimpinan HANYA bisa:
- View data (read-only)
- Monitoring progress
- Tidak bisa edit/update status
```

---

## 🗂️ KATEGORI & UNIT MAPPING

| Kategori   | Unit Penanganan               | Auto-Urgent |
|------------|-------------------------------|-------------|
| Akademik   | Bagian Akademik              | ❌          |
| Fasilitas  | Sarana & Prasarana           | ❌          |
| Keuangan   | Bagian Keuangan              | ❌          |
| Dosen      | Wakil Dekan I                | ❌          |
| Bullying   | Satgas Kekerasan Kampus      | ✅ Ya       |

---

## 📊 STATUS PENGADUAN

```
┌─────────────┐
│  Menunggu   │ ← Pengaduan baru masuk
└──────┬──────┘
       │
       ├─────────────────────┐
       │                     │
       ↓                     ↓
┌─────────────┐       ┌─────────────┐
│  Diproses   │       │  Ditolak    │ ← Admin tolak
└──────┬──────┘       └─────────────┘   (tidak valid)
       │
       ↓
┌─────────────┐
│  Selesai    │ ← Mahasiswa beri rating
└─────────────┘
```

**Transisi Status:**
1. **Menunggu** → Diproses (Admin verifikasi & teruskan)
2. **Menunggu** → Ditolak (Admin tolak)
3. **Diproses** → Selesai (Admin tandai selesai)

---

## 🔔 SISTEM NOTIFIKASI

```
Event Trigger               → Penerima    → Channel
────────────────────────────────────────────────────
Pengaduan Baru             → Admin       → Dashboard
Status → Diproses          → Mahasiswa   → WA + Email
Admin Kirim Chat           → Mahasiswa   → WA + Email
Status → Selesai           → Mahasiswa   → WA + Email
Status → Ditolak           → Mahasiswa   → WA + Email
Mahasiswa Kirim Chat       → Admin       → Dashboard
```

---

## 🔐 SISTEM KEAMANAN

### Authentication
```
Password Storage: SHA-256 Hash
Format: hash(NIM + ":" + Password)

Login Flow:
1. Input NIM + Password
2. Cari user dengan NIM
3. Hash input password
4. Compare hash
5. Jika match → Login berhasil
```

### Privacy (Anonim)
```
Anonim = true:
├─ Nama ditampilkan: "Anonim"
├─ NIM TIDAK ditampilkan ke Admin
├─ Identitas tersimpan di sistem (untuk notifikasi)
└─ Admin & Pimpinan hanya lihat "Anonim"

Anonim = false:
├─ Nama lengkap ditampilkan
└─ NIM ditampilkan ke Admin & Pimpinan
```

### Data Storage
- LocalStorage digunakan untuk:
  - User accounts (`cc_u`)
  - Logged user (`cc_me`)
  - Pengaduan data (`cc_t`)

---

## 🎨 FITUR INTERAKTIF

### Search & Filter
- **Publik**: Search judul/kategori/nomor di landing page
- **Mahasiswa**: Lihat riwayat pengaduan sendiri
- **Admin**: Filter by status (Semua/Menunggu/Diproses/Selesai/Ditolak)
- **Pimpinan**: Filter pengaduan mendesak

### Real-time Chat
```
[Mahasiswa] ←→ [Admin]
- Chat 2 arah
- Timestamp otomatis
- Bubble chat berbeda warna
- Input + Enter untuk kirim
```

### Rating System
```
Kondisi:
- Status = "Selesai"
- Role = Mahasiswa (pemilik pengaduan)

UI: ⭐⭐⭐⭐⭐ (1-5 bintang)
Klik bintang → Langsung tersimpan
```

---

## 📱 RESPONSIVE DESIGN

```
Desktop (>760px):
- Grid 2 kolom
- Full hero section
- Side-by-side layout

Mobile (≤760px):
- Single column
- Stack vertical
- Simplified navigation
- Touch-optimized buttons
```

---

## 🎯 USER FLOW LENGKAP

### Mahasiswa Pertama Kali
```
1. Kunjungi website (publik)
2. Klik "Sampaikan Pengaduan"
3. Redirect ke login
4. Klik "Daftar"
5. Isi form registrasi
6. Auto login
7. Redirect dashboard mahasiswa
8. Klik "Buat Pengaduan Baru"
9. Isi form pengaduan
10. Submit
11. Dapatkan nomor pengaduan
12. Monitoring status via dashboard
13. Chat dengan admin
14. Dapat notifikasi (simulasi)
15. Status berubah → Selesai
16. Beri rating
```

### Admin Workflow
```
1. Masuk sebagai Admin (demo)
2. Lihat dashboard
3. Filter "Menunggu"
4. Buka detail pengaduan
5. Review laporan
6. Pilih unit terkait
7. Klik "Verifikasi dan Teruskan"
8. Monitor progress
9. Chat dengan mahasiswa
10. Klik "Tandai Selesai"
```

---

## 🔧 TEKNOLOGI STACK

**Frontend:**
- Pure HTML5 + CSS3 + Vanilla JavaScript
- No framework dependencies
- Single Page Application (SPA)
- Client-side routing

**Styling:**
- CSS Custom Properties (CSS Variables)
- Dark/Light mode support
- Responsive Grid & Flexbox
- Google Fonts (Bricolage Grotesque + IBM Plex Sans)

**Data Management:**
- LocalStorage API
- JSON data structure
- Client-side persistence

**Security:**
- Web Crypto API (SHA-256)
- Password hashing
- XSS protection (escaping function)

---

## 📈 ANALYTICS & REPORTING

### Statistik Dashboard
```
Metrics:
├─ Total Pengaduan
├─ Pengaduan Aktif (Menunggu + Diproses)
├─ Pengaduan Selesai
├─ Tingkat Penyelesaian (%)
├─ Rating Rata-rata Kepuasan
└─ Distribusi per Kategori
```

### Charts
- Bar Chart: Pengaduan per Kategori
- Bar Chart: Pengaduan per Status
- Color-coded berdasarkan status

---

## 🚀 DEMO DATA

**Sample User:**
```
NIM: 2210511042
Nama: Rayhan Pratama
Password: mahasiswa123
Prodi: Teknik Informatika
```

**Sample Pengaduan:**
```
1. PM-2610-0001: AC Rusak (Selesai, Rating 5/5)
2. PM-2610-0002: Nilai Belum Keluar (Diproses)
3. PM-2610-0003: Bullying (Menunggu, Anonim, Urgent)
4. PM-2610-0004: Keringanan UKT (Menunggu)
```

---

## 📋 CHECKLIST FITUR

✅ Multi-role system (Publik, Mahasiswa, Admin, Pimpinan)  
✅ Registrasi & login mahasiswa  
✅ Password hashing (SHA-256)  
✅ Buat pengaduan baru  
✅ Upload file bukti  
✅ Mode anonim  
✅ Auto-detect urgent (kategori Bullying)  
✅ Admin verifikasi & routing  
✅ Chat 2-arah  
✅ Status tracking timeline  
✅ Rating & feedback  
✅ Search & filter  
✅ Dashboard analytics  
✅ Responsive design  
✅ Dark mode support  
✅ Notifikasi (simulasi)  
✅ Persistent data (LocalStorage)  

---

## 🎓 BEST PRACTICES IMPLEMENTED

1. **Accessibility**: ARIA labels, keyboard navigation, semantic HTML
2. **Security**: Input escaping, password hashing, client-side validation
3. **UX**: Toast notifications, loading states, error messages
4. **Performance**: Single HTML file, minimal dependencies, lazy rendering
5. **Privacy**: Anonymous reporting, data protection
6. **Scalability**: Modular functions, clean code structure

---

## 💡 REKOMENDASI PENGEMBANGAN LANJUTAN

### Backend Integration
```
Saat ini: Client-side only (LocalStorage)
Upgrade ke:
├─ REST API / GraphQL
├─ Database (PostgreSQL/MySQL)
├─ Authentication JWT
└─ Real notification (Firebase, Twilio)
```

### Fitur Tambahan
- [ ] Email verification saat registrasi
- [ ] Forgot password functionality
- [ ] File preview untuk lampiran
- [ ] Export laporan ke PDF
- [ ] Multi-bahasa (i18n)
- [ ] Push notifications
- [ ] Advanced filtering & sorting
- [ ] Bulk actions untuk admin
- [ ] SLA timer (countdown 2x24 jam)
- [ ] Escalation otomatis jika overdue

### Security Enhancement
- [ ] Rate limiting
- [ ] CAPTCHA untuk form
- [ ] Two-factor authentication
- [ ] Audit log
- [ ] HTTPS enforcement
- [ ] Content Security Policy

### Performance Optimization
- [ ] Lazy loading images
- [ ] Virtual scrolling untuk list panjang
- [ ] Service Worker (PWA)
- [ ] Asset compression
- [ ] CDN untuk static files

---

**© 2026 - Sistem Pengaduan Mahasiswa UIN K.H. Abdurrahman Wahid Pekalongan**

---

**File ini berisi dokumentasi lengkap workflow sistem pengaduan mahasiswa.**
**Untuk pertanyaan atau saran, hubungi Tim Pengembangan.**
