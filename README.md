# 💊 Apotek Alpro — Smart Prescription & Refill System

Sistem manajemen resep obat kronis dengan fitur **realtime stock check**, **drug interaction checker**, dan **automated refill schedule** untuk jaringan Apotek Alpro Indonesia.

> **Technical Case Study** — Dibangun dengan Next.js 14+, Supabase (PostgreSQL + Auth + Realtime), dan Prisma ORM.

---

## ✨ Fitur yang Diimplementasikan

| Fitur | Deskripsi | Status |
|-------|-----------|--------|
| 🔐 **Multi-Role Auth** | Login sebagai Pasien, Apoteker, atau Admin Cabang | ✅ |
| 📋 **Upload Resep** | Pasien upload foto resep, apoteker verifikasi | ✅ |
| 📦 **Realtime Stock Check** | Cek stok obat di semua cabang secara realtime | ✅ |
| ⚠️ **Drug Interaction Checker** | Warning otomatis saat checkout multi-obat | ✅ |
| 🔄 **Refill Schedule** | Jadwal refill otomatis untuk obat kronis | ✅ |
| 🛒 **Order Management** | Checkout, konfirmasi, dan tracking pesanan | ✅ |
| 👨‍⚕️ **Pharmacist Dashboard** | Verifikasi resep dan manajemen stok | ✅ |
| 🏥 **Multi-Branch Support** | 5 cabang dengan stok independen | ✅ |
| 🛡️ **Role-Based Access** | Middleware proteksi route per role | ✅ |

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ (App Router) + TypeScript
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma 6
- **Auth**: Supabase Auth + RLS
- **Realtime**: Supabase Realtime (inventory live update)
- **Storage**: Supabase Storage (upload foto resep)
- **Styling**: Tailwind CSS v4
- **Deployment**: Vercel

---

## 📋 Prerequisites

