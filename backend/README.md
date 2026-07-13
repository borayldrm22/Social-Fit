# Social Fit Backend

Node.js + Express + Prisma (PostgreSQL — Supabase, dev+prod) API.

## Setup

DB **Supabase PostgreSQL** (dev+prod aynı). `.env` içinde `DATABASE_URL` (pooler, 6543) ve `DIRECT_URL` (5432, **`?sslmode=require` şart** — Supabase self-signed cert zinciri) tanımlı olmalı.

1. Copy `.env.example` to `.env` ve Supabase bağlantı bilgilerini gir.
2. `npm install`
3. `npx prisma generate && npx prisma db push` (şema değişiklikleri için `db push`; `migrate dev` KULLANMA — hosted Postgres'te destructive reset riski)
4. `node prisma/seed.js` (creates badges + admin user: **admin@example.com** / **admin123**)
5. `npm run dev`

Deploy: Render (Frankfurt) — Supabase EU ile aynı bölge.

## Endpoints

Auth & kullanıcı:
- `POST /api/auth/register` / `POST /api/auth/login` / `GET /api/auth/me`
- `POST /api/auth/forgot-password` / `POST /api/auth/reset-password` (OTP)
- `GET/PATCH /api/users/me` - Profil (avatar multipart: `avatar`)
- `PATCH /api/users/me/onboarding` - Onboarding verisi
- `PATCH /api/users/me/password` - Şifre değiştir (currentPassword, newPassword)
- `POST /api/users/me/feedback` - Uygulama içi değerlendirme geri bildirimi
- `GET /api/users/me/calendar` / `GET /api/users/me/star-history`
- `GET /api/users/search?q=` / `GET /api/users/suggestions` / `GET /api/users/username-available?username=`
- `GET /api/users/:id` - Herkese açık profil (yalnızca public alanlar) + `GET /api/users/:id/presence`
- `GET /api/users/:id/posts|followers|following|common-groups`
- `POST/DELETE /api/users/:id/follow` / `POST /api/users/friends/accept` / `GET /api/users/friends`

İçerik:
- `GET /api/posts/feed` / `GET /api/posts/discover`
- `POST /api/posts` - Create post (multipart: `image`, type, caption, tags, groupId)
- `POST/DELETE /api/posts/:id/like` / `POST/DELETE /api/posts/:id/save` / `GET /api/posts/saved`
- `GET/POST /api/posts/:id/comments` / `POST /api/posts/:id/view`
- `GET /api/recipes` / `GET /api/recipes/:id`

Gruplar & mesajlar:
- `GET/POST /api/groups` / `GET /api/groups/discover` / `POST /api/groups/:id/join`
- `GET /api/groups/:id/posts` + üyelik/istek yönetimi route'ları
- `GET /api/messages/conversations` / `GET /api/messages/:userId` / `POST /api/messages` / `GET /api/messages/unread-count`

Gamification & sağlık:
- `GET /api/streaks/me` / `POST /api/streaks/record`
- `GET /api/leaderboard?period=week|month|all`
- `GET/POST /api/foodlog` (`?date=YYYY-MM-DD`, `search`, `weekly-summary`, `DELETE /:id`)
- `GET/POST /api/routines` / `POST /api/routines/bulk` / `PATCH /api/routines/:id/complete` / `DELETE /api/routines/:id`
- `GET /api/coaches` / `GET/POST /api/bookings`
- `GET /api/notifications` (+ `unread-count`, `read-all`, follow-request accept/reject)
- `POST /api/tools/bmi` / `POST /api/tools/calorie`

Not: Star ödülleri `starService.awardPoints` üzerinden loglanır (rutin: gün başına 1, koç randevusu: koç başına 1 kez).
