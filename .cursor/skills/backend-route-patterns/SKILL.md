---
name: backend-route-patterns
description: Social Fit backend (Express + Prisma + express-validator) için yeni route eklerken uygulanacak konvansiyonlar — middleware sırası, auth, validation, response shape, error handling, upload.
---

# Backend Route Pattern'leri

Stack: Express 4, Prisma 5, express-validator 7, multer (upload), bcryptjs (auth), jsonwebtoken (JWT).

## Dosya iskeleti

```js
const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

router.use(authMiddleware); // tüm route'lar için auth (veya per-route uygula)

// GET /api/<domain>
router.get('/', async (req, res) => {
  try {
    const items = await prisma.<model>.findMany({ where: { userId: req.user.id } });
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;
```

`backend/src/index.js`'te mount et:
```js
app.use('/api/<domain>', require('./routes/<domain>'));
```

## Auth middleware

`authMiddleware` JWT'yi parse edip `req.user`'a koyuyor. Public endpoint (login/register) için route bazlı kullan, `router.use` yapma.

```js
router.post('/login', async (req, res) => { ... });  // public
router.get('/me', authMiddleware, async (req, res) => { ... });  // private
```

## Validation

```js
router.post(
  '/',
  authMiddleware,
  [
    body('title').isString().trim().notEmpty(),
    body('calories').isInt({ min: 0, max: 10000 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    // ...
  }
);
```

İlk hatayı string olarak dön — mobile tarafı `data.error` bekliyor (bkz. `apiRequest()`).

## Response shape

- Liste: array dön (`res.json(items)`)
- Tek obje: obje dön (`res.json(item)`)
- Mutation: güncellenmiş kaydı veya `{ ok: true }` dön
- Tarihler: ISO string (Prisma default)
- Snake_case yok — Prisma'nın ürettiği camelCase ile devam

## Hata kodları

| Kod | Ne zaman |
|---|---|
| 400 | Validation hatası, malformed body |
| 401 | Token yok / geçersiz (middleware atar) |
| 403 | Token geçerli ama bu kaynağa yetkin yok |
| 404 | Kaynak bulunamadı |
| 409 | Çakışma (örn. unique constraint) |
| 500 | Beklenmeyen — `console.error(e)` ekle |

## Upload (multer)

```js
const multer = require('multer');
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(UPLOAD_DIR, '<subdir>')),
  filename: (req, file, cb) => cb(null, `<prefix>-${uuidv4()}${path.extname(file.originalname) || '.jpg'}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', upload.single('image'), [...validators...], handler);
```

Mobile tarafı `formData.append('image', { uri, name, type })` ile gönderir — alan adı `image` eşleşmeli.

## Prisma

```js
// Tek kayıt
const u = await prisma.user.findUnique({ where: { id } });
// Filtreli liste
const ps = await prisma.post.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 });
// İlişkili
const p = await prisma.post.findUnique({ where: { id }, include: { author: true, comments: true } });
// Yeni kayıt
const created = await prisma.foodLog.create({ data: { ...req.body, userId: req.user.id } });
```

Yeni model/alan eklediysen `npx prisma db push` çalıştır (DB'ye erişimli ortamdan, `DIRECT_URL`'de `sslmode=require`). **`migrate dev` KULLANMA** — hosted Supabase Postgres'te destructive reset riski.

## Yan etki servisleri

Bazı route'lar `services/starService.js` (`awardPoints`) veya `routes/streaks.js` (`recordStreak`) gibi yan etkileri çağırıyor. Yeni domain'in puanlama/streak etkisi varsa servis fonksiyonunu çağırmayı unutma.

## Yasaklar

- Prisma client'ı global instance olarak dosya başında oluştur, handler içinde değil.
- Şifreyi düz dön — `password` alanını `select`'ten çıkar veya `omit` ile gizle.
- Hardcoded localhost URL'i — `process.env.BASE_URL` kullan.
- Sync fs çağrısı kritik path'te — async tercih.
