# TravelKu Admin Portal

TravelKu Admin Portal adalah antarmuka web modern (*dashboard*) berbasis Next.js untuk mengelola pemesanan paket perjalanan wisata. Aplikasi ini terhubung langsung dengan backend Express.js + Prisma untuk melakukan operasi CRUD dan mengelola siklus hidup status pemesanan.

## 🚀 Fitur Utama

1. **Manajemen Pemesanan (CRUD):** Tambah, lihat, edit, dan hapus pemesanan pelanggan.
2. **Alur Status Logis:** Status dikontrol dengan ketat (Menunggu ➔ Dikonfirmasi/Dibatalkan ➔ Selesai). Pemesanan yang sudah Selesai/Dibatalkan tidak dapat diedit lagi.
3. **Filter Dinamis:** Pencarian nama/paket, filter berdasarkan status, paket wisata, dan rentang tanggal keberangkatan.
4. **Ringkasan Real-Time:** Menghitung total pemesanan aktif dan estimasi pendapatan (hanya dari status *Dikonfirmasi* & *Selesai*) secara otomatis menyesuaikan filter yang aktif.
5. **Kalkulasi Otomatis:** Menghitung total harga berdasarkan paket wisata yang dipilih dan jumlah peserta.
6. **Validasi Server-Side:** Menangkap dan menampilkan pesan error dari backend (misal: tanggal tidak boleh di masa lalu, kontak wajib diisi).

## 🛠️ Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (App Router, React 18+)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Bahasa:** TypeScript
* **Integrasi API:** Fetch API (Terhubung ke Node.js/Express Backend)

## 📦 Instalasi & Persiapan

Ikuti langkah-langkah berikut untuk menjalankan project ini di komputer lokal Anda:

### 1. Kloning Repositori / Buka Folder Project
Buka terminal dan arahkan ke folder project ini.

### 2. Install Dependensi
Pastikan Node.js sudah terinstall, lalu jalankan perintah berikut untuk mengunduh semua modul yang dibutuhkan (termasuk plugin form dari Tailwind):

```bash
npm install
npm install @tailwindcss/forms @tailwindcss/container-queries
