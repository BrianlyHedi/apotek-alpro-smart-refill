# 💊 Apotek Alpro — Smart Prescription & Refill System

Sistem manajemen resep obat kronis digital dengan fitur **Clinical Prescription Verification**, **Real-Time Drug Interaction Checker**, **Transparent Multi-Branch Inventory**, dan **Automated Refill Schedule Management** untuk jaringan Apotek Alpro Indonesia.

> **Technical Case Study / Assessment** — Dibangun dengan **Next.js 16 (App Router)**, **TypeScript**, **Supabase (PostgreSQL + Auth SSR + Realtime + Storage)**, dan **Prisma ORM**.

---

## 🌟 Fitur Utama & Kepatuhan Medis

| Modul | Fitur Unggulan | Status |
| :--- | :--- | :---: |
| 🔑 **Autentikasi & Akun** | Login Multi-Role dengan tombol 1-Klik Autofill, Modal Lupa Password, Pendaftaran Pasien Mandiri (Auto-Login), dan Tambah Pengguna Baru oleh Admin. | ✅ 100% |
| 📋 **Resep Dokter Pasien** | Upload foto resep (validasi 5MB, format JPG/PNG/WEBP), Live Image Preview, Re-upload resep yang ditolak (*REJECTED*) dengan catatan dokter, Lightbox Zoom Detail. | ✅ 100% |
| 🔄 **Jadwal Refill Rutin** | Pause & Resume jadwal terapi, Tambah Jadwal Refill Mandiri, Input Kuantitas Manual + Stepper $(+/-)$, Transparansi Stok Nyata per Cabang, Auto-Recalculate siklus setelah obat diserahkan. | ✅ 100% |
| ⚠️ **Clinical Drug Checker** | Deteksi interaksi obat otomatis saat telaah apoteker dan checkout pasien (*MILD / MODERATE / SEVERE*) disertai penjelasan klinis & persetujuan pasien (*Acknowledgment Checkbox*). | ✅ 100% |
| 👨‍⚕️ **Telaah Resep Apoteker** | Autocomplete pencarian 28 SKU obat, Lightbox Zoom resep fisik, Transkripsi digital, Validasi klinis interaksi obat, dan Penolakan resep dengan catatan edukasi pasien. | ✅ 100% |
| 📦 **Stok Multi-Cabang** | 5 Cabang apotek independen, Filter status ketersediaan, Input kuantitas manual angka, Timestamp pembaruan relatif, dan Animasi denyut (*Pulse Animation*) saat stok berubah. | ✅ 100% |
| 🧾 **Pesanan & Cetak Struk** | Stepper status timeline pesanan (1. Menunggu $\rightarrow$ 2. Disiapkan $\rightarrow$ 3. Siap Diambil $\rightarrow$ 4. Selesai), Pesan Ulang (*Reorder*), dan Cetak Struk resmi apotek dengan *Print Isolation* bersih. | ✅ 100% |
| 🏥 **Admin & Hak Akses** | Tambah cabang baru (otomatis inisialisasi 28 SKU obat), Edit data operasional, Nonaktifkan/Aktifkan cabang, Modal Statistik Cabang, Pencarian pengguna multi-field, dan Penugasan cabang apoteker. | ✅ 100% |
| 🔔 **Pusat Notifikasi** | Notifikasi dinamis berdasarkan data aktual database (Pengingat jatuh tempo refill, status resep, antrean resep masuk, peringatan stok menipis) dengan filter kategori & auto-polling. | ✅ 100% |
| 🛡️ **Keamanan Data (RLS)** | Row Level Security (RLS) granular PostgreSQL pada 10 tabel database dan Middleware route guard per peran. | ✅ 100% |

---

## 👥 Kredensial Akun Demo (1-Click Autofill)

