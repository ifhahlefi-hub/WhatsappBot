# WhatsApp Daily Assistant Bot 🤖

Bot WhatsApp berbasis Node.js yang berfungsi sebagai asisten harian personal & produktivitas. Menggunakan library **Baileys** untuk koneksi ke WhatsApp Web.

## 📋 Fitur

| Command | Deskripsi |
|---------|-----------|
| `halo` | Sapaan otomatis ramah |
| `menu` | Menampilkan daftar fitur |
| `jam` | Waktu & tanggal Indonesia (WIB) |
| `todo` | Lihat semua tugas |
| `todo [isi]` | Tambah tugas baru |
| `done [nomor]` | Hapus tugas berdasarkan nomor |
| `catat [nominal] [keterangan]` | Catat pengeluaran |
| `total` | Lihat total pengeluaran |

## 🛠️ Tech Stack

- **Runtime:** Node.js (LTS)
- **WhatsApp API:** @whiskeysockets/baileys
- **Database:** File-based JSON (`db.json`)
- **Logger:** Pino

## 📁 Struktur Proyek

```
whatsapp-bot/
├── src/
│   ├── bot.js              # Entry point, koneksi & routing
│   ├── database.js          # Load & save JSON database
│   └── commands/
│       ├── general.js       # Command: halo, jam
│       ├── menu.js          # Command: menu
│       ├── todo.js          # Command: todo, done
│       └── finance.js       # Command: catat, total
├── auth_info/               # Session WhatsApp (auto-generated)
├── db.json                  # Database file
├── package.json
├── .gitignore
└── README.md
```

## 🚀 Quick Start (Clone-ready)

### 1. Clone repo

```bash
git clone https://github.com/ifhahlefi-hub/WhatsappBot.git
cd WhatsappBot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Siapkan environment

Project membaca konfigurasi dari file [.env](.env) saat runtime. Kalau file itu belum ada, Anda bisa copy dari template yang tersedia di [.env.example](.env.example):

```bash
copy .env.example .env
```

Edit file [.env](.env) dan isi nilai yang memang perlu Anda ganti, terutama `GROQ_API_KEY` bila mau AI aktif. Jika key tetap placeholder, bot tetap bisa start, tetapi AI akan masuk mode `inactive` sesuai log [src/ai.js](src/ai.js#L13-L14).

### 4. Jalankan bot

```bash
npm start
```

### 5. Scan QR Code

Setelah bot berjalan, QR code akan muncul di terminal. Scan menggunakan WhatsApp kamu:
1. Buka **WhatsApp** di HP
2. Ketuk **⋮ (titik tiga)** > **Linked Devices**
3. Ketuk **Link a Device**
4. Scan QR code di terminal

### 6. Login admin

Setelah database diinisialisasi, super admin akan dibuat otomatis berdasarkan `SUPER_ADMIN_EMAIL` dari `.env`.

### 7. Mulai gunakan bot

Kirim pesan ke nomor WhatsApp yang terhubung untuk mencoba bot.

## 💬 Contoh Penggunaan

### Sapaan
```
Kamu: halo
Bot:  Halo kak! 👋 Ada yang bisa aku bantu hari ini?
```

### Menu
```
Kamu: menu
Bot:  📋 MENU BOT ASSISTANT
      ━━━━━━━━━━━━━━━━━━━━━
      🤖 Umum
        • halo — Sapaan dari bot
        • menu — Tampilkan menu ini
        • jam  — Waktu & tanggal sekarang
      ...
```

### Waktu
```
Kamu: jam
Bot:  🕐 Waktu Sekarang
      📅 Minggu, 23 Februari 2026
      ⏰ 00:15:30 WIB
```

### Todo List
```
Kamu: todo beli susu
Bot:  ✅ Tugas berhasil ditambahkan!
      📌 beli susu
      📊 Total tugas sekarang: 1

Kamu: todo
Bot:  📝 Daftar Tugas
      ━━━━━━━━━━━━━━━━━━━━━
      1. beli susu
      📌 Total: 1 tugas

Kamu: done 1
Bot:  🗑️ Tugas berhasil dihapus!
      ❌ ~beli susu~
      📊 Sisa tugas: 0
```

### Pengeluaran
```
Kamu: catat 25000 makan siang
Bot:  💰 Pengeluaran Berhasil Dicatat!
      🏷️ makan siang
      💵 Rp25.000
      🕐 23/2/2026, 00.15.30

Kamu: total
Bot:  💰 Rekap Pengeluaran
      ━━━━━━━━━━━━━━━━━━━━━
      📅 Hari Ini:
        1. makan siang — Rp25.000
      💵 Total Hari Ini: Rp25.000
      ━━━━━━━━━━━━━━━━━━━━━
      📊 Total Keseluruhan: Rp25.000
      📝 Jumlah Transaksi: 1
```

## ⚙️ Konfigurasi

### Session / Auth
Session WhatsApp disimpan di folder `auth_info/`. Selama folder ini ada, kamu **tidak perlu scan QR ulang**.

Jika ingin logout / reset:
```bash
rm -rf auth_info
npm start
```

### Database
Semua data tersimpan di `db.json`. File ini otomatis dibuat saat pertama kali bot berjalan.

## 🔮 Roadmap (Future Improvements)

- [ ] Fitur absensi harian
- [ ] Kirim file PDF
- [ ] Export data ke Excel
- [ ] Integrasi database MySQL
- [ ] Scheduler / Reminder otomatis
- [ ] Multi-user database (per-sender)

## 📝 Catatan

- Bot ini menggunakan **unofficial WhatsApp Web API**. Gunakan dengan bijak.
- Pastikan Node.js versi LTS terbaru sudah terinstall.
- Bot hanya merespons pesan dari orang lain (bukan pesan sendiri).

## License

MIT
