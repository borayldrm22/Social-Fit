---
name: social-fit-domain
description: Social Fit'in ürün vizyonu, onboarding modeli, gamification kuralları, 5 fazlı roadmap, monetizasyon ve ilham uygulamaları. Yeni feature, yeni ekran veya iş kararı içeren her görevde yükle.
---

# Social Fit — Domain Bilgisi

## Vizyon (tek cümle)

Sağlıklı yaşamı oyun gibi yaşatan, **sosyal baskı + gamification + uzman erişimi** üçlüsüyle insanların diyete bağlı kalmasını kolaylaştıran Türk pazarı odaklı sosyal medya app'i.

## Hedef kullanıcı

- 18-45 yaş, mobil-first, Türkçe konuşan
- Diyete başlayıp bırakanlar — sosyal motivasyon arıyor
- Birinci grup: kilo vermek isteyenler; ikincil: kas kazanma + sürdürülebilir sağlıklı yaşam

## Faz 1 — Çekirdek Geliştirme (8/10, çekirdek döngü tamam)

| Durum | Görev |
|---|---|
| ✅ | Onboarding akışı (8 adım — kullanıcı adı/telefon + rutin seçimi dahil) |
| ✅ | Yemek günlüğü — backend (FoodLog CRUD, besin arama) + mobil (FoodLog/AddFood/haftalık) |
| ✅ | Yıldız puan ekonomisi (StarTransaction ile her eyleme puan log) |
| ✅ | Liderlik tablosu (haftalık/aylık/tüm zamanlar) |
| ✅ | Onboarding kalori parseFloat bug (TR virgül fix — `utils/parseDecimal`) |
| ✅ | SQLite → PostgreSQL geçişi (Supabase, dev+prod) |
| ✅ | Rutin takibi (Faz 3 UI) + Ayarlar redesign |
| ⏳ | Grup challenge sistemi (7 günlük yarış, mini leaderboard) |
| ⏳ | Polling → Socket.io geçişi (gerçek zamanlı sohbet) |

## Faz 2 — Monetizasyon & Altyapı (4-8 hafta)

Iyzico ödeme, Premium abonelik (ilk ay ücretsiz), FCM push, Firebase OTP telefon girişi, haftalık/aylık paylaşım kartı, blog CMS (Strapi/Contentful), rate limiting, içerik moderasyon altyapısı.

## Faz 3 — Mağaza Hazırlığı (8-12 hafta)

Apple Developer ($99/yıl) + Google Play ($25 tek sefer) hesapları, app icon + splash, store screenshot'ları, TR+EN store açıklaması, app preview video, KVKK + kullanım koşulları, TestFlight beta, Sentry/Crashlytics, App Review başvurusu.

## Faz 4 — Launch Öncesi Pazarlama (10-14 hafta)

Landing page + waitlist, sosyal medya hesapları (@SosyalFit), ilk 10 blog yazısı (SEO), influencer listesi, 5-10 beta kullanıcı görüşmesi, rakip analizi (MyFitnessPal, Lifesum, Supatrack), fiyatlandırma kararı.

## Faz 5 — Launch & Büyüme

Soft launch (davet kodlu, ilk 100 kullanıcı), influencer işbirlikleri, Google App Campaigns, Apple Search Ads, aylık ödül mekanizması, ilk 3 diyetisyen partnerlik, D1/D7/D30 retention (Mixpanel/Amplitude), ASO, kullanıcı yorum kampanyası, HealthKit/Google Fit entegrasyonu.

## Onboarding Modeli — Curiosity Hook

Akış: **İlgi Uyandırma → Empati → Motivasyon → Hedef Netleştirme → Profil → İlerleme → Kimlik → Kanal → Taahhüt → İlk Mikro-Görev → Sonuç**.

| Adım | Ekran amacı | Örnek soru |
|---|---|---|
| 1 İlgi | Vaat göster, soru sorma | "3 dakikada sağlıklı yaşam sosyal medyasına adım at" |
| 2 Empati | "Bu app beni anlıyor" hissi | "En fazla 3 hedef seç" + "En çok zorlandığın konu" |
| 3 Motivasyon | Sıcak karşılama | "Vücudun ve iraden sandığından güçlü" |
| 4 Hedef netleştirme | Somut hedef + süre | "Kaç kilo?" + "Ne kadar sürede?" |
| 5 Profil | BMR hesabı için veri | Cinsiyet, yaş, boy, kilo, aktivite |
| 6 Progress | %70 göster, motive et | "Neredeyse bitti, son adımlar" |
| 7 Kimlik | Psikolojik commitment | "Seni tanımlayan 3 cümle seç" |
| 8 Kanal | Topluluk önerisi | "Kendi kanalını yarat / uzmanınkine katıl" |
| 9 Taahhüt | Söz alma | "Her gün 5 dk ayırmaya hazır mısın?" |
| 10 İlk görev | Hemen aksiyon | "İlk paylaşımını yap, bonus puan kazan" |
| 11 Sonuç | Kişisel değer ekranı | "Günlük kalori X kcal, hedef süre 8 hafta" |

