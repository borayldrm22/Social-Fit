---
name: mobile-screen-patterns
description: Social Fit mobile uygulamasındaki ekranların ortak yapı bloklarını (safe area + scroll iskeleti, header, card, CTA, list item, empty state, loading) Social Fit token'larıyla nasıl kuracağını gösterir.
---

# Mobile Screen Pattern'leri

Bu rehber Social Fit ekranlarında tekrar eden iskeleti gösterir. Her ekranda aynı patron uygulanırsa look-and-feel tutarlı kalır.

## Ekran iskeleti

```jsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView, View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/socialFitTheme';

export default function SomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        {/* Cards */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
});
```

## Header

İki tipik header var: **basit** (başlık + opsiyonel sağ ikon) ve **avatarlı**.

```jsx
<View style={styles.header}>
  <Text style={styles.title}>Akış</Text>
  <Pressable hitSlop={12}>
    <Ionicons name="notifications-outline" size={24} color={colors.ink} />
  </Pressable>
</View>

header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
title:   { fontFamily: font.display, fontSize: 28, color: colors.ink },
```

## Card

```jsx
<View style={styles.card}>{/* content */}</View>

card: {
  backgroundColor: colors.surface,
  borderRadius: radius.card,
  padding: spacing.lg,
  marginBottom: spacing.md,
  ...shadow.card,
}
```

## CTA buton

```jsx
<Pressable style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]} onPress={...}>
  <Text style={styles.ctaText}>Devam et</Text>
</Pressable>

cta: {
  backgroundColor: colors.primary,
  borderRadius: radius.pill,
  paddingVertical: spacing.md,
  alignItems: 'center',
  ...shadow.cta,
},
ctaText: { fontFamily: font.bodyBold, fontSize: 16, color: colors.white },
```

İkincil CTA: `backgroundColor: colors.coral` veya outline (`backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary`).

## Liste item

```jsx
<FlatList
  data={items}
  keyExtractor={(it) => it.id}
  ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.divider }} />}
  renderItem={({ item }) => (
    <Pressable style={styles.row} onPress={...}>
      {/* avatar / icon */}
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.faint} />
    </Pressable>
  )}
/>
```

## Empty / Loading / Error

Her data-fetch ekranı üç state'i de göstermeli:

```jsx
if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />;
if (error) return <Text style={{ color: colors.coralDark, padding: spacing.lg }}>{error}</Text>;
if (items.length === 0) return <EmptyState />;
```

## API çağrı pattern'i

```jsx
const api = useApi();
const [loading, setLoading] = useState(true);
const [data, setData] = useState(null);

useEffect(() => {
  let cancelled = false;
  setLoading(true);
  api.get('/foodlog')
    .then((r) => { if (!cancelled) setData(r); })
    .catch((e) => { if (!cancelled) console.warn(e); })
    .finally(() => { if (!cancelled) setLoading(false); });
  return () => { cancelled = true; };
}, [api]);
```

`api` artık `useMemo`'lu — bu cancel pattern hala koruma. `[api]` dependency yeterli, `[token]` ekleme.

## Yasaklar

- `ScrollView` içinde `FlatList` — kullanma.
- Inline absolute renk (`#fff`, `#000`) — token kullan.
- `Dimensions.get('window')` — `useWindowDimensions` hook'u tercih.
- Animasyon için eski `Animated` API — Reanimated v4 kullan.
