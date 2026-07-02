# Feature Handoff: <feature-name>

**Slug:** `<feature-slug>`
**Açıldı:** YYYY-MM-DD
**Owner (supervisor):** Bora

## Status

| Bölüm | Durum |
|---|---|
| Spec | pending / in-progress / done / blocked |
| UI | pending / in-progress / done / blocked |
| API | pending / in-progress / done / blocked |
| QA | pending / passed / failed / blocked |

## Summary

Bir-iki cümle feature özeti. Doldur.

## User Request

```
Kullanıcının orijinal Türkçe isteği — değiştirme, kopyala yapıştır.
```

---

## Spec
*Sahip: `feature-spec`*

### User Story

Bir <kullanıcı tipi> olarak,
<şunu> yapmak istiyorum,
çünkü <şu fayda>.

### Acceptance Criteria

- [ ] Given ..., When ..., Then ...
- [ ] Given ..., When ..., Then ...
- [ ] Given ..., When ..., Then ...

### Edge Cases

- Boş state:
- Offline:
- Yetkisiz:
- Sınır değer:

### Affected

- **Screens:** `mobile/src/screens/...`
- **Components:** `mobile/src/components/sf/...`
- **Backend routes:** `backend/src/routes/...`
- **Prisma models:** ...

### Out of Scope

- ...

---

## UI Work
*Sahip: `ui-designer`*

### UI Status

pending / in-progress / done / blocked

### UI Decisions

- ...

### Changed UI Files

- `mobile/src/screens/.../X.js` — yeni
- `mobile/src/components/sf/Y.js` — düzenlendi

### Needed From Backend

- **Endpoint:** `METHOD /api/...`
- **Request:** `{ ... }`
- **Response:** `{ ... }`
- **Auth:** required / public

---

## API / Backend Work
*Sahip: `backend-ui-bridge`*

### API Status

pending / in-progress / done / blocked

### API Decisions

- ...

### Backend Changes

- `backend/src/routes/...` — yeni route
- `backend/prisma/schema.prisma` — model değişikliği (migration adı: `<açıklama>`)

### Mobile API Client Changes

- `mobile/src/screens/.../X.js` — yeni `api.get(...)` çağrısı

### API Contract

#### Endpoint

`METHOD /api/example`

#### Request

```json
{
  "example": "value"
}
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {}
}
```

#### Error Cases

- `400` — validation hatası mesajı
- `401` — auth eksik / geçersiz
- `404` — kaynak bulunamadı
- `500` — sunucu hatası

---

## State / Data Flow
*Sahip: `backend-ui-bridge`*

- **Loading:** ...
- **Error:** ...
- **Empty:** ...
- **Cache / refresh:** pull-to-refresh / focus refetch / polling / yok
- **Optimistic update:** yes / no — sebep:
- **Store:** zustand store mı, useState mi (ve neden)

---

## QA Review
*Sahip: `qa-reviewer`*

### QA Status

pending / passed / failed / blocked

### Checks

- [ ] Acceptance criteria met
- [ ] UI uses design tokens (no hardcoded colors)
- [ ] Loading state exists
- [ ] Error state exists
- [ ] Empty state exists
- [ ] API contract matches backend
- [ ] Auth middleware correct
- [ ] Navigation works
- [ ] Imports/exports valid
- [ ] Build/lint checked

### Issues Found

- [Blocker] ...
- [High] ...
- [Low] ...

### Required Fixes

- ...

### Final Decision

`PASS` / `NEEDS-FIX` / `BLOCKED`

---

## Changed Files

- `mobile/src/screens/.../X.js`
- `mobile/src/components/sf/Y.js`
- `backend/src/routes/.../z.js`
- `backend/prisma/schema.prisma`

---

## Decisions Log

- ...

---

## Open Questions

- @user: ...
- @feature-spec: ...

---

## Handoff Messages
*Append-only — agent'lar üst üste yazar, silmez.*

### Messages

- YYYY-MM-DD HH:MM `@ui-designer`: ...
- YYYY-MM-DD HH:MM `@backend-ui-bridge`: ...
- YYYY-MM-DD HH:MM `@qa-reviewer`: ...