- **Node.js** 20+ ([download](https://nodejs.org/))
- **npm** (included with Node.js)
- **Supabase Account** ([sign up gratis](https://supabase.com/))
- **Supabase CLI** (opsional, untuk local development)

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/BrianlyHedi/apotek-alpro-smart-refill.git
cd apotek-alpro-smart-refill
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

1. Buat project baru di [Supabase Dashboard](https://supabase.com/dashboard)
2. Salin credential dari **Settings → API**:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
3. Salin connection string dari **Settings → Database**:
   - `Connection string (URI)` → `DATABASE_URL`
   - `Direct connection` → `DIRECT_URL`

### 4. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` dengan credential Supabase kamu:

```env
# Supabase Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# Supabase Project
SUPABASE_URL="https://[PROJECT_REF].supabase.co"
SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"

# Public (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
```

### 5. Run Database Migration

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 6. Seed Data Dummy

```bash
npm run db:seed
```

Ini akan mengisi database dengan:
- 🏥 5 cabang apotek (Greenville, Bintaro, Tebet, Pondok Ungu, Limo)
- 💊 28 SKU obat (13 OTC + 15 Prescription)
- 👤 3 user demo (lihat tabel di bawah)
- 📦 140 record stok inventory (28 obat × 5 cabang)
- 📋 1 prescription aktif (3 item)
- 🔄 2 refill schedules
- ⚠️ 7 drug interactions

### 7. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 🔑 Credential Demo

| Role | Email | Password |
|------|-------|----------|
| 🧑 **Pasien** | `budi.pasien@demo.com` | `Demo123!` |
| 👨‍⚕️ **Apoteker** | `siti.apoteker@demo.com` | `Demo123!` |
| 🏥 **Admin** | `admin.greenville@demo.com` | `Demo123!` |

### Skenario Demo

1. **Login sebagai Pasien** → lihat resep aktif, cek jadwal refill, buat order baru
2. **Login sebagai Apoteker** → verifikasi resep pending, cek stok cabang
3. **Cek Realtime Stock** → buka 2 tab browser, update stok di satu tab → lihat perubahan di tab lain
4. **Drug Interaction** → checkout Metformin + Glibenclamide → lihat warning "MODERATE risk"

---

## 📁 Struktur Project

```
apotek-alpro-smart-refill/
├── prisma/
│   ├── schema.prisma              # Database schema (10 model, 5 enum)
│   └── seed.ts                    # Seed data dummy
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/                # Login & Register pages
│   │   ├── (dashboard)/           # Dashboard per role
│   │   └── api/                   # API Route Handlers
│   ├── components/
│   │   ├── ui/                    # Komponen UI primitif
│   │   ├── forms/                 # Form components
│   │   ├── layout/                # Navbar, Sidebar, Footer
│   │   ├── providers/             # Toast, QueryClient providers
│   │   └── error-boundary.tsx     # Global error boundary
│   ├── hooks/                     # Custom React hooks
│   │   ├── use-auth.ts            # Auth session wrapper
│   │   ├── use-inventory.ts       # Realtime stock subscription
│   │   ├── use-prescriptions.ts   # Prescriptions fetcher
│   │   └── use-refill-schedule.ts # Refill schedule manager
│   ├── lib/
│   │   ├── prisma/client.ts       # Prisma singleton
│   │   ├── supabase/              # Supabase client & server
│   │   ├── utils/                 # Currency, date, stock helpers
│   │   └── validators/            # Zod validation schemas
│   ├── types/                     # TypeScript type definitions
│   └── middleware.ts              # Role-based route protection
└── ...config files
```

---

## 📜 Available Scripts

| Command | Deskripsi |
|---------|-----------|
| `npm run dev` | Start development server |
| `npm run build` | Build production bundle |
| `npm run lint` | Run ESLint |
| `npm run db:seed` | Seed database dengan data dummy |
| `npm run db:migrate` | Run Prisma migration |
| `npm run db:reset` | Reset database + re-seed |
| `npm run db:studio` | Buka Prisma Studio (GUI database) |

---

## 📸 Screenshots

> Screenshots akan ditambahkan setelah UI selesai diimplementasikan.

### Login Page
![Login](./docs/screenshots/login.png)

### Dashboard Pasien — Upload Resep
![Upload Resep](./docs/screenshots/patient-prescription.png)

### Realtime Stock View
![Stock View](./docs/screenshots/realtime-stock.png)

### Drug Interaction Warning
![Drug Interaction](./docs/screenshots/drug-interaction.png)

---

## 🚀 Deployment ke Vercel

1. Push repo ke GitHub
2. Import repository di [Vercel Dashboard](https://vercel.com/new)
3. Set **Environment Variables** di Vercel:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy! 🎉

> **Note**: Vercel otomatis menjalankan `npm run build` yang akan trigger `postinstall` → `prisma generate`.

---

## 🛡️ Row Level Security (RLS)

Setelah migration, apply RLS policies untuk keamanan data:

```bash
# Apply RLS policies (one-time setup)
psql $DATABASE_URL -f prisma/rls-policies.sql
```

Atau jalankan SQL di [Supabase SQL Editor](https://supabase.com/dashboard) secara manual.

> **Note**: RLS policies memastikan setiap user hanya bisa mengakses data sesuai role-nya. Detail policy ada di file `prisma/rls-policies.sql`.

---

## 🔧 Troubleshooting

### Error: "Too many connections" saat `prisma migrate dev`
- Pastikan `DATABASE_URL` menggunakan **connection pooling** (port `6543`)
- Pastikan `DIRECT_URL` menggunakan **direct connection** (port `5432`)
- Restart terminal untuk reset connection pool

### Seed script warning "Supabase Admin not available"
- Ini **normal** jika `SUPABASE_SERVICE_ROLE_KEY` belum diset
- User tetap dibuat di tabel `users`, tapi tidak bisa login via Supabase Auth
- Solusi: Set `SUPABASE_SERVICE_ROLE_KEY` di `.env.local` dan re-run `npm run db:seed`

### Realtime subscription tidak update
- Pastikan RLS policy di tabel `inventory` sudah di-apply (`prisma/rls-policies.sql`)
- Enable **Realtime** untuk tabel `inventory` di Supabase Dashboard → Database → Replication
- Check console browser untuk error CORS atau permission

### Error: "relation does not exist" saat seed
- Jalankan migration dulu: `npx prisma migrate dev --name init`
- Pastikan `DATABASE_URL` mengarah ke database yang benar

### Prisma generate error setelah install
- Jalankan manual: `npx prisma generate`
- Pastikan file `prisma/schema.prisma` ada dan valid: `npx prisma validate`

---

## 🔮 Next Steps & Rekomendasi

Fitur yang bisa ditambahkan untuk versi berikutnya:

1. **Supabase Edge Functions** — Validasi resep otomatis dan drug interaction check di server-side (Deno runtime)
2. **WhatsApp Reminder** — Integrasi dengan WhatsApp Business API untuk reminder refill otomatis
3. **Telepharmacy Video Call** — Konsultasi online pasien-apoteker via WebRTC
4. **Analytics Dashboard** — Grafik penjualan, stok terlaris, dan prediksi kebutuhan stok per cabang
5. **Geolocation Search** — Cari cabang terdekat berdasarkan lokasi GPS pasien + filter stok tersedia

---

## 📄 License

This project is a technical case study for Apotek Alpro Indonesia.

## 🤔 About This Project

Proyek ini dibangun sebagai technical case study untuk interview di Apotek Alpro Indonesia. 

**Tech Stack Decisions:**
- Next.js App Router + Server Actions untuk optimalisasi SEO dan performance
- Supabase untuk backend-as-a-service (Postgres + Auth + Realtime + Storage)
- Prisma ORM untuk type-safe database operations
- shadcn/ui untuk komponen yang customizable dan accessible

**What I Learned:**
- Implementasi realtime subscription dengan Supabase Realtime
- Design database schema untuk sistem multi-branch dengan RLS
- Build drug interaction checker dengan validation real-time

**Future Improvements:**
- Telepharmacy video call untuk konsultasi apoteker
- WhatsApp/Email reminder untuk jadwal refill
- Analytics dashboard untuk admin pusat (monitoring stok & penjualan)