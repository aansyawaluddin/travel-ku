# TravelKu Admin Portal

TravelKu Admin Portal adalah antarmuka web modern (*dashboard*) berbasis Next.js untuk mengelola pemesanan paket perjalanan wisata. Aplikasi ini terhubung langsung dengan backend Express.js + Prisma untuk melakukan operasi CRUD dan mengelola siklus hidup status pemesanan.

## 🚀 Fitur Utama

1. **Manajemen Pemesanan (CRUD):** Tambah, lihat, edit, dan hapus pemesanan pelanggan.
2. **Alur Status Logis:** Status dikontrol dengan ketat (Menunggu ➔ Dikonfirmasi/Dibatalkan ➔ Selesai). Pemesanan yang sudah Selesai/Dibatalkan tidak dapat diedit lagi.
3. **Filter Dinamis:** Pencarian nama/paket, filter berdasarkan status, paket wisata, dan rentang tanggal keberangkatan.
4. **Ringkasan Real-Time:** Menghitung total pemesanan aktif dan estimasi pendapatan (hanya dari status *Dikonfirmasi* & *Selesai*) secara otomatis menyesuaikan filter yang aktif.
5. **Kalkulasi Otomatis:** Menghitung total harga berdasarkan paket wisata yang dipilih dan jumlah peserta.
6. **Validasi Server-Side:** Menangkap dan menampilkan pesan error dari backend (misal: tanggal tidak boleh di masa lalu, kontak wajib diisi, kapasitas penuh).
7. **Autentikasi Staf (Bonus):** Sistem login staf dengan perlindungan JWT. Setiap transaksi mencatat siapa staf yang memprosesnya.
8. **Export ke CSV (Bonus):** Fitur unduh rangkuman tabel pemesanan yang difilter ke dalam format file `.csv`.

## 🛠️ Tech Stack

**Frontend:**
* **Framework:** [Next.js](https://nextjs.org/) (App Router, React 18+) - *Alasan: Memudahkan pembuatan UI berbasis komponen, routing yang praktis, dan performa optimal.*
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) - *Alasan: Mempercepat proses desain antarmuka responsif dengan utility classes.*
* **Bahasa:** TypeScript - *Alasan: Memberikan type-safety untuk meminimalisir bug pada saat penulisan kode.*
* **Integrasi API:** Fetch API native - *Alasan: Ringan dan sudah terintegrasi sempurna dengan ekosistem Next.js.*

**Backend Terkait:**
* **Server & API:** Node.js + Express.js
* **Database & ORM:** MariaDB + Prisma ORM

## 📦 Instalasi & Persiapan

Ikuti langkah-langkah berikut untuk menjalankan project ini di komputer lokal Anda:

### 1. Kloning Repositori / Buka Folder Project
Buka terminal dan arahkan ke folder project frontend ini.

### 2. Install Dependensi
Pastikan Node.js sudah terinstall, lalu jalankan perintah berikut untuk mengunduh semua modul yang dibutuhkan (termasuk plugin form dari Tailwind):

```bash
npm install
npm install @tailwindcss/forms @tailwindcss/container-queries
```

### 3. Konfigurasi Environment Variables
Buat file bernama `.env.local` di *root* folder project Anda, lalu tambahkan URL endpoint dari backend Express.js Anda:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/bookings
```
*(Catatan: Jika backend sudah di-deploy ke VPS, ganti URL di atas dengan URL domain Anda, misal: `https://travel.simoneva.cloud/api/bookings`)*

### 4. Jalankan Server Pengembangan (Lokal)
Jalankan perintah berikut untuk memulai aplikasi web:

```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat antarmuka aplikasi.

---

## ✅ Status Penyelesaian Fitur (Berdasarkan Ketentuan Ujian)

**Fitur Selesai:**
* [x] Form penambahan pemesanan (Otomatis berstatus "Menunggu").
* [x] Tabel daftar pemesanan (Diurutkan berdasarkan data terbaru).
* [x] Aksi Edit & Hapus data pemesanan.
* [x] Alur logis perubahan status terkontrol ketat.
* [x] Filter multi-kriteria (Pencarian teks, Status, Paket, Rentang Tanggal).
* [x] Widget Ringkasan Real-time (Jumlah & Estimasi Pendapatan).
* [x] Validasi Input terintegrasi Server-Side.
* [x] Modul Paket Wisata terpisah (Opsi dropdown bersumber dari API).
* [x] Validasi Kapasitas/Kuota Paket (Mencegah *overbooking*).
* [x] Export daftar pemesanan ke file CSV.
* [x] Autentikasi UI (Halaman Login untuk staf agen).
* [x] Tampilan *Responsive* untuk perangkat Mobile dan Desktop.

**Fitur Belum Selesai:**
* [ ] Unit Test / Integration Test otomatis.

## 🧠 Asumsi & Keputusan Teknis
1. **Format Tipe Data ID Paket:** ID Paket Wisata menggunakan tipe data String (`PKG-01`, `PKG-02`) agar mudah dikenali staf. Oleh karena itu, form di Frontend disesuaikan untuk selalu merespons dan mengirimkan ID paket dalam bentuk string, bukan angka (*number*).
2. **Sinkronisasi Harga Real-time:** Kolom `hargaPerOrang` bersifat statis per transaksi di database. Frontend mengakomodasi ini dengan melakukan *sync* (*lookup* ke state data paket wisata) setiap kali dropdown paket diubah, guna memberikan estimasi hitungan total yang instan di UI sebelum disubmit.
3. **Penanganan Timezone Tanggal:** Saat form disubmit, tanggal keberangkatan ditambahkan ekstensi waktu siang hari (`T12:00:00`) sebelum dikonversi ke Format ISO. Keputusan ini diambil guna mencegah bug pergeseran "mundur 1 hari" yang sering terjadi akibat perbedaan timezone offset antara browser lokal dan server database.

## 🚀 Hal yang Ingin Diperbaiki Kedepannya
1. **Integrasi Payment Gateway API:** Menambahkan fitur gerbang pembayaran pihak ketiga (seperti Midtrans) agar pemesanan dapat dilunasi secara digital dan statusnya otomatis berubah dari "Menunggu" menjadi "Dikonfirmasi".
2. **Dashboard Visual (Chart):** Mengintegrasikan library seperti `Chart.js` untuk memvisualisasikan data tren pemesanan bulanan dan grafik popularitas tiap paket wisata untuk evaluasi bisnis.
3. **Manajemen State Global:** Jika sistem terus bertambah besar, penggunaan *state management* eksternal seperti `Zustand` atau `Redux` akan diterapkan untuk mengatur status login dan cache data pemesanan lintas halaman dengan lebih efisien tanpa prop-drilling berlebih.