**Kurallar:**
- Tek soru → tek ekran (kullanıcıyı yorma)
- Progress bar her ekranda (`Step 3/10`)
- Büyük seçim butonları (radio değil card tarzı)
- Sonuç ekranı **kişisel değer** üretmeli (sayı/tahmin)
- Toplam 10-12 ekran ideal

## Gamification Kuralları

- **Streak:** Günde en az 1 paylaşım/log → +1. Atlama → 0. Gün dönüşü 00:00 local.
- **Yıldız puanı:** Her eylem `awardPoints` ile loglanır. Güncel puan tablosu (koddaki değerler):
  - Günlük paylaşım (post veya foodlog, günde **MAX 1**): **20** — `recordStreak` içinde merkezî verilir
  - Haftalık seri bonusu (7/14/21… ardışık günde): **50** (`streak_weekly`)
  - Grup katılımı: **10** (bir kez) · Yorum: 2 · beğeni alınan: 1 · arkadaş eklenen: 15 · profil tamamlama: 20 · koç randevu: 25 (**koç başına bir kez**)
- **Rozet:** 7/14/30/60/90/180/365 gün streak'te otomatik.
- **Leaderboard:** Haftalık (Pazartesi reset), aylık (1. reset), tüm zamanlar.
- **Aylık ödül:** 1.'ye sponsor ürün / kişisel diyet listesi.
- **Hile önleme:** Geriye dönük log düzenleme yasak, tek IP'den çoklu hesap kısıtı.

## Monetizasyon (Türkiye odaklı)

| Model | Öncelik | Not |
|---|---|---|
| Premium abonelik | 1 (ana) | Aylık/yıllık, ilk ay ücretsiz, reklamsız + diyetisyen seans + özel içerik |
| Tek seans koçluk | 2 | Doğrudan gelir, TR kullanıcısı tek seferlik ödemeye alışkın |
| Seans paketleri | 3 | 5 seans bundle gibi |
| Reklam | 4 | Sadece free tier, KVKK uyumlu, sağlık app'te dikkatli |
| Affiliate | 5 | Sağlık ürünleri, dikkatli seçim |

**TR kullanıcı davranışı:** Abonelik bilinci düşük, tek seferlik ödemeye daha açık. Free trial + soft paywall denenmeli.

## Hukuk & Gizlilik (TR)

- **KVKK Md.6:** Sağlık verisi özel nitelikli kişisel veri → açık rıza şart.
- **Dil:** "Tedavi/teşhis/iyileştirme" YOK. "Genel öneri/bilgilendirme" tamam.
- **Uyarı metni:** "Beslenme önerileri doktor onayıyla" zorunlu.
- **Ödeme regülasyonu:** 6493 sayılı Elektronik Para Kanunu — Iyzico/PayTR uyumlu.
- **Uluslararası:** GDPR (EU), HIPAA (ABD sağlık) ileride.

## UI/UX İlham Kaynakları

- **Supatrack** — feed + Squad grupları + streak profili
- **Calorify** — renkli grafik + meydan okuma
- **Strava** — leaderboard + arkadaş aktiviteleri (sosyal motivasyon)
- **Duolingo** — streak göstergesi + günlük motivasyon (en güçlü referans)
- **Habitica** — RPG temalı görev/ödül
- **YAZIO / Lifesum** — temiz hedef ilerleme grafikleri
- **BeReal** — günlük basit paylaşım baskısı
- **MyFitnessPal** — yemek tracking olgun ürün
- **Habitica + Duolingo'nun streak/badge kombosu** Social Fit için referans #1.

## Veri Modeli (özet — Prisma'da somut)

```
USER → POST, MESSAGE, GROUP (join), STREAK, BADGE, BOOKING, FOODLOG, NOTIFICATION
GROUP → POST (içerir)
COACH → BOOKING (sunar)
USER ←→ STAR_TRANSACTION (her eylem)
```

## Çekirdek metrikler (Faz 5 için takip)

- **DAU/MAU** — engagement
- **D1, D7, D30 retention** — onboarding kalitesi sinyali
- **Streak medyanı** — gamification etkinliği
- **Premium conversion %** — monetizasyon sağlığı
- **Coach booking sayısı** — secondary revenue
- **Paylaşılan story kartı sayısı** — viral growth

## "Bunu yapma" listesi (anti-pattern'ler)

- Kullanıcıya sayısal kalori hedefi sormadan veri toplama (onboarding'in sonu kişisel değer üretmek zorunda).
- Reklamı premium kullanıcıya gösterme (KVKK + brand güveni).
- Streak'i geriye dönük "tamir et" butonuyla bozma (hilenin temeli).
- "Tıbbi tavsiye" tonlu mikrocopy.
- Tüm onboarding'i tek scroll'a sıkıştırma — pattern tek soru/tek ekran.
