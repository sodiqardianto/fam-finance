# Setup Database + Supabase Auth

Panduan ini menjelaskan cara menjalankan Fam Finance dengan flexible database provider.

---

## 📋 Arsitektur

### Mode 1: Local PostgreSQL (Default)
```
┌─────────────┐      JWT Token      ┌─────────────┐
│   Browser   │ ───────────────────▶│   Backend   │
│  (Next.js)  │                     │   (Hono)    │
└──────┬──────┘                     └──────┬──────┘
       │                                    │
       │  1. Login Google OAuth             │  2. Verifikasi JWT
       │     (Supabase)                     │     (Supabase JWKS)
       │                                    │
       │                                    │  3. CRUD Data
       │                                    │     (Local Postgres)
       ▼                                    ▼
┌─────────────────────────┐        ┌─────────────────────────┐
│      Supabase Auth      │        │   Local PostgreSQL      │
│   (Hanya untuk Auth)    │        │  (Data Aplikasi)        │
└─────────────────────────┘        └─────────────────────────┘
```

### Mode 2: Supabase PostgreSQL
```
┌─────────────┐      JWT Token      ┌─────────────┐
│   Browser   │ ───────────────────▶│   Backend   │
│  (Next.js)  │                     │   (Hono)    │
└──────┬──────┘                     └──────┬──────┘
       │                                    │
       │                                    │  1. Verifikasi JWT
       │                                    │  2. CRUD Data
       │                                    │     (Supabase Postgres)
       ▼                                    ▼
┌─────────────────────────────────────────────────────┐
│                    Supabase                         │
│  ┌─────────────────┐    ┌──────────────────────┐   │
│  │   Auth (JWT)    │    │   PostgreSQL (Data)  │   │
│  └─────────────────┘    └──────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Prerequisites

1. **PostgreSQL** (untuk mode local) atau **Supabase Project** (untuk mode supabase)

2. **Bun** terinstall
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

3. **Project Supabase** (untuk Auth)
   - Buat project di [https://supabase.com](https://supabase.com)
   - Enable Google OAuth provider

---

## ⚙️ Environment Configuration

### Backend (`api/.env`)

```bash
# ============================================
# DATABASE PROVIDER (PILIH SALAH SATU)
# ============================================
# Option 1: "local" - Gunakan PostgreSQL lokal
# Option 2: "supabase" - Gunakan Supabase PostgreSQL
DATABASE_PROVIDER=local

# ============================================
# DATABASE URLs (isi sesuai provider)
# ============================================
# Jika DATABASE_PROVIDER=local:
DATABASE_URL=postgresql://postgres:password@localhost:5432/famfinance

# Jika DATABASE_PROVIDER=supabase:
SUPABASE_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres

# ============================================
# SUPABASE AUTH (WAJIB - untuk semua provider)
# ============================================
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Environment
NODE_ENV=development
```

### Frontend (`web/.env.local`)

Sama untuk semua provider:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🚀 Quick Switch Database

### Switch ke Local PostgreSQL
```bash
# Edit api/.env
DATABASE_PROVIDER=local
DATABASE_URL=postgresql://postgres:password@localhost:5432/famfinance

# Restart server
bun run dev
```

### Switch ke Supabase PostgreSQL
```bash
# Edit api/.env
DATABASE_PROVIDER=supabase
SUPABASE_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres

# Restart server
bun run dev
```

---

## ✅ Verifikasi Setup

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "database": "connected",
  "provider": "local",  // atau "supabase"
  "mode": "local_postgres_with_supabase_auth"
}
```

---

## 📊 Perbandingan Provider

| Aspek | Local | Supabase |
|-------|-------|----------|
| **Setup** | Butuh install PostgreSQL | Hanya butuh URL |
| **Offline Development** | ✅ Bisa | ❌ Tidak |
| **Cost** | Gratis (server sendiri) | Free tier / Paid |
| **Backup** | Manual | Otomatis |
| **Performance** | Tergantung hardware | Managed |
| **Best For** | Development | Production |

---

## 🗄️ Setup Database

### Mode Local (PostgreSQL)

```bash
# 1. Buat database
psql -U postgres -c "CREATE DATABASE famfinance;"

# 2. Jalankan migration
cd api
bun drizzle-kit migrate
```

### Mode Supabase

```bash
# 1. Copy SQL dari drizzle/ ke SQL Editor Supabase
# 2. Jalankan migration via Supabase Dashboard
# 3. Atau gunakan Supabase CLI
supabase db push
```

---

## 🔐 Cara Kerja Autentikasi (Sama untuk Semua Provider)

1. **User login** via Google OAuth (Supabase)
2. **Supabase** mengembalikan JWT token ke frontend
3. **Frontend** mengirim token di header `Authorization: Bearer <token>`
4. **Backend** verifikasi token menggunakan Supabase JWKS
5. **Backend** query data dari database (local/supabase sesuai config)

---

## 📝 Catatan Penting

1. **Supabase Auth selalu digunakan** untuk autentikasi, regardless database provider
2. **Switching provider** hanya perlu ubah `DATABASE_PROVIDER` dan URL database
3. **Schema database** sama untuk kedua provider
4. **Data tidak otomatis sync** antara local dan supabase (perlu migrasi manual)

---

## 🔄 Migrasi Data (Local ↔ Supabase)

### Local → Supabase
```bash
# Export local
pg_dump -U postgres -d famfinance > backup.sql

# Import ke Supabase (via psql atau Supabase Dashboard)
psql -h db.xxx.supabase.co -U postgres -d postgres < backup.sql
```

### Supabase → Local
```bash
# Export Supabase
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql

# Import ke local
psql -U postgres -d famfinance < backup.sql
```
