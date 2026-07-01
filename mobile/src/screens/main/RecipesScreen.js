// RecipesScreen.js — SocialFit redesign · Tarifler listesi
// Konum: src/screens/main/RecipesScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../../api/client';
import { colors, font, shadow, spacing, radius } from '../../theme/socialFitTheme';
import { Chip, Placeholder } from '../../components/sf/ui';
import { comingSoon } from '../../utils/comingSoon';

const CATS = ['Tümü', 'Kahvaltı', 'Yüksek Protein', 'Atıştırmalık'];

// Tarifleri 2'li çiftlere böler (son tek eleman için null doldurur)
function toPairs(arr) {
  const pairs = [];
  for (let i = 0; i < arr.length; i += 2) {
    pairs.push([arr[i], arr[i + 1] ?? null]);
  }
  return pairs;
}

function FeaturedImage({ uri, height }) {
  const [errored, setErrored] = useState(false);
  if (!uri || errored) {
    return <Placeholder height={height} radius={0} tint={colors.mint} label="tarif görseli" />;
  }
  return (
    <Image
      source={{ uri }}
      style={{ width: '100%', height }}
      resizeMode="cover"
      onError={() => setErrored(true)}
    />
  );
}

function GridImage({ uri, height }) {
  const [errored, setErrored] = useState(false);
  if (!uri || errored) {
    return <Placeholder height={height} radius={0} tint={colors.mint} label="" />;
  }
  return (
    <Image
      source={{ uri }}
      style={{ width: '100%', height }}
      resizeMode="cover"
      onError={() => setErrored(true)}
    />
  );
}

