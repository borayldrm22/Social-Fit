---
name: state-data-flow-patterns
description: Social Fit mobile uygulamasında API response → UI state akışını standartlaştıran pattern'ler. Loading, error, empty state, cache, optimistic update, pull-to-refresh, zustand store kullanımı.
---

# State & Data-Flow Pattern'leri

`backend-ui-bridge` agent'ı state/data-flow uyumundan da sorumlu. Bu skill standart pattern'leri tutar.

## Tek ekran data fetch (cancel guard'lı)

```jsx
const api = useApi();
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  let cancelled = false;
  setLoading(true);
  setError(null);
  api.get('/foodlog')
    .then((r) => { if (!cancelled) setData(r); })
    .catch((e) => { if (!cancelled) setError(e.message); })
    .finally(() => { if (!cancelled) setLoading(false); });
  return () => { cancelled = true; };
}, [api]);
```

**Kurallar:**
- `cancelled` flag şart. Ekran unmount olduğunda setState çağırma.
- `[api]` dependency. `[token]` ekleme.
- Reference: `OnboardingSocialStep`.

## Üç state render

```jsx
if (loading) return <Loading />;
if (error)   return <ErrorView message={error} onRetry={refetch} />;
if (!data || data.length === 0) return <EmptyState />;
return <Content data={data} />;
```

`Loading`, `ErrorView`, `EmptyState` component'lerini `components/sf/` altına atomic koy.

## Pull-to-refresh (liste ekranları)

```jsx
const [refreshing, setRefreshing] = useState(false);
const onRefresh = useCallback(async () => {
  setRefreshing(true);
  try { setData(await api.get('/foodlog')); }
  finally { setRefreshing(false); }
}, [api]);

<FlatList
  refreshing={refreshing}
  onRefresh={onRefresh}
  data={data}
  ...
/>
```

## Focus refetch (tab değiştirince yenile)

```jsx
import { useFocusEffect } from '@react-navigation/native';

useFocusEffect(useCallback(() => {
  let cancelled = false;
  api.get('/notifications').then((r) => !cancelled && setData(r));
  return () => { cancelled = true; };
}, [api]));
```

Sosyal feed, notification, leaderboard için tipik.

## Optimistic update (like, follow, hızlı feedback)

```jsx
const onLike = async (postId) => {
  setPosts((p) => p.map(x => x.id === postId ? { ...x, liked: true, likeCount: x.likeCount + 1 } : x));
  try {
    await api.post(`/posts/${postId}/like`);
  } catch (e) {
    // rollback
    setPosts((p) => p.map(x => x.id === postId ? { ...x, liked: false, likeCount: x.likeCount - 1 } : x));
    showToast('Beğeni başarısız');
  }
};
```

## Zustand store (cross-screen state)

Tek ekrana ait state → `useState`. Birden fazla ekran erişiyorsa → `mobile/src/store/`.

```js
// src/store/useFoodLogStore.js
import { create } from 'zustand';

export const useFoodLogStore = create((set) => ({
  entries: [],
  loading: false,
  error: null,
  fetch: async (api) => {
    set({ loading: true, error: null });
    try { set({ entries: await api.get('/foodlog') }); }
    catch (e) { set({ error: e.message }); }
    finally { set({ loading: false }); }
  },
}));
```

**Store mı useState mi?** Karar kuralı:
- 1 ekran kullanıyor → `useState`
- 2+ ekran aynı veriyi okuyor → store
- Cache + invalidation gerekiyor → store

## Form state

`react-hook-form` projemizde mevcut. Yeni form için onu kullan:

```jsx
import { useForm, Controller } from 'react-hook-form';

const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm();
const onSubmit = async (values) => { await api.post('/foo', values); };
```

`isSubmitting` ile button disable et — double-submit önle.

## Hata mesajı standardı

API'den dönen `data.error` string olur (`apiRequest()` öyle dönüyor). UI tarafta:

```jsx
catch (e) {
  // e.message = backend'in döndüğü string veya `HTTP <status>`
  setError(e.message || 'Bilinmeyen hata');
}
```

Kullanıcıya teknik kelime gösterme — `e.message` "HTTP 500" gibiyse genel mesaj göster: "Bağlantı sorunu, tekrar dene."

## Cache invalidation (manuel)

Mutation sonrası listeyi yenile:

```jsx
await api.post('/foodlog', newEntry);
await refetch();  // veya store.fetch(api)
```

Optimistic'e geçmedikçe explicit refetch yap.

## Yasaklar

- `localStorage` / `sessionStorage` — RN'de yok, `AsyncStorage` kullan.
- `fetch()` doğrudan — `useApi()` üzerinden git, auth header otomatik gelsin.
- Sonsuz loop riskli `useEffect` dependency (`[data]` ile setData yapma).
- Promise zincirinde `setState` cancel kontrolü olmadan.
- `ScrollView` içinde `FlatList`.

## Handoff'a yaz

backend-ui-bridge handoff dosyasında **State / Data Flow** bölümünü doldur:

```markdown
## State / Data Flow
- Loading: spinner (`Loading` component)
- Error: ErrorView + retry button
- Empty: EmptyState ("Henüz log yok, +'ya bas")
- Refresh: pull-to-refresh aktif
- Optimistic: like için evet, log create için hayır
- Store: useFoodLogStore (Feed + Profile her ikisi okuyor)
```
