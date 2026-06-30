---
name: ui-design-system
description: Social Fit mobile design token'larını (renk, font, radius, spacing, shadow) okuma ve uygulama kuralları. React Native / Expo ekranında stil yazılırken kullan.
---

# Social Fit Design System Kullanımı

Tüm token'lar `mobile/src/theme/socialFitTheme.js` içinde. Hardcode değer YASAK.

## Import

```js
import { colors, spacing, radius, font, shadow } from '../../theme/socialFitTheme';
// Yol derinliğine göre ../../ veya ../../../ olur — relative path doğru olsun.
```

## Renk paleti — ne zaman ne

| Token | Kullanım |
|---|---|
| `colors.primary` (#157A52) | Ana CTA, aktif tab, seçili durum |
| `colors.primaryDark` / `primaryTint` | Gradient uçları, hover/pressed state |
| `colors.mint` / `mintSoft` | Yüzey vurgu, seçili satır arka planı |
| `colors.coral` | Streak, secondary CTA, vurgu |
| `colors.amber` | Yıldız puanı, ödül göstergesi |
| `colors.blue` | Blog/kategori etiketi |
| `colors.ink` | Büyük başlık metni |
| `colors.text` | Gövde metni |
| `colors.muted` / `faint` | İkincil metin, ikon |
| `colors.bg` | Ekran arka planı |
| `colors.surface` | Kart arka planı |
| `colors.border` / `divider` | İnce çizgi |
| `colors.like` | Beğeni kırmızısı |

## Font

```js
// Başlıklar
fontFamily: font.display          // Outfit_700Bold
fontFamily: font.displayBold      // Outfit_800ExtraBold (sayı/rozet)

// Gövde / UI
fontFamily: font.body             // PlusJakartaSans_500Medium
fontFamily: font.bodyBold         // PlusJakartaSans_700Bold
```

App.js içinde `expo-font` ile yüklü olmalı — yeni font ailesi eklemeden önce App.js'i kontrol et.

## Radius

`radius.chip` (13) | `radius.field` (16) | `radius.pill` (18) | `radius.card` (24) | `radius.sheet` (28) | `radius.full` (999).

## Spacing

`spacing.xs` (4) | `sm` (8) | `md` (12) | `lg` (16) | `xl` (20) | `xxl` (24).

Sayı literal'i (`padding: 13`) kullanma — en yakın token'a yuvarla.

## Shadow

```js
// Kart (varsayılan)
...shadow.card

// Hafif (ikon kutusu, küçük chip)
...shadow.soft

// CTA butonu (yeşil renkli gölge)
...shadow.cta
```

Android için `elevation` token içinde zaten dahil.

## Yasaklı pattern'ler

- `style={{ backgroundColor: '#157A52' }}` → `colors.primary`
- `borderRadius: 24` → `radius.card`
- `fontFamily: 'Outfit-Bold'` (string) → `font.display`
- `padding: 16` → `spacing.lg`
- `shadowColor: '#000'` → `shadow.card`/`shadow.soft`

## Mevcut atomic component'ler

Yeni stil yazmadan önce kontrol et: `mobile/src/components/sf/` ve `mobile/src/components/onboarding/`. Reuse > yeniden yaz.