export default function RecipesScreen({ navigation }) {
  const api = useApi();
  const insets = useSafeAreaInsets();
  const [cat, setCat] = useState('Tümü');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.get('/api/recipes')
      .then((r) => { if (!cancelled) setRecipes(Array.isArray(r) ? r : []); })
      .catch(() => { if (!cancelled) setError('Tarifler yüklenemedi'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [api]);

  useFocusEffect(useCallback(() => { return load(); }, [load]));

  const open = (recipe) => navigation.navigate('RecipeDetail', { recipe });

  // Filtre mantığı
  const filtered = recipes.filter((r) => {
    if (cat === 'Tümü') return true;
    if (cat === 'Yüksek Protein') return Array.isArray(r.tags) && r.tags.includes('Yüksek Protein');
    return r.category === cat;
  });

  const featured = filtered.find((r) => r.isFeatured) ?? null;
  const gridItems = filtered.filter((r) => !r.isFeatured);
  const gridPairs = toPairs(gridItems);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: spacing.xxl, paddingTop: insets.top }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tarifler</Text>
          <Text style={styles.sub}>Sağlıklı & pratik</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => comingSoon('Kaydedilenler')}>
          <Ionicons name="bookmark-outline" size={19} color={colors.ink} accessibilityLabel="Kaydedilenler" />
        </TouchableOpacity>
      </View>

      {/* Search bar (dekoratif) */}
      <TouchableOpacity style={styles.search} activeOpacity={0.7} accessibilityLabel="Tarif ara" onPress={() => comingSoon('Tarif arama')}>
        <Ionicons name="search" size={18} color={colors.faint} />
        <Text style={styles.searchText}>Tarif veya malzeme ara</Text>
      </TouchableOpacity>

      {/* Kategori chip'leri */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}
      >
        {CATS.map((c) => (
          <TouchableOpacity key={c} onPress={() => setCat(c)} accessibilityLabel={c}>
            <Chip label={c} active={cat === c} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Loading */}
      {loading && (
        <ActivityIndicator
          color={colors.primary}
          size="large"
          style={{ marginTop: spacing.xxl }}
        />
      )}

      {/* Error */}
      {!loading && error && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load} accessibilityLabel="Tekrar Dene">
            <Text style={styles.retryText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty — filtre sonucu boş */}
      {!loading && !error && filtered.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Bu kategoride tarif bulunamadı</Text>
        </View>
      )}

      {/* İçerik */}
      {!loading && !error && filtered.length > 0 && (
        <>
          {/* Öne çıkan kart */}
          {featured && (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.featured}
              onPress={() => open(featured)}
              accessibilityLabel={`Öne çıkan: ${featured.title}`}
            >
              <View style={{ overflow: 'hidden', borderTopLeftRadius: 22, borderTopRightRadius: 22 }}>
                <FeaturedImage uri={featured.imageUrl} height={158} />
                <View style={styles.editorTag}>
                  <Text style={styles.editorText}>Editörün Seçimi</Text>
                </View>
                <TouchableOpacity style={styles.heart} onPress={() => comingSoon('Favoriler')}>
                  <Ionicons name="heart" size={18} color={colors.like} />
                </TouchableOpacity>
              </View>
              <View style={{ padding: spacing.md + 3 }}>
                <Text style={styles.fTitle}>{featured.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md + 2, marginTop: spacing.sm + 2 }}>
                  <Meta icon="time-outline" text={`${featured.timeMinutes} dk`} />
                  <Meta icon="flame" text={`${featured.calories} kcal`} tint={colors.coral} />
                  <Meta icon="cellular" text={featured.difficulty} tint={colors.primary} />
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* Izgara — 2 sütun */}
          {gridPairs.map((pair, pIdx) => (
            <View key={pIdx} style={styles.gridRow}>
              {pair.map((g, gIdx) =>
                g ? (
                  <TouchableOpacity
                    key={g.id}
                    activeOpacity={0.9}
                    style={styles.gCard}
                    onPress={() => open(g)}
                    accessibilityLabel={g.title}
                  >
                    <View style={{ overflow: 'hidden', borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
                      <GridImage uri={g.imageUrl} height={96} />
                      <View style={styles.kcalTag}>
                        <Text style={styles.kcalText}>{g.calories} kcal</Text>
                      </View>
                    </View>
                    <View style={{ padding: spacing.sm + 3 }}>
                      <Text style={styles.gTitle} numberOfLines={2}>{g.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 1, marginTop: spacing.xs + 3 }}>
                        <Ionicons name="time-outline" size={13} color={colors.faint} />
                        <Text style={styles.gTime}>{g.timeMinutes} dk</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ) : (
                  // Tek eleman kaldıysa sağ taraf boş bırakılır (boyut tutmak için)
                  <View key={`empty-${gIdx}`} style={styles.gCard} />
                )
              )}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function Meta({ icon, text, tint = colors.faint }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 1 }}>
      <Ionicons name={icon} size={15} color={tint} />
      <Text style={{ fontSize: 13, color: colors.muted, fontFamily: font.bodyBold }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg + 2,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontFamily: font.displayBold, fontSize: 24, color: colors.ink, letterSpacing: -0.3 },
  sub: { fontSize: 13, color: colors.faint, fontFamily: font.body, marginTop: 1 },
  iconBtn: {
    width: 38, height: 38, borderRadius: radius.chip,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  search: {
    marginHorizontal: spacing.lg + 2,
    marginBottom: spacing.sm + 6,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: spacing.md + 3, paddingHorizontal: spacing.sm + 6, paddingVertical: spacing.md,
  },
  searchText: { fontSize: 14, color: colors.faint, fontFamily: font.body },
  featured: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm + 6,
    backgroundColor: colors.surface,
    borderRadius: 22,
    ...shadow.card,
    overflow: 'hidden',
  },
  editorTag: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: colors.coral,
    paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs,
    borderRadius: 11,
  },
  editorText: { color: colors.white, fontFamily: font.bodyBold, fontSize: 11 },
  heart: {
    position: 'absolute', top: 12, right: 12,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  fTitle: { fontFamily: font.displayBold, fontSize: 18, color: colors.ink, letterSpacing: -0.2 },
  gridRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  gCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 18, ...shadow.soft, overflow: 'hidden' },
  kcalTag: {
    position: 'absolute', bottom: spacing.sm, right: spacing.sm,
    backgroundColor: 'rgba(17,35,27,0.78)',
    paddingHorizontal: spacing.xs + 3, paddingVertical: spacing.xs - 1,
    borderRadius: spacing.sm,
  },
  kcalText: { color: colors.white, fontFamily: font.bodyBold, fontSize: 10 },
  gTitle: { fontFamily: font.bodyBold, fontSize: 14, color: colors.ink, lineHeight: 18 },
  gTime: { fontSize: 12, color: colors.faint, fontFamily: font.bodyBold },
  centered: { alignItems: 'center', marginTop: spacing.xxl, paddingHorizontal: spacing.xl },
  errorText: { fontSize: 14, color: colors.coralDark, fontFamily: font.body, textAlign: 'center', marginBottom: spacing.md },
  retryBtn: {
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.sm + 2,
    ...shadow.cta,
  },
  retryText: { color: colors.white, fontFamily: font.bodyBold, fontSize: 14 },
  emptyText: { fontSize: 14, color: colors.muted, fontFamily: font.body, textAlign: 'center' },
});
