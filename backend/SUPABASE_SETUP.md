# Supabase + Render Geçiş Rehberi

Kod tarafı hazır. Bu dosyadaki adımlar **senin yapman gereken** hesap/altyapı kurulumudur
(ben senin adına Supabase/Render hesabı açamam). Adımlar sırayla.

Mevcut durum: kod hem **SQLite (dev)** hem **Supabase (prod)** ile çalışır.
- Dosya yükleme: `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` **boşsa** yerel diske, **doluysa** Supabase Storage'a gider.
- DB: `schema.prisma`'daki `provider` hâlâ `sqlite`. Postgres'e geçerken tek satır değişir (aşağıda).

---

## 1) Supabase projesi oluştur
1. https://supabase.com → yeni proje. **Region: Central EU (Frankfurt) `eu-central-1`**.
2. Güçlü bir DB şifresi belirle (kaydet).
3. **Storage → New bucket** → ad: `uploads`, **Public bucket: açık** (resimler public URL ile yüklenecek).

## 2) Bağlantı bilgilerini al
- **Settings → Database → Connection string → "Connection pooling"**: `DATABASE_URL` (port **6543**, sonuna `?pgbouncer=true`).
- Aynı yerden **direct** (port **5432**): `DIRECT_URL`.
- **Settings → API**: `Project URL` → `SUPABASE_URL`; `service_role` secret → `SUPABASE_SERVICE_KEY` (⚠️ mobile'a asla koyma).

## 3) Prisma'yı Postgres'e çevir
`backend/prisma/schema.prisma` datasource bloğu:
```prisma
datasource db {
  provider  = "postgresql"      // önceden: "sqlite"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```
`backend/.env` içine (2. adımdaki değerlerle):
```
DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...:5432/postgres"
SUPABASE_URL="https://<ref>.supabase.co"
SUPABASE_SERVICE_KEY="<service_role>"
SUPABASE_BUCKET="uploads"
```
Sonra:
```bash
cd backend
npx prisma db push      # şemayı Supabase'e uygula (veri yok, güvenli)
node prisma/seed.js     # başlangıç verisi
npm run dev             # loglarda "Supabase Storage aktif" görmelisin
```
Doğrula: kayıt ol → Supabase **Table Editor**'da `User` satırı; fotoğraflı post → **Storage/uploads** bucket'ında dosya.

## 4) Render'a deploy (ücretsiz)
1. https://render.com → **New → Blueprint** → repo'yu bağla (`render.yaml` otomatik okunur).
2. Secret env'leri (sync:false) dashboard'da gir: `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `BASE_URL` (= Render servis URL'in, ör. `https://social-fit-api.onrender.com`), gerekiyorsa `CORS_ORIGINS`.
3. Deploy → `https://<servis>.onrender.com/api/health` → `{ "ok": true }`.
4. `mobile/src/config.js` prod `API_BASE`'i Render URL'ine güncelle.

> Not: Render free servis 15 dk hareketsizlikte uyur (ilk istek ~30-50 sn). Supabase free proje 7 gün hareketsizlikte durur — `/api/health`'e UptimeRobot/cron ping ile önlenebilir. Gerçek kullanıcı gelince ikisi de sorun olmaz.

## Güvenlik (kodda halledildi)
- `JWT_SECRET` zorunlu (yoksa sunucu açılmaz), `'secret'` fallback kaldırıldı → **prod'da güçlü değer şart**.
- `helmet` + auth uçlarında rate-limit aktif.
- `service_role` anahtarı yalnız backend env'inde; mobile'da **asla** olmamalı.