Halaman login ([`/login`](http://localhost:3000/login)) telah dilengkapi tombol **Autofill 1-Klik** untuk pengujian cepat:

| Peran (Role) | Nama Akun | Email | Password Default | Tombol Instan |
| :--- | :--- | :--- | :--- | :--- |
| 🧑 **Pasien** (`PATIENT`) | Budi Santoso | `budi.pasien@demo.com` | `Demo123!` | Klik **[Isi Pasien]** |
| 👨‍⚕️ **Apoteker Cabang** (`PHARMACIST`) | Apt. Siti Aminah, S.Farm | `siti.apoteker@demo.com` | `Demo123!` | Klik **[Isi Apoteker]** |
| 👑 **Admin Sistem** (`ADMIN`) | Admin Greenville | `admin.greenville@demo.com` | `Demo123!` | Klik **[Isi Admin]** |

---

## 🧪 Panduan Skenario Pengujian (Interviewer Walkthrough)

```mermaid
graph TD
    A[Pasien: Upload Resep Fisik] --> B[Apoteker: Verifikasi Klinis & Transkripsi]
    B -->|Deteksi Interaksi Obat| B1{Apoteker Review}
    B1 -->|Approve Resep| C[Resep Terverifikasi & Jadwal Refill Aktif]
    B1 -->|Reject Resep| R[Resep Ditolak + Catatan Perbaikan]
    R -->|Pasien Re-upload| A
    C --> D[Pasien: Tebus Resep / Refill Obat]
    D -->|Warning Interaksi + Cek Stok Cabang| E[Pemesanan Obat]
    E --> F[Apoteker: Konfirmasi & Siapkan]
    F --> G[Apoteker: Tandai Siap Diambil]
    G --> H[Penyerahan Obat: DELIVERED & Cetak Struk]
    H -->|Auto-recalculate| I[Siklus Refill Otomatis Diperbarui]
```

### 1. Skenario Pasien: Upload Resep Dokter
1. Login sebagai **Pasien** (`budi.pasien@demo.com`).
2. Masuk ke **Resep Saya** (`/patient/prescriptions`) $\rightarrow$ klik **"Unggah Resep Baru"**.
3. Pilih gambar resep (format JPG/PNG/WEBP max 5MB). Perhatikan live preview gambar.
4. Kirim resep $\rightarrow$ status resep menjadi `PENDING`.

### 2. Skenario Apoteker: Telaah Klinis & Pengecekan Interaksi Obat
1. Buka browser baru / Incognito, login sebagai **Apoteker** (`siti.apoteker@demo.com`).
2. Masuk ke **Telaah Resep** (`/pharmacist/prescriptions`) $\rightarrow$ klik **"Telaah Resep"**.
3. Periksa foto resep dengan tombol **Zoom**.
4. Ketik nama obat pada autocomplete (misal: *Candesartan 8mg* dan *Amlodipine 5mg*).
5. Sistem mendeteksi potensi risiko interaksi klinis. Klik **"Setujui Resep"**.
6. Sistem otomatis membuatkan **Jadwal Refill Aktif** untuk pasien.

### 3. Skenario Pasien: Tebus Resep & Refill Obat Rutin
1. Kembali ke akun **Pasien**. Perhatikan notifikasi lonceng di header.
2. Buka menu **Jadwal Refill** (`/patient/refills`):
   - Coba tombol **Pause / Resume** jadwal refill.
   - Coba tombol **"+ Tambah Jadwal Refill"** untuk obat baru.
3. Klik tombol **"Refill Sekarang"**:
   - Ketik kuantitas secara manual atau gunakan tombol stepper $(+/-)$.
   - Pilih Cabang Apotek: Perhatikan indikator stok real-time (mencegah checkout jika stok habis).
   - Konfirmasi pesanan obat.

### 4. Skenario Apoteker: Pemrosesan & Cetak Struk Resmi
1. Kembali ke akun **Apoteker**, buka **Pesanan Obat** (`/pharmacist/orders`).
2. Ubah status: **Menyiapkan** $\rightarrow$ **Siap Diambil** $\rightarrow$ **Selesai (`DELIVERED`)**.
3. Klik **"Cetak Struk"**: Tombol aksi otomatis disembunyikan dalam mode print (*Print Isolation*).
4. Siklus refill pasien otomatis dimajukan ke periode berikutnya.

### 5. Skenario Admin: Manajemen Cabang & Pengguna
1. Login sebagai **Admin** (`admin.greenville@demo.com`).
2. **Kelola Cabang** (`/admin/pharmacies`): Tambah cabang baru (otomatis inisialisasi 28 SKU), edit data operasional, dan buka modal statistik performa cabang.
3. **Kelola Pengguna** (`/admin/users`): Tambah user baru (Pasien/Apoteker/Admin) dan atur penugasan cabang apoteker.

---

## 🛠️ Arsitektur & Tech Stack

- **Framework**: Next.js 16 (App Router + Server Actions)
- **Language**: TypeScript (Strict Mode)
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma Client v6
- **Authentication**: Supabase Auth (SSR Cookies) + RBAC Middleware Guard
- **Storage**: Supabase Storage Bucket (`prescriptions`)
- **Security**: PostgreSQL Row Level Security (RLS) pada 10 tabel database
- **Styling**: Tailwind CSS v4 + Base UI / Radix primitives + Lucide Icons

---

## 🚀 Menjalankan Project Secara Lokal

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/BrianlyHedi/apotek-alpro-smart-refill.git
cd apotek-alpro-smart-refill
npm install
```

### 2. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi konfigurasi database & API keys Supabase Anda:
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"
```

### 3. Migrasi & Seed Database
```bash
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```
*Script seed akan menginisialisasi 5 cabang apotek, 28 master SKU obat, 140 inventori stok cabang, 3 user demo, resep awal, jadwal refill kronis, dan 7 database interaksi obat klinis.*

### 4. Jalankan Dev Server
```bash
npm run dev
```
Buka **`http://localhost:3000`** di browser.

---

## 📁 Struktur Direktori Project

```
src/
├── app/
│   ├── (auth)/                # Halaman Login & Register
│   ├── (dashboard)/           # Dashboard per Role
│   │   ├── patient/           # Portal Pasien (Prescriptions, Refills, Orders, Inventory, Profile)
│   │   ├── pharmacist/        # Portal Apoteker (Prescriptions, Inventory, Orders)
│   │   └── admin/             # Portal Admin (Pharmacies, Users)
│   └── api/                   # API Route Handlers (Auth, Prescriptions, Orders, Refills, dll)
├── components/
│   ├── admin/                 # Komponen khusus portal Admin
│   ├── forms/                 # Form login, registrasi, upload
│   ├── inventory/             # Badge ketersediaan stok & animasi denyut
│   ├── layout/                # Sidebar, Navbar, Notifikasi Popover
│   ├── patient/               # Modal Refill Cepat, Modal Tebus Resep, Order Client
│   ├── pharmacist/            # Modal Telaah Resep, Lightbox Zoom, Drug Checker Dialog
│   ├── providers/             # Toast Provider (z-[99999] layer)
│   └── ui/                    # Komponen primitif UI (Dialog, Button, Select, Badge, Card)
├── hooks/                     # Custom React Hooks (useRefillSchedules, useToast)
├── lib/
│   ├── auth/                  # Auth session & profile helpers
│   ├── prisma/                # Prisma client singleton
│   ├── supabase/              # Supabase browser SSR & admin clients
│   └── utils/                 # Drug interaction engine, format tanggal, mata uang
├── types/                     # TypeScript Interfaces (Prescription, Inventory, Orders)
└── middleware.ts              # RBAC & Protected Route Guards
```

---

## 📜 Daftar Script

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan server lokal Next.js |
| `npm run build` | Kompilasi build produksi Next.js (28/28 routes) |
| `npm run lint` | Menjalankan static code analysis ESLint |
| `npm run db:seed` | Mengisi database dengan data awal lengkap |
| `npm run db:studio` | Membuka Prisma Studio GUI |

---

## 📄 Lisensi & Hak Cipta

Proyek ini dikembangkan sebagai **Technical Assessment Solution** untuk **Apotek Alpro Indonesia**. Seluruh hak cipta kode dan implementasi arsitektur dilindungi.