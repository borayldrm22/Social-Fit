---
name: feature-spec-writer
description: Social Fit feature spec'i yazmak için şablon ve doldurma rehberi. User story, acceptance criteria, mobile/backend etki, Prisma değişiklikleri, edge case'ler, test senaryoları, out-of-scope listesini içerir.
---

# Feature Spec Şablonu

Çıktı doğrudan bu şablonu doldurarak ver. 1-2 sayfayı geçmesin.

```markdown
# Feature: <Kısa, Etkin Başlık>

**Durum:** Draft
**Önerilen sıra:** <feature-spec → ui-designer → backend-ui-bridge> (gerekirse değiştir)

## Özet
<2 cümle. Ne yapıyoruz, neden.>

## User Story
Bir <kullanıcı tipi> olarak,
<şunu> yapmak istiyorum,
çünkü <şu fayda>.

## Acceptance Criteria
1. **Given** <başlangıç durumu>, **When** <eylem>, **Then** <beklenen sonuç>.
2. **Given** ..., **When** ..., **Then** ...
3. **Given** ..., **When** ..., **Then** ...

## Mobile Etki
- **Yeni ekran(lar):** `mobile/src/screens/.../<X>.js` — kısa açıklama
- **Değişen ekran(lar):** `mobile/src/screens/.../<Y>.js` — ne değişiyor
- **Navigasyon:** `<Navigator>.js`'e yeni route ekle / tab değişikliği
- **Yeni component(ler):** `mobile/src/components/sf/<Z>.js`
- **State:** zustand store değişikliği var mı, hangi store

## Backend Etki
- **Yeni endpoint(ler):**
  - `POST /api/<x>` — body, auth, dönüş
  - `GET /api/<x>/:id` — auth, dönüş shape
- **Değişen endpoint(ler):** breaking mi
- **Yan etki:** starService.awardPoints / streak / notification?

## Prisma Etki
- **Yeni model(ler):** ...
- **Değişen alan(lar):** ...
- **Migration adı:** `<açıklama>` (örn. `add_story_field_to_foodlog`)
- **Veri migrasyonu gerekli mi:** evet/hayır

## Edge Case'ler
- Boş state: <ne göster>
- Offline: <davranış>
- Yetkisiz erişim: <ne dön>
- Sınır değer: <ör. > 30 karakter, < 0 sayı>
- Race condition: <ör. eşzamanlı iki istek>

## Test Senaryoları
**Happy:** ...
**Error 1:** ... → beklenen hata mesajı
**Error 2:** ...
**Manuel test:** Hangi ekrana git, ne yap, ne gör.

## Out of Scope
- <Bu spec'in kapsamadığı yakın ihtimaller — scope creep önler>

## Tahmini Etki
- Mobile: ~X dosya
- Backend: ~Y dosya + Prisma migration
- Risk seviyesi: Düşük / Orta / Yüksek (sebep)

## Sıradaki Adım
1. `ui-designer`'a şu spec ile gönder: <bir cümle özet>
2. `backend-ui-bridge`'e şu spec ile gönder: <bir cümle özet>
3. Sıra mı paralel mi: <ve neden>
```

## Doldurma kuralları

- "TBD" yazma — bilmiyorsan user'a sor.
- Çok genel kalma — `mobile/src/screens/foodlog/FoodLogScreen.js` der gibi spesifik dosya yaz.
- Risk seviyesi gerekçeli olsun ("Orta — Prisma migration ve mevcut endpoint'in response shape'i değişiyor").
- Sıra önerirken paralelleştir — UI taslağı backend'i beklemek zorunda değil (mock data ile başlayabilir).
