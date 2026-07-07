---
name: mkt-lifecycle-retention
description: D1/D3/D7 odaklı lifecycle-retention playbook'u. Aktivasyon, geri kazanım, streak koruma ve churn azaltma mesaj akışlarını standartlaştırır.
---

# Lifecycle & Retention Playbook

## Amaç

Kampanya ile gelen kullanıcıyı ilk 30 günde elde tutmak. Acquisition başarısı, retention ile doğrulanır.

## North-star bağlantısı

- Temel sinyal: **streak devam eden haftalık aktif kullanıcı**
- Erken sinyal: **D1 / D7 retention**
- Davranış sinyali: **first log completion**, **share-card posted**

## Lifecycle akışı (öneri)

| Zaman | Amaç | Örnek mesaj tipi | Ana CTA |
|---|---|---|---|
| D0 (install) | İlk değer anı | hızlı onboarding nudge | ilk logu tamamla |
| D1 | Aktivasyon pekiştirme | mikro başarı kutlaması | streak'i 2'ye çıkar |
| D3 | Drop-off önleme | "bırakma eşiği" hatırlatma | bugünün kaydını gir |
| D7 | Haftalık geri bakış | haftalık kart + grup etkisi | kartı paylaş / arkadaş davet et |
| D14 | Alışkanlık derinleştirme | kişisel öneri akışı | hedef güncelle |
| D30 | Devam/geri kazanım | "nereden nereye" özeti | yeni 7 günlük challenge |

## Trigger bazlı segmentler

| Trigger | Segment | Aksiyon |
|---|---|---|
| onboarding_complete yok | yarım kalan onboarding | kısa "devam et" akışı |
| first_food_log yok | aktivasyon eksik | friction azaltan mikro görev |
| 48 saat inaktif | at-risk | tekrar giriş mesajı + düşük bariyer CTA |
| streak kırıldı | churn riski | yargılamayan "yeniden başla" mesajı |
| share-card yaptı | promoter | referral daveti + ödül |

## Mesaj yazım kuralları

- Suçlayıcı değil, destekleyici ton.
- Tek mesaj = tek CTA.
- KVKK güvenli dil: "öneri/motivasyon" kullan; "tedavi/teşhis" yok.
- Kısa ve aksiyon odaklı ol (özellikle push).

## Ölçüm çerçevesi

- Her lifecycle akışı için bir primary metric seç:
  - reactivation rate
  - D7 retention uplift
  - streak recovery rate
- Guardrail metrik:
  - notification opt-out
  - uninstall spike
  - churn sinyali

## Haftalık operasyon ritmi

1. D1/D7 cohort'u oku.
2. En zayıf lifecycle adımını seç.
3. Tek değişkenli mesaj deneyi kur (başlık veya CTA).
4. Analyst ile review et, kazananı standart akışa al.

## Çıktı formatı

```
Hedef segment:
Trigger:
Mesaj akışı (D0/D1/D3/D7):
Primary metric:
Guardrail metric:
Review tarihi:
```
