---
name: qa-review-checklist
description: qa-reviewer agent'ının bir feature/refactor'u onaylamadan önce gözden geçirdiği zorunlu kontrol maddeleri. Acceptance criteria, design token, API contract, state, auth, build sağlığı.
---

# QA Review Checklist

Bu liste `qa-reviewer` agent'ı için zorunlu kontrol seti. Her madde ya ✅ ya ❌ ya da ⚠️ (uyarı) işaretlenir.

## A — Acceptance Criteria

- [ ] Spec'teki her acceptance criterion implementation'a yansımış mı?
- [ ] Her madde için kanıt (dosya:satır) verildi mi?
- [ ] Out-of-scope sınırı korunmuş mu (scope creep yok mu)?

## B — Design System (Mobile)

- [ ] Hardcode renk yok (`rg "#[0-9A-Fa-f]{3,6}" mobile/src/screens` temiz)
- [ ] Hardcode spacing/radius/font literal'i yok (sayı yerine `spacing.*`, `radius.*`, `font.*`)
- [ ] Yeni component `mobile/src/components/sf/` veya benzer atomic klasörde mi
- [ ] `mobile/src/theme/socialFitTheme.js` dışında token tanımı yok

## C — State / Data Flow

- [ ] Data-fetch eden her ekranda **loading state** var
- [ ] Data-fetch eden her ekranda **error state** var
- [ ] Liste döndüren her ekranda **empty state** var
- [ ] `useEffect` cancel guard kullanılmış (`cancelled` flag pattern)
- [ ] `useApi()` dependency olarak `[api]` kullanılmış, `[token]` değil

## D — API Contract

- [ ] Mobile çağrı path'i backend route ile eşleşiyor
- [ ] Method eşleşiyor (GET/POST/PATCH/DELETE)
- [ ] Request body backend validator'ı geçer mi
- [ ] Response shape mobile tarafta doğru alanlardan tüketiliyor
- [ ] Multipart upload ise field adı `image` (veya tutarlı isim)

## E — Backend Sağlığı

- [ ] Yeni route'a `authMiddleware` eklenmiş (public değilse)
- [ ] `express-validator` ile body validation var
- [ ] Hata kodları doğru (400/401/403/404/409/500)
- [ ] Response shape README'deki domain modeline uygun
- [ ] Yan etki gerekiyorsa `awardPoints` / `recordStreak` çağrılmış
- [ ] `prisma.<model>` global instance kullanılıyor, handler içinde değil

## F — Prisma & DB

- [ ] Schema değiştiyse migration adı önerildi mi
- [ ] Migration breaking mi (mevcut veri etkilenir mi)
- [ ] `select`/`include`'larda sızdırılmaması gereken alan (`password`) gizli mi

## G — Import / Export

- [ ] Yeni dosya doğru export ediyor (named vs default tutarlı)
- [ ] Yeni screen `Navigator`'a eklenmiş mi
- [ ] Mevcut import path'leri kırılmadı

## H — Build / Sağlık

- [ ] `cd backend && node -c src/index.js` syntax OK
- [ ] Mobile için `npx tsc --noEmit` veya babel parse OK (varsa)
- [ ] `git status` beklenmeyen dosya değişikliği var mı

## I — Handoff Sağlığı

- [ ] Handoff dosyasında `Changed Files` listesi gerçek diff ile eşleşiyor
- [ ] Handoff'ta `Status` bayrakları güncellendi (Spec/UI/API/QA)
- [ ] `Open Questions` kalmamış (varsa supervisor'a flag)

## J — Domain Spesifik (Social Fit)

- [ ] Yıldız puanı veya streak'i etkileyen değişiklik varsa `starService.awardPoints` çağrısı var
- [ ] KVKK sınırı ihlali yok ("tedavi/teşhis" kelimesi UI/copy'de yok)
- [ ] TR copy doğru (eksik karakter, gramer)
- [ ] Para birimi TL (yeni ödeme varsa)

## Karar matrisi

| Durum | Sonuç |
|---|---|
| Tüm A + B + D + E ✅ | `PASS` |
| Acceptance criterion eksik / blocker bug | `BLOCKED` |
| Küçük design token sapması, eksik empty state | `NEEDS-FIX` |
| Build kırık | `BLOCKED` |
