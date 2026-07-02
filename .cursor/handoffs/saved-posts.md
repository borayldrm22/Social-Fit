# Feature Handoff: Kaydedilen Postlar

**Slug:** `saved-posts`
**Açıldı:** 2026-07-02
**Owner (supervisor):** Bora

## Status

| Bölüm | Durum |
|---|---|
| Spec | done |
| UI | done |
| API | done |
| QA | pending |

## Summary

Akıştaki postlar bookmark butonuyla kaydedilebilir. Kaydedilen postlar `Daha Fazla > Kaydettiklerim` ekranından listelenir ve aynı ekranda kayıttan çıkarılabilir.

## User Request

```
Akışta postları kaydetme özelliği getir. kaydedilen postlar daha fazlası kısmından kaydettiklerim adı altında görülebilmeli
```

## Spec

### User Story

Bir Social Fit kullanıcısı olarak,
beğendiğim gönderileri sonradan bakmak için kaydetmek istiyorum,
çünkü motivasyon veren öğün ve antrenman paylaşımlarına kolayca geri dönebilmeliyim.

### Acceptance Criteria

- [x] Given kullanıcı feed/discover ekranındayken, When bookmark ikonuna basarsa, Then post kullanıcı için kaydedilir ve ikon dolu görünür.
- [x] Given post önceden kaydedilmişken, When bookmark ikonuna tekrar basarsa, Then kayıt kaldırılır ve ikon boş görünür.
- [x] Given kullanıcı Daha Fazla menüsündeyken, When Kaydettiklerim'e girerse, Then kaydettiği postları yeni listede görür.
- [x] Given kaydedilen post yoksa, When Kaydettiklerim açılırsa, Then boş state gösterilir.

### Edge Cases

- Boş state: Kaydedilen post yoksa açıklamalı empty state.
- Offline: API hatasında kullanıcı dostu error state ve tekrar dene.
- Yetkisiz: Tüm endpointler `authMiddleware` arkasında.
- Çift kaydetme: Unique constraint ve idempotent response.

### Affected

- **Screens:** `mobile/src/screens/main/FeedScreen.js`, `mobile/src/screens/main/MoreScreen.js`, `mobile/src/screens/main/SavedPostsScreen.js`
- **Components:** Mevcut `Avatar`, `StarPill`, `Placeholder` kullanıldı.
- **Backend routes:** `backend/src/routes/posts.js`
- **Prisma models:** `SavedPost`

### Out of Scope

- Blog/recipe kaydetme.
- Kaydedilenler için arama/filtre.
- Bildirim veya yıldız puanı etkisi.

## API / Backend Work

### API Status

done

### API Decisions

- Save ilişkisi ayrı join table (`saved_posts`) olarak tutuldu.
- Feed/discover response shape'i bozulmadan `saved: boolean` alanı eklendi.
- Kaydetme aksiyonu yıldız puanı üretmez; sadece kişisel koleksiyon davranışı.

### API Contract

#### Endpoints

`GET /api/posts/saved`

Response:

```json
{
  "posts": [
    {
      "id": "post-id",
      "user": { "id": "user-id", "profile": {} },
      "_count": { "likes": 0, "comments": 0 },
      "liked": false,
      "saved": true
    }
  ]
}
```

`POST /api/posts/:id/save`

Response:

```json
{ "saved": true }
```

`DELETE /api/posts/:id/save`

Response:

```json
{ "saved": false }
```

#### Error Cases

- `401` — auth eksik / geçersiz
- `404` — kaydedilecek gönderi bulunamadı
- `500` — beklenmeyen sunucu hatası

## State / Data Flow

- **Loading:** `SavedPostsScreen` ilk açılışta spinner gösterir.
- **Error:** Kullanıcı dostu hata metni ve tekrar dene butonu.
- **Empty:** "Henüz kayıt yok" empty state.
- **Cache / refresh:** focus refetch + pull-to-refresh.
- **Optimistic update:** Feed bookmark toggle ve saved list unsave için var; API hatasında rollback.
- **Store:** `useState`; veri yalnızca ilgili ekranlarda lokal kullanılıyor.

## QA Review

### QA Status

pending

### Checks

- [x] Acceptance criteria met
- [x] Loading state exists
- [x] Error state exists
- [x] Empty state exists
- [x] API contract matches backend
- [x] Auth middleware correct
- [x] Navigation works
- [x] Build/lint checked

## Changed Files

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260702130000_add_saved_posts/migration.sql`
- `backend/src/routes/posts.js`
- `mobile/src/screens/main/FeedScreen.js`
- `mobile/src/screens/main/MoreScreen.js`
- `mobile/src/screens/main/SavedPostsScreen.js`
- `mobile/src/navigation/MainTabs.js`

## Decisions Log

- 2026-07-02: Kaydedilenler için ayrı endpoint ve feed/discover'da `saved` boolean kullanılmasına karar verildi.

## Open Questions

- Yok.

## Handoff Messages

### Messages

- 2026-07-02 13:00 `@backend-ui-bridge`: API contract ve state flow supervisor tarafından uygulandı; QA bekliyor.
