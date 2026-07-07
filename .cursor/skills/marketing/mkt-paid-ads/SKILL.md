---
name: mkt-paid-ads
description: Ücretli reklam playbook — Meta Ads, Google App Campaigns, Apple Search Ads kampanya yapısı, kreatif spec'leri, bütçe/teklif stratejisi ve UTM konvansiyonu. Reklam işinde yüklenir.
---

# Ücretli Reklam Playbook

## Hazırlık kontrolü (önce bunu geç)

- [ ] Store sayfası yayında (ASO tamam)
- [ ] Dönüşüm event'i kurulu (install / signup)
- [ ] Retention sinyali var (D7 makul)
Değilse: reklam erken → stratejiste geri dön.

## Kanallar

| Kanal | Ne zaman | Güçlü yanı |
|---|---|---|
| Meta Ads (IG/FB) | farkındalık + edinim | görsel/video, geniş TR kitle, ucuz test |
| Google App Campaigns | uygulama yüklemesi | Search+YouTube+Play otomatik |
| Apple Search Ads | yüksek niyet | store'da arayan kullanıcı, iyi CVR |

## Kampanya yapısı

`Kampanya (hedef) > Ad Set (hedefleme + bütçe) > Ad (kreatif)`. Her ad set tek net kitle. 3-5 kreatif varyant, farklı açı (acı / sosyal kanıt / özellik / mizah).

## Kreatif spec

- Reels/Story: 9:16, ilk 3 sn hook, ses-kapalı için ekran metni.
- Feed: 1:1 veya 4:5.
- Her kreatif: hook + görsel notu + başlık + tek CTA.

## Bütçe / teklif

- Küçük başla (test bütçesi), kazanan kreatif/kitleyi ölçekle.
- Hedef metrik: CPI / CPA / ROAS — vanity değil.
- Öğrenme fazını bozacak sık değişiklik yapma.

## UTM konvansiyonu

`utm_source=meta&utm_medium=cpc&utm_campaign=<kampanya>&utm_content=<kreatif>`. Tutarlı isimlendir; analyst kanal kıyaslamasını buradan yapar.

## Sınır

Plan üret; reklam hesabında harcama/işlem yapma. Sağlık verisiyle hedefleme önerme (KVKK).

## Reklam Denetimi (Ads Audit) + Sağlık Skoru

Mevcut bir reklam hesabı varsa, kampanya kurmadan önce denetle. 6 boyut, her biri 0-100'e katkı:

| Boyut | Ne bakılır | Ağırlık |
|---|---|---|
| Hesap yapısı | kampanya/ad set hiyerarşisi, isimlendirme, çakışan kitle | %20 |
| Hedefleme | kitle netliği, gereksiz geniş/dar, dışlamalar | %20 |
| Kreatif | hook gücü, varyant sayısı, format uyumu, yorgunluk | %20 |
| Tracking | dönüşüm event'i, UTM tutarlılığı, pixel/SDK | %15 |
| Bütçe & teklif | harcama dağılımı, öğrenme fazı, kazanana kayma | %15 |
| Uyum (compliance) | KVKK + Apple/Google/Meta reklam politikası | %10 |

**Sağlık Skoru (0-100):** boyut skorlarının ağırlıklı ortalaması. Çıktı = skor + **önceliklendirilmiş aksiyon planı** (en çok bütçe yakan sorun en üstte).

### Uyum (compliance) alt-kontrolü — ZORUNLU

- [ ] Sağlık durumu / özel nitelikli veriyle hedefleme YOK (KVKK)
- [ ] "Tedavi/teşhis/garantili kilo" iddiası YOK
- [ ] Before/after görselde platform politikası (Meta kişisel özellik hedefleme) ihlali YOK
- [ ] Landing page ile reklam vaadi tutarlı (aldatıcı reklam yok)

Not: Bu denetim yapısı `AgriciDaniel/claude-ads` gibi hazır plugin'lerle de otomatikleştirilebilir; istenirse referans olarak kurulabilir. Burada self-contained tutuldu.
