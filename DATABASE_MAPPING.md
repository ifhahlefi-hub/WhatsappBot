# DATABASE MAPPING

Dokumen ini berisi pemetaan lengkap struktur database SQLite saat ini (sebelum dilakukan perubahan schema untuk Phase 2 integrasi panel admin).

---

## Tabel: `users`
**Fungsi:** Menyimpan data pengguna WhatsApp yang pernah berinteraksi dengan bot.
**Status:** Digunakan

### Kolom
- `id` (INTEGER) - Primary Key
- `whatsapp_number` (TEXT) - Not Null: 0 - (Nomor WA user)
- `push_name` (TEXT) - Not Null: 0 - (Nama kontak/profil WA)
- `profile_picture` (TEXT) - Not Null: 0 - (URL foto profil)
- `role` (TEXT) - Not Null: 0 - Default: 'User'
- `status` (TEXT) - Not Null: 0 - Default: 'Aktif'
- `last_active` (DATETIME) - Not Null: 0 - Default: CURRENT_TIMESTAMP
- `created_at` (DATETIME) - Not Null: 0 - Default: CURRENT_TIMESTAMP
- `updated_at` (DATETIME) - Not Null: 0 - Default: CURRENT_TIMESTAMP
- `deleted_at` (DATETIME) - Not Null: 0 - (Soft delete)

### Relasi
- Parent untuk `chat_history` (via `chat_history.user_id -> users.id`)
- Parent untuk `expenses` (via `expenses.created_by -> users.id`)

---

## Tabel: `chat_history`
**Fungsi:** Menyimpan riwayat percakapan antara user dan bot.
**Status:** Digunakan

### Kolom
- `id` (INTEGER) - Primary Key
- `user_id` (INTEGER) - Not Null: 0
- `message_type` (TEXT) - Not Null: 0
- `message` (TEXT) - Not Null: 0
- `sender` (TEXT) - Not Null: 0
- `status` (TEXT) - Not Null: 0
- `timestamp` (DATETIME) - Not Null: 0 - Default: CURRENT_TIMESTAMP
- `response_time` (INTEGER) - Not Null: 0
- `deleted_at` (DATETIME) - Not Null: 0

### Relasi
- Child dari `users` (via `user_id`)

---

## Tabel: `expenses`
**Fungsi:** Menyimpan pencatatan pengeluaran (Server, API, dll).
**Status:** Digunakan

### Kolom
- `id` (INTEGER) - Primary Key
- `category` (TEXT) - Not Null: 0
- `description` (TEXT) - Not Null: 0
- `amount` (INTEGER) - Not Null: 0
- `created_by` (INTEGER) - Not Null: 0
- `status` (TEXT) - Not Null: 0 - Default: 'Selesai'
- `created_at` (DATETIME) - Not Null: 0 - Default: CURRENT_TIMESTAMP
- `updated_at` (DATETIME) - Not Null: 0 - Default: CURRENT_TIMESTAMP
- `deleted_at` (DATETIME) - Not Null: 0

### Relasi
- Child dari `users` (via `created_by` -> `users.id`) 
*(Catatan: Seharusnya `created_by` merujuk ke `admin_users` jika pengeluaran dicatat oleh admin di dashboard, bukan oleh user WhatsApp biasa. Ini akan diperbaiki dalam skema baru.)*

---

## Tabel: `admin_users`
**Fungsi:** Menyimpan data akun login untuk Admin Panel (Dashboard).
**Status:** Digunakan

### Kolom
- `id` (INTEGER) - Primary Key
- `name` (TEXT) - Not Null: 0
- `email` (TEXT) - Not Null: 0
- `password_hash` (TEXT) - Not Null: 0
- `role` (TEXT) - Not Null: 0
- `status` (TEXT) - Not Null: 0 - Default: 'Aktif'
- `last_login` (DATETIME) - Not Null: 0
- `created_at` (DATETIME) - Not Null: 0 - Default: CURRENT_TIMESTAMP
- `updated_at` (DATETIME) - Not Null: 0 - Default: CURRENT_TIMESTAMP
- `deleted_at` (DATETIME) - Not Null: 0

### Relasi
- Parent untuk `audit_logs` (via `audit_logs.admin_id -> admin_users.id`)

---

## Tabel: `audit_logs`
**Fungsi:** Menyimpan riwayat aktivitas admin di dashboard.
**Status:** Digunakan

### Kolom
- `id` (INTEGER) - Primary Key
- `admin_id` (INTEGER) - Not Null: 0
- `action` (TEXT) - Not Null: 0
- `module` (TEXT) - Not Null: 0
- `description` (TEXT) - Not Null: 0
- `ip_address` (TEXT) - Not Null: 0
- `created_at` (DATETIME) - Not Null: 0 - Default: CURRENT_TIMESTAMP

### Relasi
- Child dari `admin_users` (via `admin_id`)

---

## Tabel: `whatsapp_sessions`
**Fungsi:** Menyimpan status koneksi sesi WhatsApp Web (Baileys/WAWeb.js).
**Status:** Digunakan

### Kolom
- `id` (INTEGER) - Primary Key
- `session_name` (TEXT) - Not Null: 0
- `device_name` (TEXT) - Not Null: 0
- `phone_number` (TEXT) - Not Null: 0
- `status` (TEXT) - Not Null: 0 - Default: 'Disconnected'
- `qr_code` (TEXT) - Not Null: 0
- `last_connected` (DATETIME) - Not Null: 0
- `created_at` (DATETIME) - Not Null: 0 - Default: CURRENT_TIMESTAMP
- `updated_at` (DATETIME) - Not Null: 0 - Default: CURRENT_TIMESTAMP

### Relasi
- Tidak ada Foreign Key.

---

## Tabel: `sqlite_sequence`
**Fungsi:** Tabel internal SQLite untuk melacak Auto-Increment ID.
**Status:** Digunakan (Sistem)
