# Social Fit Mobile (Expo)

React Native (Expo SDK 54) app for Social Fit.

## Setup

1. Install dependencies: `npm install`
2. In `src/config.js`, set `API_BASE` to your backend URL (e.g. `http://YOUR_IP:4000` for device). Default prod: Render Frankfurt.
3. Add assets: `assets/icon.png`, `assets/splash.png`, `assets/adaptive-icon.png` (or use Expo defaults).
4. Run: `npx expo start`

## Features

- Auth: login / register / şifre sıfırlama (OTP); 8 adımlı onboarding (hedef, profil, aktivite, rutin seçimi, kullanıcı adı + telefon, kanal, taahhüt, sonuç)
- Feed: post (öğün/antrenman/genel + foto/video), beğeni, yorum, kaydet, görüntülenme; tam ekran görsel + pinch/pan/çift-dokun zoom
- Beslenme: kalori/makro özeti, öğün defteri (FoodLog), yemek arama, tarifler, Günlük Rutinler kartı
- Rutinler: RoutinesScreen (tamamla/ekle/sil), +3 yıldız kutlaması, streak entegrasyonu
- Profil: streak, rozetler, yıldız puanı, takipçi/takip, aylık takvim, profil düzenleme
- Gruplar: liste, oluştur, keşfet, harita, katıl/istek, grup akışı
- Mesajlar: sohbetler, chat (başlıktan profile git, gerçek son-görülme durumu), kullanıcı arama
- Lider tablosu (hafta/ay), yıldız kazanma rehberi + kutlama overlay'i
- Koç & Diyetisyen: liste + randevu (booking)
- Bildirimler: liste, okunmamış rozeti, takip isteği kabul/ret
- Araçlar: BMI, günlük kalori, su/makro hesaplayıcıları
- Ayarlar: Kişisel Bilgiler, Şifre Değiştir, gizli hesap, bildirim tercihleri, SSS/Şartlar/Gizlilik/Hakkımızda/İletişim, Bizi Değerlendir (<4★ içeri geri bildirim / ≥4★ mağaza)

## Notlar

- Design token'ları: `src/theme/socialFitTheme.js` (colors/font/radius/shadow) — yeni ekranlar bunları kullanmalı.
- API: `src/api/client.js` `useApi()` — dependency olarak `[api]` koy.
- TR ondalık: sayı girişlerinde `src/utils/parseDecimal.js` kullan (virgül desteği).
