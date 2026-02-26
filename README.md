# Social Fit

Sağlıklı yaşam sosyal medya uygulaması — öğün/spor paylaşımı, streak/rozetler, gruplar, mesajlaşma, BKİ/kalori araçları.

## Proje yapısı

- **backend/** — Node.js + Express + Prisma (PostgreSQL) API
- **mobile/** — React Native (Expo) iOS/Android uygulaması

## Backend

```bash
cd backend
cp .env.example .env   # DATABASE_URL ve JWT_SECRET ayarla
npm install
mkdir -p uploads
npx prisma db push
node prisma/seed.js
npm run dev
```

API: `http://localhost:4000`

## Mobile

```bash
cd mobile
npm install
# src/config.js içinde API_BASE adresini backend URL ile güncelle (emülatör: localhost, cihaz: bilgisayar IP)
npx expo start
```

## MVP özellikler

- Kayıt / giriş (e-posta)
- Profil (düzenleme, streak, rozetler)
- Beslenme günlüğü (foto + log), feed, beğeni, yorum
- Gruplar (oluştur, keşfet, katıl, grup feed)
- Mesajlaşma (arkadaşlarla sohbet)
- Streak & rozetler, lider tablosu
- Araçlar: BKİ, günlük kalori
- Ayarlar, KVKK/gizlilik linkleri, çıkış

## Sonraki adımlar (Faz 2–3)

- Gerçek zamanlı sohbet (WebSocket)
- Premium abonelik ve koç randevusu ödemeleri (Iyzico/PayTR)
- Push bildirim altyapısı (FCM/OneSignal)
- Blog/makale kanalı, özet paylaşım kartları
