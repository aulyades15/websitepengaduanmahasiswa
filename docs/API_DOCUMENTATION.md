# 🚀 REST API Documentation
## Sistem Pengaduan Mahasiswa UIN Gus Dur

**Base URL:** `https://api.pengaduan.uingusdur.ac.id/v1`  
**Version:** 1.0.0  
**Last Updated:** October 22, 2026

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Pengaduan](#pengaduan)
4. [Chat & Messages](#chat--messages)
5. [Notifications](#notifications)
6. [Master Data](#master-data)
7. [Analytics & Reports](#analytics--reports)
8. [File Upload](#file-upload)
9. [Settings](#settings)
10. [Webhooks](#webhooks)

---

## 🔐 Authentication

### Register

```http
POST /auth/register
Content-Type: application/json

{
  "nim": "2210511042",
  "nama": "Rayhan Pratama",
  "email": "rayhan@student.uingusdur.ac.id",
  "phone": "081234567890",
  "prodi_id": 1,
  "password": "SecurePassword123",
  "password_confirmation": "SecurePassword123"
}
```

**Response 201 Created:**
```json
{
  "success": true,
  "message": "Akun berhasil dibuat. Silakan cek email untuk verifikasi.",
  "data": {
    "user": {
      "id": 123,
      "nim": "2210511042",
      "nama": "Rayhan Pratama",
      "email": "rayhan@student.uingusdur.ac.id",
      "role": "mahasiswa",
      "is_verified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "nim": "2210511042",
  "password": "SecurePassword123"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "nim": "2210511042",
      "nama": "Rayhan Pratama",
      "email": "rayhan@student.uingusdur.ac.id",
      "role": "mahasiswa",
      "prodi": {
        "id": 1,
        "nama": "Teknik Informatika",
        "fakultas": "Fakultas Teknologi Informasi"
      },
      "avatar_url": "https://cdn.uingusdur.ac.id/avatars/123.jpg"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2026-10-23T19:08:22.936Z"
  }
}
```

---

### Logout

```http
POST /auth/logout
Authorization: Bearer {token}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Berhasil logout"
}
```

---

### Forgot Password

```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "rayhan@student.uingusdur.ac.id"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Link reset password telah dikirim ke email Anda"
}
```

---

### Reset Password

```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_here",
  "password": "NewPassword123",
  "password_confirmation": "NewPassword123"
}
```

---

## 👤 Users

### Get Current User Profile

```http
GET /users/me
Authorization: Bearer {token}
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "nim": "2210511042",
    "nama": "Rayhan Pratama",
    "email": "rayhan@student.uingusdur.ac.id",
    "phone": "081234567890",
    "role": "mahasiswa",
    "prodi": {
      "id": 1,
      "nama": "Teknik Informatika",
      "fakultas": "Fakultas Teknologi Informasi"
    },
    "avatar_url": "https://cdn.uingusdur.ac.id/avatars/123.jpg",
    "is_verified": true,
    "created_at": "2026-09-15T10:30:00Z",
    "stats": {
      "total_pengaduan": 5,
      "pengaduan_selesai": 3,
      "pengaduan_aktif": 2,
      "avg_rating": 4.5
    }
  }
}
```

---

### Update Profile

```http
PUT /users/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "nama": "Rayhan Pratama Updated",
  "phone": "081234567899",
  "email": "newemail@student.uingusdur.ac.id"
}
```

---

### Update Avatar

```http
POST /users/me/avatar
Authorization: Bearer {token}
Content-Type: multipart/form-data

avatar: (binary file)
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "avatar_url": "https://cdn.uingusdur.ac.id/avatars/123.jpg"
  }
}
```

---

### Change Password

```http
POST /users/me/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "current_password": "OldPassword123",
  "new_password": "NewPassword123",
  "new_password_confirmation": "NewPassword123"
}
```

---

## 📝 Pengaduan

### Create Pengaduan

```http
POST /pengaduan
Authorization: Bearer {token}
Content-Type: multipart/form-data

judul: AC ruang kelas B2.04 mati sejak 2 minggu
deskripsi: AC tidak menyala, kelas sangat panas saat kuliah siang. Sudah dilaporkan ke teknisi tapi belum ada tindak lanjut.
kategori_id: 2
lokasi: Gedung B Lantai 2, Ruang B2.04
is_anonim: false
files[]: (binary file 1)
files[]: (binary file 2)
```

**Response 201 Created:**
```json
{
  "success": true,
  "message": "Pengaduan berhasil dikirim",
  "data": {
    "id": 456,
    "kode_pengaduan": "PM-2210-0005",
    "judul": "AC ruang kelas B2.04 mati sejak 2 minggu",
    "deskripsi": "AC tidak menyala...",
    "kategori": {
      "id": 2,
      "nama": "Fasilitas",
      "icon": "🏫"
    },
    "status": "menunggu",
    "is_urgent": false,
    "is_anonim": false,
    "sla": {
      "target_hours": 48,
      "deadline": "2026-10-24T19:08:22.936Z",
      "hours_remaining": 48.0,
      "percentage": 0
    },
    "attachments": [
      {
        "id": 789,
        "filename": "foto_ac.jpg",
        "url": "https://cdn.uingusdur.ac.id/attachments/foto_ac.jpg",
        "file_size": 245678,
        "mime_type": "image/jpeg"
      }
    ],
    "created_at": "2026-10-22T19:08:22.936Z"
  }
}
```

---

### Get All Pengaduan (List dengan Filter)

```http
GET /pengaduan?page=1&limit=20&status=menunggu&kategori_id=2&is_urgent=true&sort=created_at&order=desc
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `status` (menunggu|diproses|selesai|ditolak)
- `kategori_id` (integer)
- `is_urgent` (boolean)
- `is_overdue` (boolean)
- `is_anonim` (boolean - admin only)
- `search` (search by kode, judul, nama)
- `date_from` (YYYY-MM-DD)
- `date_to` (YYYY-MM-DD)
- `sort` (created_at|updated_at|sla_deadline|rating)
- `order` (asc|desc)

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 456,
        "kode_pengaduan": "PM-2210-0005",
        "judul": "AC ruang kelas B2.04 mati",
        "kategori": {
          "id": 2,
          "nama": "Fasilitas",
          "icon": "🏫"
        },
        "status": "menunggu",
        "is_urgent": false,
        "is_overdue": false,
        "pelapor": {
          "nama": "Rayhan Pratama",
          "nim": "2210511042"
        },
        "sla": {
          "hours_remaining": 46.5,
          "percentage": 3.1,
          "color": "green"
        },
        "chat_count": 0,
        "attachment_count": 1,
        "created_at": "2026-10-22T19:08:22.936Z",
        "updated_at": "2026-10-22T19:08:22.936Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 85,
      "total_pages": 5,
      "has_next": true,
      "has_prev": false
    },
    "summary": {
      "total": 85,
      "menunggu": 12,
      "diproses": 25,
      "selesai": 45,
      "ditolak": 3,
      "urgent": 8,
      "overdue": 5
    }
  }
}
```

---

### Get Single Pengaduan

```http
GET /pengaduan/{id}
Authorization: Bearer {token}
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "kode_pengaduan": "PM-2210-0005",
    "judul": "AC ruang kelas B2.04 mati sejak 2 minggu",
    "deskripsi": "AC tidak menyala, kelas sangat panas...",
    "lokasi": "Gedung B Lantai 2, Ruang B2.04",
    "kategori": {
      "id": 2,
      "nama": "Fasilitas",
      "icon": "🏫",
      "sla_hours": 48
    },
    "status": "diproses",
    "is_urgent": false,
    "is_overdue": false,
    "is_anonim": false,
    "pelapor": {
      "id": 123,
      "nama": "Rayhan Pratama",
      "nim": "2210511042",
      "prodi": "Teknik Informatika",
      "avatar_url": "https://cdn.uingusdur.ac.id/avatars/123.jpg"
    },
    "unit": {
      "id": 2,
      "nama": "Sarana & Prasarana",
      "email": "sarpras@uingusdur.ac.id",
      "pic_name": "Pak Budi"
    },
    "assigned_to": {
      "id": 45,
      "nama": "Admin Sarpras",
      "role": "admin"
    },
    "sla": {
      "target_hours": 48,
      "deadline": "2026-10-24T19:08:22.936Z",
      "hours_since_created": 24.5,
      "hours_remaining": 23.5,
      "percentage": 51.0,
      "color": "yellow",
      "is_overdue": false
    },
    "attachments": [
      {
        "id": 789,
        "filename": "foto_ac.jpg",
        "original_filename": "WhatsApp Image 2026-10-22.jpg",
        "url": "https://cdn.uingusdur.ac.id/attachments/foto_ac.jpg",
        "thumbnail_url": "https://cdn.uingusdur.ac.id/thumbnails/foto_ac_thumb.jpg",
        "file_size": 245678,
        "mime_type": "image/jpeg",
        "file_type": "image",
        "uploaded_at": "2026-10-22T19:08:22.936Z"
      }
    ],
    "status_history": [
      {
        "id": 100,
        "status_from": null,
        "status_to": "menunggu",
        "changed_by": "Rayhan Pratama",
        "notes": "Pengaduan diterima",
        "created_at": "2026-10-22T19:08:22.936Z"
      },
      {
        "id": 101,
        "status_from": "menunggu",
        "status_to": "diproses",
        "changed_by": "Admin Sarpras",
        "notes": "Diverifikasi dan diteruskan ke unit",
        "created_at": "2026-10-22T20:15:00.000Z"
      }
    ],
    "chat_summary": {
      "total_messages": 3,
      "unread_count": 1,
      "last_message": {
        "sender": "Admin Sarpras",
        "message": "Teknisi sudah dijadwalkan untuk Kamis besok",
        "created_at": "2026-10-22T21:00:00.000Z"
      }
    },
    "rating": null,
    "feedback": null,
    "views_count": 15,
    "created_at": "2026-10-22T19:08:22.936Z",
    "updated_at": "2026-10-22T21:00:00.000Z"
  }
}
```

---

### Get My Pengaduan

```http
GET /pengaduan/my?status=menunggu
Authorization: Bearer {token}
```

---

### Update Pengaduan Status (Admin Only)

```http
PUT /pengaduan/{id}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "diproses",
  "unit_id": 2,
  "notes": "Diteruskan ke Sarana & Prasarana"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Status berhasil diupdate",
  "data": {
    "id": 456,
    "kode_pengaduan": "PM-2210-0005",
    "status": "diproses",
    "unit": {
      "id": 2,
      "nama": "Sarana & Prasarana"
    },
    "updated_at": "2026-10-22T21:00:00.000Z"
  }
}
```

---

### Verify Pengaduan (Admin)

```http
POST /pengaduan/{id}/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "unit_id": 2,
  "notes": "Pengaduan valid, diteruskan ke unit terkait"
}
```

---

### Reject Pengaduan (Admin)

```http
POST /pengaduan/{id}/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Pengaduan tidak lengkap. Mohon sertakan bukti foto."
}
```

---

### Resolve Pengaduan (Admin)

```http
POST /pengaduan/{id}/resolve
Authorization: Bearer {token}
Content-Type: application/json

{
  "resolution_note": "AC sudah diperbaiki oleh teknisi. Sudah dicek dan berfungsi normal."
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Pengaduan berhasil diselesaikan",
  "data": {
    "id": 456,
    "kode_pengaduan": "PM-2210-0005",
    "status": "selesai",
    "resolved_at": "2026-10-22T22:00:00.000Z",
    "resolved_by": {
      "id": 45,
      "nama": "Admin Sarpras"
    }
  }
}
```

---

### Rate Pengaduan (Mahasiswa)

```http
POST /pengaduan/{id}/rate
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 5,
  "feedback": "Responnya cepat dan solusinya memuaskan. Terima kasih!"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Terima kasih atas penilaiannya!",
  "data": {
    "rating": 5,
    "feedback": "Responnya cepat...",
    "rated_at": "2026-10-23T10:00:00.000Z"
  }
}
```

---

### Bulk Actions (Admin)

```http
POST /pengaduan/bulk/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "pengaduan_ids": [456, 457, 458],
  "unit_id": 2,
  "notes": "Verifikasi massal"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "3 pengaduan berhasil diverifikasi",
  "data": {
    "success_count": 3,
    "failed_count": 0,
    "results": [
      {
        "id": 456,
        "kode_pengaduan": "PM-2210-0005",
        "success": true
      },
      {
        "id": 457,
        "kode_pengaduan": "PM-2210-0006",
        "success": true
      }
    ]
  }
}
```

---

### Export Pengaduan

```http
GET /pengaduan/export?format=csv&status=selesai&date_from=2026-10-01&date_to=2026-10-31
Authorization: Bearer {token}
```

**Query Parameters:**
- `format` (csv|excel|pdf)
- `status`, `kategori_id`, `date_from`, `date_to` (filters)

**Response:** File download

---

## 💬 Chat & Messages

### Get Chat Messages

```http
GET /pengaduan/{pengaduan_id}/messages?page=1&limit=50
Authorization: Bearer {token}
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1001,
        "sender": {
          "id": 45,
          "nama": "Admin Sarpras",
          "role": "admin",
          "avatar_url": "https://cdn.uingusdur.ac.id/avatars/45.jpg"
        },
        "message": "Teknisi sudah dijadwalkan untuk Kamis besok pukul 10.00 WIB.",
        "is_internal": false,
        "is_read": false,
        "attachments": [],
        "created_at": "2026-10-22T21:00:00.000Z"
      },
      {
        "id": 1002,
        "sender": {
          "id": 123,
          "nama": "Rayhan Pratama",
          "role": "mahasiswa",
          "avatar_url": "https://cdn.uingusdur.ac.id/avatars/123.jpg"
        },
        "message": "Baik, terima kasih infonya!",
        "is_internal": false,
        "is_read": true,
        "read_at": "2026-10-22T21:05:00.000Z",
        "attachments": [],
        "created_at": "2026-10-22T21:03:00.000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 50,
      "total": 2,
      "has_next": false
    }
  }
}
```

---

### Send Message

```http
POST /pengaduan/{pengaduan_id}/messages
Authorization: Bearer {token}
Content-Type: multipart/form-data

message: Terima kasih sudah ditindaklanjuti
is_internal: false
attachments[]: (optional file)
```

**Response 201 Created:**
```json
{
  "success": true,
  "data": {
    "id": 1003,
    "sender": {
      "id": 123,
      "nama": "Rayhan Pratama",
      "role": "mahasiswa"
    },
    "message": "Terima kasih sudah ditindaklanjuti",
    "is_internal": false,
    "created_at": "2026-10-22T22:00:00.000Z"
  }
}
```

---

### Mark Messages as Read

```http
POST /pengaduan/{pengaduan_id}/messages/read
Authorization: Bearer {token}
Content-Type: application/json

{
  "message_ids": [1001, 1002]
}
```

---

### Get Message Templates (Admin)

```http
GET /message-templates?kategori_id=2
Authorization: Bearer {token}
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "title": "Tindak Lanjut Standar",
      "content": "Terima kasih laporannya. Kami sedang menindaklanjuti pengaduan Anda dan akan memberikan update dalam 1x24 jam.",
      "kategori": {
        "id": 2,
        "nama": "Fasilitas"
      },
      "usage_count": 145
    },
    {
      "id": 11,
      "title": "Sudah Diteruskan",
      "content": "Pengaduan Anda sudah diteruskan ke unit terkait. Mohon tunggu update selanjutnya.",
      "kategori": null,
      "usage_count": 89
    }
  ]
}
```

---

### Create Message Template (Admin)

```http
POST /message-templates
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Custom Template",
  "content": "Ini adalah template custom...",
  "kategori_id": 2
}
```

---

## 🔔 Notifications

### Get Notifications

```http
GET /notifications?is_read=false&page=1&limit=20
Authorization: Bearer {token}
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 5001,
        "type": "status_berubah",
        "title": "Status Pengaduan Berubah",
        "message": "Pengaduan PM-2210-0005 telah diubah menjadi 'Diproses'",
        "action_url": "/pengaduan/456",
        "pengaduan": {
          "id": 456,
          "kode_pengaduan": "PM-2210-0005",
          "judul": "AC ruang kelas B2.04 mati"
        },
        "is_read": false,
        "created_at": "2026-10-22T21:00:00.000Z"
      },
      {
        "id": 5002,
        "type": "chat_baru",
        "title": "Pesan Baru",
        "message": "Anda menerima pesan baru pada pengaduan PM-2210-0005",
        "action_url": "/pengaduan/456/chat",
        "pengaduan": {
          "id": 456,
          "kode_pengaduan": "PM-2210-0005"
        },
        "is_read": false,
        "created_at": "2026-10-22T21:01:00.000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total": 15,
      "unread_count": 8
    }
  }
}
```

---

### Mark as Read

```http
PUT /notifications/{id}/read
Authorization: Bearer {token}
```

---

### Mark All as Read

```http
POST /notifications/read-all
Authorization: Bearer {token}
```

---

### Get Notification Preferences

```http
GET /users/me/notification-preferences
Authorization: Bearer {token}
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "channel": "email",
      "notification_type": "status_berubah",
      "is_enabled": true
    },
    {
      "channel": "whatsapp",
      "notification_type": "chat_baru",
      "is_enabled": true
    },
    {
      "channel": "push",
      "notification_type": "deadline_mendekat",
      "is_enabled": false
    }
  ]
}
```

---

### Update Notification Preferences

```http
PUT /users/me/notification-preferences
Authorization: Bearer {token}
Content-Type: application/json

{
  "preferences": [
    {
      "channel": "email",
      "notification_type": "status_berubah",
      "is_enabled": true
    }
  ]
}
```

---

## 🗂️ Master Data

### Get Fakultas

```http
GET /master/fakultas
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "kode": "FTI",
      "nama": "Fakultas Teknologi Informasi",
      "is_active": true
    }
  ]
}
```

---

### Get Program Studi

```http
GET /master/prodi?fakultas_id=1
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "kode": "TI",
      "nama": "Teknik Informatika",
      "jenjang": "S1",
      "fakultas": {
        "id": 1,
        "nama": "Fakultas Teknologi Informasi"
      }
    }
  ]
}
```

---

### Get Kategori Pengaduan

```http
GET /master/kategori
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nama": "Akademik",
      "deskripsi": "Masalah terkait perkuliahan, nilai, dosen",
      "icon": "📚",
      "is_urgent_default": false,
      "sla_hours": 48,
      "default_unit": {
        "id": 1,
        "nama": "Bagian Akademik"
      }
    }
  ]
}
```

---

### Get Unit Penanganan

```http
GET /master/unit
```

---

### Get FAQ

```http
GET /faq?kategori_id=2
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "question": "Berapa lama pengaduan saya diproses?",
      "answer": "Maksimal 2x24 jam kerja (48 jam) untuk pengaduan normal...",
      "kategori": {
        "id": 2,
        "nama": "Fasilitas"
      },
      "view_count": 1234
    }
  ]
}
```

---

## 📊 Analytics & Reports

### Dashboard Stats (Summary)

```http
GET /analytics/dashboard
Authorization: Bearer {token}
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_pengaduan": 256,
      "menunggu": 15,
      "diproses": 48,
      "selesai": 185,
      "ditolak": 8,
      "urgent_aktif": 5,
      "overdue": 3,
      "completion_rate": 72.3,
      "avg_rating": 4.6
    },
    "today": {
      "pengaduan_masuk": 12,
      "pengaduan_selesai": 8,
      "avg_response_hours": 4.2
    },
    "weekly_trend": [
      {
        "date": "2026-10-16",
        "total": 8,
        "selesai": 6
      },
      {
        "date": "2026-10-17",
        "total": 12,
        "selesai": 9
      }
    ],
    "by_kategori": [
      {
        "kategori": "Akademik",
        "total": 85,
        "percentage": 33.2
      },
      {
        "kategori": "Fasilitas",
        "total": 72,
        "percentage": 28.1
      }
    ],
    "by_status": [
      {
        "status": "selesai",
        "count": 185,
        "percentage": 72.3
      }
    ],
    "top_urgent": [
      {
        "id": 460,
        "kode_pengaduan": "PM-2210-0009",
        "judul": "Perundungan di kelas",
        "kategori": "Bullying",
        "sla_remaining_hours": 8.5
      }
    ]
  }
}
```

---

### Performance by Unit

```http
GET /analytics/performance/unit?date_from=2026-10-01&date_to=2026-10-31
Authorization: Bearer {token} (role: admin/pimpinan)
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "unit": {
        "id": 2,
        "nama": "Sarana & Prasarana"
      },
      "metrics": {
        "total_pengaduan": 45,
        "selesai": 38,
        "completion_rate": 84.4,
        "avg_response_hours": 6.8,
        "avg_resolution_hours": 28.5,
        "overdue_count": 2,
        "avg_rating": 4.5
      }
    }
  ]
}
```

---

### Trend Analysis

```http
GET /analytics/trends?period=monthly&months=6
Authorization: Bearer {token}
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "labels": ["Mei", "Jun", "Jul", "Ags", "Sep", "Okt"],
    "datasets": [
      {
        "label": "Total Pengaduan",
        "data": [42, 38, 51, 45, 48, 52]
      },
      {
        "label": "Selesai",
        "data": [35, 32, 44, 38, 41, 45]
      }
    ]
  }
}
```

---

### SLA Performance

```http
GET /analytics/sla?date_from=2026-10-01&date_to=2026-10-31
Authorization: Bearer {token}
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "met_sla": 178,
      "missed_sla": 12,
      "sla_compliance_rate": 93.7,
      "avg_resolution_hours": 32.5
    },
    "by_kategori": [
      {
        "kategori": "Akademik",
        "sla_compliance_rate": 95.2,
        "avg_resolution_hours": 28.3
      }
    ]
  }
}
```

---

### Rating Analysis

```http
GET /analytics/ratings?date_from=2026-10-01&date_to=2026-10-31
Authorization: Bearer {token}
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "avg_rating": 4.6,
      "total_ratings": 145,
      "rating_distribution": {
        "1": 2,
        "2": 5,
        "3": 12,
        "4": 48,
        "5": 78
      }
    },
    "by_kategori": [
      {
        "kategori": "Fasilitas",
        "avg_rating": 4.7,
        "total": 45
      }
    ],
    "top_feedback": [
      {
        "keyword": "cepat",
        "count": 52
      },
      {
        "keyword": "responsif",
        "count": 38
      }
    ]
  }
}
```

---

## 📤 File Upload

### Upload File

```http
POST /upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: (binary)
type: pengaduan|chat|avatar
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "filename": "abc123.jpg",
    "original_filename": "foto_ac.jpg",
    "url": "https://cdn.uingusdur.ac.id/uploads/abc123.jpg",
    "thumbnail_url": "https://cdn.uingusdur.ac.id/thumbnails/abc123_thumb.jpg",
    "file_size": 245678,
    "mime_type": "image/jpeg",
    "file_type": "image"
  }
}
```

---

### Delete File

```http
DELETE /upload/{filename}
Authorization: Bearer {token}
```

---

## ⚙️ Settings

### Get System Settings (Public)

```http
GET /settings/public
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "site_name": "Pengaduan Mahasiswa UIN Gus Dur",
    "max_file_size_mb": 10,
    "allowed_file_types": ["jpg", "jpeg", "png", "pdf", "doc", "docx"]
  }
}
```

---

### Get System Settings (Admin)

```http
GET /settings
Authorization: Bearer {token} (role: admin)
```

---

### Update System Setting (Admin)

```http
PUT /settings/{key}
Authorization: Bearer {token}
Content-Type: application/json

{
  "value": "48"
}
```

---

## 🔗 Webhooks

### Register Webhook

```http
POST /webhooks
Authorization: Bearer {token} (role: admin)
Content-Type: application/json

{
  "url": "https://your-server.com/webhook",
  "events": ["pengaduan.created", "pengaduan.status_changed", "pengaduan.resolved"],
  "secret": "your_webhook_secret"
}
```

---

### List Webhooks

```http
GET /webhooks
Authorization: Bearer {token}
```

---

### Delete Webhook

```http
DELETE /webhooks/{id}
Authorization: Bearer {token}
```

---

## Webhook Payload Example

When an event triggers, we send:

```json
{
  "event": "pengaduan.status_changed",
  "timestamp": "2026-10-22T21:00:00.000Z",
  "data": {
    "pengaduan_id": 456,
    "kode_pengaduan": "PM-2210-0005",
    "old_status": "menunggu",
    "new_status": "diproses",
    "changed_by": {
      "id": 45,
      "nama": "Admin Sarpras"
    }
  },
  "signature": "sha256_hmac_signature"
}
```

---

## 🔒 Security

### Headers Required

All authenticated requests must include:
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
X-Request-ID: unique_request_id (optional, for tracing)
```

---

### Rate Limiting

- **Public endpoints:** 60 requests/minute
- **Authenticated:** 300 requests/minute
- **Admin:** 600 requests/minute

Response headers:
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 285
X-RateLimit-Reset: 1698087600
```

---

### Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data yang dikirim tidak valid",
    "details": [
      {
        "field": "judul",
        "message": "Judul wajib diisi"
      }
    ]
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token tidak valid atau sudah kadaluarsa"
  }
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Anda tidak memiliki akses ke resource ini"
  }
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Pengaduan tidak ditemukan"
  }
}
```

**429 Too Many Requests:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Terlalu banyak request. Coba lagi dalam 60 detik."
  }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Terjadi kesalahan pada server",
    "request_id": "req_abc123"
  }
}
```

---

## 📝 Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request berhasil |
| 201 | Created - Resource berhasil dibuat |
| 204 | No Content - Request berhasil tanpa response body |
| 400 | Bad Request - Data tidak valid |
| 401 | Unauthorized - Tidak terautentikasi |
| 403 | Forbidden - Tidak punya akses |
| 404 | Not Found - Resource tidak ditemukan |
| 422 | Unprocessable Entity - Validasi gagal |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Error di server |
| 503 | Service Unavailable - Server maintenance |

---

## 🧪 Testing & Development

### Base URLs

- **Production:** `https://api.pengaduan.uingusdur.ac.id/v1`
- **Staging:** `https://staging-api.pengaduan.uingusdur.ac.id/v1`
- **Development:** `http://localhost:3000/v1`

### Test Credentials

```
NIM: 2210511042
Password: mahasiswa123
Role: mahasiswa

NIM: 9999999999
Password: admin123
Role: admin
```

---

## 📚 SDK & Libraries

Coming soon:
- JavaScript/TypeScript SDK
- PHP SDK
- Python SDK
- Mobile SDK (React Native, Flutter)

---

## 📞 Support

- Email: developer@uingusdur.ac.id
- Documentation: https://docs.pengaduan.uingusdur.ac.id
- GitHub: https://github.com/uingusdur/pengaduan-api
- Status Page: https://status.pengaduan.uingusdur.ac.id

---

**Version History:**
- v1.0.0 (2026-10-22) - Initial release
- Enhanced features: SLA tracking, bulk actions, advanced analytics

**© 2026 UIN K.H. Abdurrahman Wahid Pekalongan**
