# WhatsApp Daily Assistant Bot

Bot WhatsApp berbasis Node.js yang berfungsi sebagai asisten harian personal dan produktivitas. Menggunakan library Baileys untuk koneksi ke WhatsApp Web.

## Fitur

| Command                        | Deskripsi                         |
| ------------------------------ | --------------------------------- |
| `halo`                         | Sapaan otomatis ramah             |
| `menu`                         | Menampilkan daftar fitur          |
| `jam`                          | Waktu dan tanggal Indonesia (WIB) |
| `todo`                         | Lihat semua tugas                 |
| `todo [isi]`                   | Tambah tugas baru                 |
| `done [nomor]`                 | Hapus tugas berdasarkan nomor     |
| `catat [nominal] [keterangan]` | Catat pengeluaran                 |
| `total`                        | Lihat total pengeluaran           |

## Tech Stack

- Runtime: Node.js (LTS)
- WhatsApp API: @whiskeysockets/baileys
- Database: SQLite (database.sqlite)
- Logger: Winston + Daily Rotate

## Struktur Proyek

## License

Lisensi repository ini dilindungi dan dikelola oleh zafhlf.xyz, atas nama Irza Mahendra Fhahlefi.

Copyright (c) 2026 zafhlf.xyz - Irza Mahendra Fhahlefi.

Hak cipta dan penggunaan kode ini tunduk pada kebijakan lisensi resmi yang berlaku di zafhlf.xyz. Seluruh kode dalam repository ini disediakan untuk penggunaan internal/perorangan sesuai ketentuan lisensi resmi, dan dilarang digunakan untuk kepentingan komersial tanpa izin tertulis dari pemegang hak.
