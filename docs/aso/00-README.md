# Social Fit — ASO İçerik Paketi (store öncesi)

> Kopyala-yapıştır'a hazır App Store + Google Play metadata paketi. **TR birincil + EN.**
> Kaynak kurallar: `.claude/skills/marketing/mkt-aso` (char limitleri, keyword), `mkt-brand-voice` (KVKK dili). Üretim: 2026-07.

## Bu paket nedir, nasıl kullanılır
1. Submit sırasında ilgili dosyayı aç, alanları App Store Connect / Play Console'a yapıştır.
2. Başlık için **2 varyant** var (A=kontrol, B=challenger) → biriyle yayına çık, diğerini A/B'ye koy (`05-experiments.md`).
3. Görseller bu pakette **değil** — `04-screenshots-brief.md` her ekranın *mesajını* verir; tasarım ayrı iş.

| Dosya | İçerik |
|---|---|
| `01-keywords.md` | TR + EN keyword kümeleri (high-intent / farklılaşma / long-tail) |
| `02-appstore-metadata.md` | iOS: başlık ×2, alt başlık, keyword alanı (100), açıklama, promo — TR + EN |
| `03-playstore-metadata.md` | Android: başlık, kısa+tam açıklama — TR + EN |
| `04-screenshots-brief.md` | 5-6 screenshot mesajı + sıra + preview video senaryosu |
| `05-experiments.md` | Apple PPO + Play Store Listing Experiments A/B planı |

## Konumlandırma (tüm metnin dayanağı)
"MyFitnessPal kalori **sayar**, biz seni **yolda tutar**." Kalabalık *kalori sayaç* kategorisinde head term'le boğuşmak yerine **"sosyal diyet / diyet motivasyonu"** kategorisini sahiplen. Farklılaşma: **sosyal baskı + gamification (streak/liderlik) + diyetisyen erişimi**. (TR pazar teyidi: Diyetkolik/YAZIO/MyFitnessPal "kalori sayacı" ekseninde; sosyal açı büyük ölçüde boş — yalnız FatSecret'ta sınırlı sosyal var.)

## 3 çelişki — verilen kararlar
1. **Başlık ≤30 karakter.** README'deki `Diyet & Kalori Takip – Social Fit` (33) limiti aşıyordu → markayı kısalttık/böldük, tüm başlıklar ≤30 (dosyada karakter sayısı belirtili).
2. **Screenshot sırası:** `mkt-aso` sırası kullanıldı → sosyal/streak → yemek günlüğü → liderlik → diyetisyen → haftalık kart (README'nin "Problem→Çözüm→Sonuç"u yerine).
3. **Dürüstlük:** Uygulamada **olmayan** özelliklere keyword YOK → `adım sayar`, "AI yemek tanıma", HealthKit **çıkarıldı** (store reddi + KVKK). Sadece shipped özellikler hedeflendi.

## KVKK / dürüstlük sınırı (zorunlu — tüm metinlerde uygulandı)
- YASAK: "tedavi", "teşhis", "hastalık iyileştirir", "garantili X kilo", "ilaç yerine".
- Uydurma indirme sayısı / sahte kullanıcı yorumu YOK.
- Sağlık verisi özel nitelikli → "öneri/motivasyon/takip" dili.

## Submit öncesi ön koşullar (bu paket bloklamaz — ayrı işler)
- [ ] **App ikonu + splash + screenshot görselleri yok** (`mobile/app.json`'da `icon`/splash `image` tanımsız; assets'te yok). Faz 3 tasarım işi — ASO metni bundan bağımsız hazır.
- [ ] **Store URL / paket tutarsızlığı:** `app.json` bundle = `com.socialfit.app`, ama `mobile/src/screens/main/RateUsScreen.js` Play linki `app.socialfit`; `MoreScreen.js` `INVITE_URL` placeholder. Submit öncesi düzelt (gerçek App ID + doğru paket).
- [ ] Apple Developer ($99/yıl) + Google Play ($25) hesapları, gizlilik politikası URL'i (uygulamada `Info` ekranında taslak metin var — yayına çıkmadan gerçek metin gerekli).

## Aşama 5 — Launch sonrası ASO bakımı (ongoing)
- Keyword sıralamalarını haftalık izle (AppTweak / Mobile Action / App Store Connect Analytics). **Bu paketteki hacim/zorluk tahminleri heuristiktir — gerçek araç ile doğrula.**
- Her yeni özellik shipped olunca keyword alanına ekle (grup challenge çıkınca `challenge/yarışma`, HealthKit çıkınca `adım sayar`).
- İlk 2 hafta yorumlara yanıt ver (rating ivmesi ASO sıralamasını besler; uygulamadaki `RateUs` <4★ içeri / ≥4★ store akışı bunu destekliyor).
- Aylık: en düşük dönüşümlü screenshot'ı ve başlık varyantını `05-experiments.md`'ye göre test et.
