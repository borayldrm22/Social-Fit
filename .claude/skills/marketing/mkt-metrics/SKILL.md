---
name: mkt-metrics
description: Pazarlama metrikleri — CAC, LTV, D1/D7/D30 retention, ROAS, funnel dönüşüm tanımları, north-star metrik ve analist checklist'i. Kampanya hedefi belirlerken ve sonuç değerlendirirken yüklenir.
---

# Pazarlama Metrikleri

## North-star (öneri)

**Haftalık aktif kullanıcı (streak devam edenler)** — ürünün değeri retention'da. Edinim buna hizmet eder.

## Temel tanımlar

| Metrik | Tanım | Not |
|---|---|---|
| CAC | edinim maliyeti / yeni kullanıcı | kanal bazında ayır |
| LTV | kullanıcı yaşam boyu değer | Faz 2 premium ile anlamlı |
| CPI / CPA | yükleme / eylem başı maliyet | reklam optimizasyon hedefi |
| ROAS | gelir / reklam harcaması | Faz 2+ |
| D1/D7/D30 | 1/7/30. gün geri dönen % | ürün sağlığı sinyali |
| Aktivasyon | onboarding tamamlama + ilk log | early value |
| Referral oranı | paylaşım/davet başına yeni kullanıcı | haftalık kart döngüsü |

## Sağlık eşikleri (kaba referans)

- D1 > %30, D7 > %15 iyi sinyal (kategori değişir).
- CAC < LTV (Faz 2 öncesi proxy: CAC < premium fiyat beklentisi).
- Reklamı ölçeklemeden önce organik retention otursun.

## Analist checklist

- [ ] Baştaki hedef metrik neydi, tuttu mu?
- [ ] CAC kanal bazında sürdürülebilir mi?
- [ ] Hangi kanal/kreatif kazandı, hangisi yaktı?
- [ ] Aktivasyon & retention hareket etti mi (yoksa sadece vanity mi)?
- [ ] Sonraki iterasyon için tek net değişiklik ne?

## Uyarı

Beğeni/görüntülenme tek başına başarı değil. Her kampanyayı edinim/aktivasyon/retention'a bağla.

## A/B test tasarımı (hafif)

- **Hipotez:** "X yaparsak Y metriği artar." (ör. "hook A vs hook B → CTR")
- **Tek değişken:** aynı anda tek şey değiştir (hook / görsel / CTA).
- **Örneklem & süre:** anlamlı fark için yeterli gösterim/süre bekle; erken karar verme.
- **Anlamlılık:** küçük örneklemde %2 fark gürültüdür — net ve tekrarlanabilir fark ara.
- **Karar:** kazananı ölçekle, kaybedeni durdur, belirsizse tekrar test et.

Not: ağır istatistik (bootstrap CI, Mann-Whitney U) gerekiyorsa harici A/B motoru (ör. büyüme deneyi plugin'leri) referans alınabilir; MVP'de bu hafif çerçeve yeterli.

## Social Fit'e özel metrikler

- **Viral katsayı (K-factor):** kullanıcı başına getirdiği yeni kullanıcı = (davet/paylaşım oranı) × (davet başına dönüşüm). K > 1 = organik viral büyüme. Haftalık paylaşım kartı bunun ana kaldıracı.
- **Paylaşım kartı paylaşım oranı:** kartı gören / story'e atan %. Viral döngünün sağlık metriği.
- **Content ROI:** içerik başına getirilen edinim/aktivasyon — hangi format işe yarıyor.
- **Churn sinyali:** streak kıran + 7 gün dönmeyen kullanıcı oranı (retention'ın tersi).
