---
name: api-contract-check
description: Social Fit mobile API çağrılarını backend Express route'larıyla karşılaştırma ve eşleşmeyen path/method/body/response shape sorunlarını tespit etme adımları.
---

# API Kontrat Kontrolü

Mobile ↔ Backend arasındaki sözleşmenin doğruluğunu denetlemek için adım adım.

## 1. Mobile tarafta tüm çağrıları bul

```bash
rg -n "api\.(get|post|patch|delete|patchForm)\(" mobile/src --type js
```

Her satırdan üç şey çıkar: **method**, **path**, **body** (varsa).

## 2. Backend tarafta mount edilen route'ları bul

```bash
rg -n "router\.(get|post|patch|delete|put)\(" backend/src/routes --type js
rg -n "app\.use\(" backend/src/index.js
```

`backend/src/index.js` route'ları nasıl mount ediyor (örn. `app.use('/api/foodlog', foodlogRouter)`) — base path'i not et.

## 3. Eşleştirme tablosu

| Mobile call | Method | Tam path | Backend dosya:satır | Eşleşme |
|---|---|---|---|---|
| `api.post('/foodlog', body)` | POST | `/api/foodlog` | `routes/foodlog.js:42` | ✅ |

Eşleşmeyen her satır için sebep yaz:
- **Path yok** → backend'e ekle, hangi route dosyası uygun karar ver
- **Method farklı** → mobile mı backend mi haklı, ürün mantığına bak
- **Auth uyumsuz** → `authMiddleware` zincirinde var mı (`router.use(authMiddleware)` ya da per-route)

## 4. Request body & response shape

Mobile'da `body` JSON'u ne gönderiyor, backend `req.body` üzerinden hangi alanları kullanıyor — fark varsa not et.

Backend response için `res.json({ ... })`'in shape'i mobile'da nasıl tüketiliyor — alan adı farkı (`createdAt` vs `created_at` gibi) sessiz hatalara yol açar.

## 5. express-validator

Backend route'larda `body('...').isString()` gibi validator chain'leri var. Mobile validasyonu burayla çakışıyor mu? Hata mesajları kullanıcı-dostu mu?

## 6. Auth header

`apiRequest()` `token` varsa `Authorization: Bearer <token>` ekliyor. Public endpoint olması gereken yere `authMiddleware` koyma (örn. login/register). Backend'de hangi route auth gerektiriyor — `routes/auth.js` ve `middleware/auth.js`'i bir kez oku.

## 7. Multipart upload

`uploadFormData()` Content-Type set etmiyor (fetch boundary'i kendi koysun diye). Backend tarafta multer kullanılıyor mu (`upload.single('image')`) kontrol et — alan adı eşleşmesi şart (örn. `formData.append('image', ...)`).

## Çıktı

İş bitince üç bölüm:
1. **Eşleşmeler tablosu** (yukarıdaki gibi)
2. **Düzeltmeler** — uygulanan değişiklikler dosya:satır listesi
3. **Hala riskli** — değişmedi ama dikkat gerekiyor (örn. response shape gri alanı)
