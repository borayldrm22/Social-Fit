---
name: mkt-content-ops
description: İçerik üretim operasyonu playbook'u. Brief -> üretim -> KVKK/brand check -> yayın -> repurpose hattını standartlaştırır.
---

# Content Operations Playbook

## Amaç

İçeriği tek seferlik üretim yerine tekrar eden bir üretim hattına dönüştürmek.

## Pipeline

1. **Brief** (hedef, kanal, CTA, metric)
2. **Script/Copy** (hook + body + close)
3. **QA** (brand voice + KVKK + ifşa + UTM)
4. **Production** (video/görsel/caption)
5. **Publishing** (zamanlama + platform check)
6. **Repurpose** (aynı içeriği farklı formata kır)
7. **Review** (performans + sonraki iterasyon)

## İçerik QA checklist

- [ ] İlk 3 saniye hook net mi?
- [ ] Tek CTA var mı?
- [ ] KVKK güvenli mi? ("tedavi/teşhis" yok)
- [ ] Influencer/collab ise ifşa var mı? (#işbirliği/#reklam)
- [ ] UTM/link doğru mu?
- [ ] Marka tonu `mkt-brand-voice` ile uyumlu mu?

## Platform teknik notları

- TikTok/Reels: 9:16, güvenli metin alanı, kısa ilk açılış.
- Kısa video için bir ana scriptten 3-5 hook varyantı üret.
- Kazanan kreatifler için 7-14 gün içinde refresh planla.

## Repurpose matrisi (örnek)

| Kaynak içerik | Türetilen asset |
|---|---|
| 1 Reels/TikTok script | 3 hook varyantı + 1 carousel + 1 story kartı |
| 1 influencer collab | 1 short clip + 1 testimonial post + 1 blog snippet |
| 1 ASO mesajı | screenshot başlığı + landing hero + ad headline |

## Haftalık içerik sprinti

- Pazartesi: brief + backlog
- Salı: script/copy
- Çarşamba: production + QA
- Perşembe-Cuma: publish + initial read
- Pazar: weekly retro + repurpose plan

## Çıktı formatı

```
Kanal:
Hedef:
İçerik paketi:
QA sonucu:
Yayın takvimi:
Repurpose planı:
Primary metric:
```
