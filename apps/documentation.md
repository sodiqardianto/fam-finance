# Dokumentasi Proyek: Fam Finance

## Pendahuluan

Fam Finance adalah aplikasi manajemen keuangan keluarga yang dirancang khusus untuk pasangan. Berbeda dengan aplikasi keuangan tradisional, sistem ini mengutamakan **kesetaraan**, **komunikasi**, dan **pengakuan kontribusi non-finansial** (seperti mengurus rumah tangga atau pengasuhan). Aplikasi ini menggunakan pendekatan yang lembut, inklusif, dan tidak menghakimi dalam menyajikan data keuangan.

---

## 🛠 Tech Stack

Aplikasi ini dibangun dengan arsitektur modern yang memisahkan antara layanan data (API) dan antarmuka pengguna (Web).

### Backend (API)
- **Runtime**: [Bun](https://bun.sh/) (Cepat, modern, dan ringan)
- **Framework**: [Hono](https://hono.dev/) (Web framework minimalis untuk edge computing)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Hosted on Supabase)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) (Type-safe dan berperforma tinggi)
- **Authentication**: [Supabase Auth](https://supabase.com/auth) (Google OAuth integration)

### Frontend (Web)
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Utility-first CSS)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) (Interaksi yang halus dan taktil)
- **Icons**: [Lucide React](https://lucide.dev/)
- **UI Components**: Custom components dengan gaya Glassmorphism

---

## 🔄 Alur Aplikasi (Flow)

### 1. Autentikasi & Onboarding
- **Login**: Pengguna masuk menggunakan akun Google (OAuth).
- **Status Check**: Setelah login, sistem secara otomatis mengecek status keanggotaan keluarga pengguna di database.
- **Cabang Alur**:
    - **Jika belum punya keluarga**: Pengguna diberikan pilihan untuk **Membuat Keluarga Baru** (menjadi partner pertama) atau **Bergabung ke Keluarga** menggunakan kode undangan dari pasangan.
    - **Jika sudah punya keluarga**: Pengguna langsung dialihkan (auto-redirect) ke Dashboard.

### 2. Manajemen Keluarga
- **Kode Undangan**: Partner pertama yang mendaftar akan mendapatkan kode unik 6 karakter untuk dibagikan kepada pasangan.
- **Koneksi**: Saat partner kedua memasukkan kode tersebut, kedua akun akan terhubung secara permanen dalam satu entitas `Family ID`.

### 3. Pencatatan Aktivitas
- **Transaksi Finansial**: Mencatat pemasukan dan pengeluaran keluarga.
- **Kontribusi Non-Finansial**: Fitur unik untuk mencatat aktivitas domestik (memasak, mengasuh anak, dll) dengan estimasi nilai ekonomi, sehingga kontribusi di luar uang tetap dihargai dan muncul di dashboard.
- **Privasi Uang Pribadi**: Pengeluaran dari sumber "Uang Pribadi" secara default hanya terlihat oleh pemilik dana (menjaga privasi individu di dalam hubungan).

### 4. Dashboard & Navigasi
- **Ringkasan**: Menampilkan total Uang Keluarga, Uang Pribadi, dan Tabungan Tujuan secara berdampingan.
- **Navigasi Mobile**: Menggunakan menu bawah (Bottom Nav) yang dioptimalkan untuk penggunaan satu tangan di perangkat mobile.

---

## 🎨 Gaya & Prinsip Desain

### 1. Glassmorphism
Antarmuka menggunakan elemen kaca (transparansi + blur) terutama pada menu navigasi bawah untuk memberikan kesan modern, ringan, dan premium.

### 2. Psikologi Warna
- **Zinc/Neutral**: Warna utama untuk kesan bersih dan tenang.
- **Emerald/Green**: Digunakan untuk pemasukan atau kondisi keuangan yang sehat.
- **Pink/Rose**: Digunakan untuk elemen "Heart" atau kontribusi non-finansial, memberikan kesan kasih sayang dan kelembutan.
- **Tanpa Warna Menghakimi**: Menghindari penggunaan warna merah yang mencolok untuk kesalahan; lebih memilih warna netral atau kuning lembut untuk pengingat.

### 3. Bahasa yang Inklusif
Sistem tidak menggunakan istilah "Suami" atau "Istri" dalam kode atau database, melainkan menggunakan istilah "Partner" atau "Anggota Keluarga" untuk mendukung inklusivitas.

### 4. Micro-interactions
Setiap sentuhan (tap) pada tombol memiliki feedback visual (skalabilitas atau perubahan opacity) menggunakan Framer Motion untuk membuat aplikasi terasa lebih hidup.

---

## 📂 Struktur Database (Skema Utama)

- **`families`**: Menyimpan data identitas keluarga dan kode undangan.
- **`users`**: Data profil pengguna yang terhubung ke `family_id`.
- **`transactions`**: Data tunggal untuk pemasukan, pengeluaran, dan kontribusi non-finansial.
- **`savings_goals`**: Target finansial bersama (misal: "Dana Pendidikan", "Liburan").
- **`agreements`**: (Mendatang) Menyimpan status persetujuan untuk keputusan keuangan penting.
