---
name: mkt-experiments
description: Growth deney işletim sistemi. Hipotez backlog'u, ICE önceliklendirme, tek değişken kuralı, ölçüm ve karar ritmini standartlaştırır.
---

# Experiment Operating System

## Amaç

"Ne deneyelim?" sorusunu ad-hoc yaklaşımdan çıkarıp haftalık, ölçülebilir bir sisteme bağlamak.

## Deney backlog şablonu

| ID | Hipotez | Tek değişken | Kanal | Metric | ICE | Durum |
|---|---|---|---|---|---|---|
| EXP-01 | ... | ... | ... | ... | ... | planned/running/done |

## Hipotez kuralı

- Format: **"X yaparsak, Y metriği Z kadar değişir."**
- Her deneyde tek değişken:
  - hook
  - CTA
  - görsel
  - hedefleme
  - store asset

## Kanal bazlı deney örnekleri

- TikTok/Meta: hook family A vs B
- Influencer: micro vs nano creator tier
- ASO (Apple PPO): treatment A/B/C (max 3 varyant)
- Play Experiments: tek asset testi, en az 1 hafta

## Test hijyen kuralları

- Yeterli örneklem oluşmadan erken kazanan ilan etme.
- Test süresince aynı ad set veya listingte çoklu büyük değişiklik yapma.
- "Kazandı" demek için tekrarlanabilir fark ara.

## Karar çerçevesi

| Durum | Karar |
|---|---|
| Hedefi net geçti | scale |
| Yakın ama belirsiz | iterate |
| Sürekli düşük | stop/pivot |

## Haftalık ritim (öneri)

1. Pazartesi: backlog önceliklendirme (ICE).
2. Salı-Perşembe: deneyler live.
3. Cuma: analyst review + karar.
4. Sonraki sprint: sadece 1-2 kazananı ölçekle.

## Çıktı formatı

```
Deney ID:
Hipotez:
Tek değişken:
Primary metric + guardrail:
Minimum süre/örneklem:
Karar (scale/iterate/stop):
Sonraki adım:
```
