---
name: mkt-referral-viral
description: Referral ve viral loop playbook'u. Davet mekanizması, paylaşım kartı döngüsü, ödül tasarımı, attribution ve fraud guardrail standartlarını tanımlar.
---

# Referral & Viral Playbook

## Amaç

Paid/organic edinimi destekleyen ölçülebilir bir referral motoru kurmak.

## Temel formül

- **K-factor = invite rate x invite conversion**
- K > 1 sürdürülebilir viral büyüme sinyalidir.
- K < 1 durumunda loop optimize edilir, ölçekleme kör yapılmaz.

## Loop tasarımı

1. **Tetikleyici an** belirle (haftalık kart, streak milestone, challenge kazanımı).
2. **Paylaşılabilir asset** üret (story uyumlu, okunaklı, watermark'lı).
3. **Davet CTA'sı** ekle (tek link/kod, net ödül vaadi).
4. **Davet sonrası first-value** adımını düşür (arkadaşın ilk log'u hızlı tamamlansın).
5. **Ödülü şartlı ver** (invite install + ilk anlamlı aksiyon).

## Ödül tasarımı

| Model | Ne zaman kullanılır | Not |
|---|---|---|
| Tek taraflı ödül | erken test | abuse riski daha yüksek |
| Çift taraflı ödül | ana model | kalite + adalet dengesi |
| Şartlı ödül | önerilen | "install + first log" sonrası tetiklenir |

## Attribution standardı

- Her referral kaynağı için ayrı link/kod kullan.
- UTM + promo code birlikte çalışsın.
- Campaign handoff'a şu alanları yaz:
  - referral source
  - invite sent
  - invite accepted
  - first action completed

## Fraud guardrails

- Aynı cihazdan tekrar eden self-invite'ı ödüllendirme.
- Çok kısa sürede şüpheli toplu daveti "review"e düşür.
- Ödül dağıtımından önce minimum kalite aksiyonu doğrula.

## Social Fit kaldıraçları

- Haftalık paylaşım kartı referral'ın birincil motoru.
- Grup/challenge daveti, düz "indir" CTA'sından daha iyi dönüşebilir.
- Diyetisyen/creator collab içeriklerinde referral link zorunlu tut.

## Çıktı formatı

```
Loop tetikleyicisi:
Ödül modeli:
Referral CTA:
Tracking plan (UTM + kod):
Fraud guardrail:
Primary metric (K-factor veya invite->first-action):
```
