# Social Fit — Claude Code Project Memory

Bu dosya her oturumda otomatik yüklenir. Tüm agent'lar buradan başlar. Detay için `README.md` ve `.claude/ARCHITECTURE.md`'e bak.

## Ürün özeti (1 paragraf)

Social Fit — sağlıklı yaşam odaklı bir sosyal medya uygulaması (TR pazarı öncelik, sonra global). Kullanıcılar öğün/spor paylaşır, **streak ve yıldız puanı** kazanır, **WhatsApp benzeri kanal/grup'lara** katılır, **diyetisyen rezervasyonu** alır, **haftalık özet kartı**nı Instagram'a paylaşır. Stack: React Native + Expo (mobile), Node + Express + Prisma + SQLite (dev) / PostgreSQL (prod hedefi). Hedef: gamification + sosyal baskı ile diyet motivasyonu.

## Şu anki durum (Faz 1 — 2/10)

✅ Onboarding akışı | ✅ Onboarding tekrar gösterim fix
⏳ FoodLog backend + mobil ekranlar | ⏳ Star economy + leaderboard | ⏳ Group challenge | ⏳ Step2→Step3 kalori parseFloat bug | ⏳ SQLite→Postgres | ⏳ Polling→Socket.io

5 fazlık roadmap için: `.claude/skills/social-fit-domain/SKILL.md`.

## Proje yapısı

```
backend/                  Express + Prisma + SQLite
  src/routes/             auth, foodlog, posts, groups, messages, streaks, leaderboard,
                          coaches, bookings, notifications, tools, users
  src/middleware/auth.js  JWT authMiddleware → req.user
  src/services/           starService (awardPoints), streak servisleri
  prisma/schema.prisma    ER modeli
  uploads/                multer upload klasörü

mobile/                   React Native + Expo SDK 54
  src/api/client.js       useApi() hook'u — get/post/patch/delete/patchForm
  src/screens/
    auth/                 login + register
    onboarding/           Curiosity Hook → Empati → Hedef → Profil → Kimlik → Kanal → Taahhüt → İlk görev
    main/                 Feed, Profile, Groups, Messages, Leaderboard
    foodlog/              Yemek günlüğü
  src/components/sf/      Atomic SocialFit component'leri
  src/theme/socialFitTheme.js   colors / spacing / radius / font / shadow token'ları
  src/context/AuthContext.js    token yönetimi
  src/store/              zustand store'lar
```

## Çalıştırma

```bash
# Backend
cd backend && npm install && npx prisma db push && node prisma/seed.js && npm run dev
# Mobile (ayrı terminal)
cd mobile && npm install && npx expo start
# mobile/src/config.js → API_BASE'i kendi IP'ne ayarla (emülatörde localhost olmaz)
```

## Multi-Agent yapı

Dört subagent (`.claude/agents/`):
- **`feature-spec`** — TR feature isteğini spec'e çevirir (Read-only)
- **`ui-designer`** — `mobile/` UI ekranlarını design system'e uygun yazar
- **`backend-ui-bridge`** — API kontratını (mobile ↔ backend) ve state/data-flow uyumunu tutarlı tutar
- **`qa-reviewer`** — feature/refactor sonrası bağımsız review yapar, PASS/NEEDS-FIX/BLOCKED döner

Sekiz skill (`.claude/skills/`):
- `social-fit-domain` — ürün vizyonu, onboarding modeli, 5 fazlı roadmap
- `ui-design-system` — Social Fit token kullanımı
- `mobile-screen-patterns` — ekran iskeleti pattern'leri
- `api-contract-check` — mobile ↔ backend kontrat eşleştirme
- `backend-route-patterns` — Express + Prisma + validator konvansiyonları
- `feature-spec-writer` — spec şablonu
- `state-data-flow-patterns` — loading/error/empty/optimistic/store kullanımı
- `feature-delivery-checklist` — Definition of Done
- `qa-review-checklist` — qa-reviewer'ın zorunlu kontrol listesi

Handoff dosyaları (`.claude/handoffs/`):
- Non-trivial feature için bir `.md` aç — `_TEMPLATE.md`'i kopyala
- Tüm agent'lar aynı dosyaya yazar/okur — subagent'ların kalıcı paylaşım katmanı
- Trivial fix için handoff açma

Detaylı orkestrasyon: `.claude/ARCHITECTURE.md`.

## Domain-spesifik kurallar

- **Dil:** Kod İngilizce (değişken/fonksiyon), UI metni Türkçe, log/yorum karışık olabilir.
- **Para birimi:** TL. Iyzico/PayTR (TR), Stripe (international, Faz 2+).
- **Streak kuralı:** Günlük en az 1 paylaşım/log → +1 streak. 1 gün atlama → sıfırlanır. Gün dönüşü 00:00 local.
- **Star economy:** Her eylem (post, comment, log, daily streak) `starService.awardPoints` ile loglanır → leaderboard.
- **KVKK:** Sağlık verisi özel nitelikli → açık rıza zorunlu. "Tedavi/teşhis" kelimesi YOK, "öneri" tamam.
- **Onboarding:** "Curiosity Hook → Empati → Motivasyon → Hedef → Profil → Kimlik → Kanal → Taahhüt → İlk mikro-görev → Sonuç" akışı. Detay için domain skill.

## Kod ipuçları

- API çağrısı pattern'i (cancel guard'lı): `OnboardingSocialStep`'e bak — reference implementation.
- `useApi()` artık `useMemo`'lu — dependency olarak `[api]` koy, `[token]` koyma.
- Yeni Prisma model/alan: `npx prisma migrate dev --name <açıklama>` (dev için).
- Multer upload alan adı `image` standart — mobile + backend eşleşmeli.

## Kararlar (gerekirse hatırlat)

- **DB:** Şu an SQLite dev'de, prod için Postgres'e geçiş Faz 1 listesinde.
- **Realtime:** Şu an polling, Socket.io geçişi Faz 1'de planlı.
- **Auth:** JWT + email/şifre. Telefon (Firebase OTP) Faz 2'de.
- **Ödeme:** Iyzico Faz 2'de. Şu an ödeme yok.
