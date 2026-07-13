# Feature Spec: Tarifler (Recipes)

**Durum:** Onaylandı · **Kaynak veri:** `docs/recipes/*.pdf` (7 tarif) · **Plan:** `~/.claude/plans/repo-daki-agentlar-oku-compiled-candy.md`

## Özet
Mock `RecipesScreen` + `RecipeDetailScreen`'i yeni `Recipe` Prisma modeli ve `GET /api/recipes` ile gerçek veriye bağlarız. 7 tarif gerçek makro + malzeme + adım + Fit Not + gerçek JPEG fotoğrafla sunulur; sahte yazar/puan kaldırılır; kategori chip filtresi çalışır.

## User Story
Bir Social Fit kullanıcısı olarak, Beslenme sekmesinde gerçek tariflere (malzeme + makro) ulaşmak istiyorum, çünkü sağlıklı beslenme planı için bunlara ihtiyacım var.

## Acceptance Criteria
1. **Given** çevrimiçi, **When** Beslenme → Tarifler açılır, **Then** API'den 7 tarif gerçek fotoğraflarıyla listelenir; "Avokadolu Protein Kasesi"/"Ayşe Kaya"/"4.9" mock metinleri görünmez.
2. **Given** liste yüklü, **When** chip seçilir, **Then** `Tümü`→7, `Kahvaltı`→`category==='Kahvaltı'` (4), `Atıştırmalık`→(3), `Yüksek Protein`→`tags` içerir (6).
3. **Given** bir tarife tıklanır, **When** detay açılır, **Then** başlık/malzeme/adım/makro (süre·kcal·protein·porsiyon)/kapak/Fit Not gerçek `route.params.recipe`'ten dolar; checkbox state `recipe.ingredients.length` ile başlar.
4. **Given** görsel yüklenemez, **When** `Image onError`, **Then** `Placeholder` fallback devreye girer; ekran çökmez.
5. **Given** `GET /api/recipes` 200, **Then** `ingredients`/`steps`/`tags` zaten dizi/obje gelir (backend JSON.parse eder); mobile parse etmez.

## API Sözleşmesi
`GET /api/recipes` — **public** (auth yok), array döner. Alanlar:
`id, slug, title, category, tags[], timeMinutes, calories, protein, carbs, fat, servings, difficulty, imageUrl, ingredients[{name,amount}], steps[], fitNote, isFeatured, createdAt`.
`imageUrl` = `${BASE_URL}/uploads/recipes/<slug>.jpg` (mutlak). `GET /:id` MVP'de yok (liste tam kayıt döner; detay `route.params.recipe` kullanır).

## Prisma
> ✅ **Bu feature yayında** (`backend/src/routes/recipes.js` + `RecipesScreen`/`RecipeDetailScreen`). Aşağısı orijinal spec — referans.

Yeni `Recipe` modeli (Postgres; JSON-string deseni — `Post.tags` gibi: `tags`/`ingredients`/`steps` String). Şema `db push` ile uygulandı. Veri migrasyonu yok (seed ile dolar).

## Mobile
- `RecipesScreen.js`: `/recipes`→`/api/recipes`; `FEATURED/GRID/CATS` mock kaldır; `isFeatured` → öne çıkan kart; `Placeholder`→`<Image>` + onError; chip filtre; loading/empty/error state. Kategoriler `['Tümü','Kahvaltı','Yüksek Protein','Atıştırmalık']` ("Vegan" yok).
- `RecipeDetailScreen.js`: `STATS/INGREDIENTS/STEPS` mock kaldır; `route.params.recipe`'ten doldur; kapak `<Image>`; rozetler `recipe.tags`; yazar+puan bloğu → **Fit Not kartı** + "Social Fit Mutfak"; checkbox dinamik uzunluk.
- Navigasyon değişmez (`NutritionStack` zaten kayıtlı). Token-only stil.

## Edge Case'ler
Boş/filtre-boş liste → empty state · görsel 404 → `onError` Placeholder · offline → "yüklenemedi + Tekrar Dene" · `recipe` null → goBack guard (mevcut) · `isFeatured` yoksa featured kart koşullu · `imageUrl` null kontrolü.

## Out of Scope
`/:id` endpoint · tarif arama (search bar dekoratif) · favori persist (bookmark dekoratif) · tarif oluşturma · backend-side filtre · starService/streak entegrasyonu · feed'e paylaşma.

## Test
1. `npx prisma db push && npm run db:seed` → "recipes seeded".
2. `curl -s localhost:4000/api/recipes | jq length` → 7; `.[0].ingredients|type` → "array".
3. `curl -sI localhost:4000/uploads/recipes/protein-pancake.jpg` → 200 image/jpeg.
4. Simulator: Beslenme → Tarifler → 7 tarif + filtre + detay (gerçek malzeme/adım/makro/Fit Not). Mock metin yok.
