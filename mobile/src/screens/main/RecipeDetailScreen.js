// RecipeDetailScreen.js — SocialFit · Tarif detayı (gerçek veri)
// Konum: src/screens/main/RecipeDetailScreen.js
// route.params: { recipe }  — RecipesScreen tüm tarif objesini geçer
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, shadow } from '../../theme/socialFitTheme';
import { Placeholder } from '../../components/sf/ui';
import { comingSoon } from '../../utils/comingSoon';

function CoverImage({ uri }) {
  const [errored, setErrored] = useState(false);
  if (!uri || errored) {
    return <Placeholder height={250} radius={0} tint={colors.primary} label="" />;
  }
  return (
    <Image
      source={{ uri }}
      style={{ width: '100%', height: 250 }}
      resizeMode="cover"
      onError={() => setErrored(true)}
    />
  );
}

export default function RecipeDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const recipe = route?.params?.recipe || {};
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];
  const tags = Array.isArray(recipe.tags) ? recipe.tags : [];

  const [tab, setTab] = useState('ing');
  const [stepView, setStepView] = useState('steps'); // 'steps' | 'full'
  const [checked, setChecked] = useState(() => ingredients.map(() => false));

  const stats = [
    { icon: 'time-outline', val: `${recipe.timeMinutes ?? '-'} dk`, lbl: 'Süre', tint: colors.primary },
    { icon: 'flame', val: `${recipe.calories ?? '-'}`, lbl: 'kcal', tint: colors.coral },
    { icon: 'nutrition', val: `${recipe.protein ?? '-'}g`, lbl: 'Protein', tint: colors.primary },
    { icon: 'people', val: `${recipe.servings ?? 1}`, lbl: 'Kişilik', tint: colors.primary },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Kapak */}
        <View>
          <CoverImage uri={recipe.imageUrl} />
          <View style={[styles.coverBar, { top: insets.top + 6 }]}>
            <TouchableOpacity style={styles.glass} onPress={() => navigation?.goBack?.()}>
              <Ionicons name="arrow-back" size={20} color={colors.white} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={styles.glass} onPress={() => Share.share({ message: `${recipe.title || 'Bu tarif'} — Social Fit Mutfak 🍳` })}>
                <Ionicons name="share-social-outline" size={19} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.glass} onPress={() => comingSoon('Favoriler')}>
                <Ionicons name="heart" size={19} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.sheet}>
          {/* Rozetler — recipe.tags */}
          {tags.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap' }}>
              {tags.map((tag, i) => {
                const even = i % 2 === 0;
                return (
                  <View key={tag} style={[styles.badge, { backgroundColor: even ? colors.coralTint : colors.mint }]}>
                    <Text style={[styles.badgeText, { color: even ? colors.coralDark : colors.primary }]}>{tag}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <Text style={styles.title}>{recipe.title || 'Tarif'}</Text>

          {/* Marka satırı (yazar/puan yerine) */}
          <View style={styles.brandRow}>
            <Ionicons name="restaurant" size={16} color={colors.primary} />
            <Text style={styles.brand}>Social Fit Mutfak</Text>
          </View>

          {/* İstatistik kutular */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            {stats.map((s) => (
              <View key={s.lbl} style={styles.stat}>
                <Ionicons name={s.icon} size={18} color={s.tint} />
                <Text style={styles.statVal}>{s.val}</Text>
                <Text style={styles.statLbl}>{s.lbl}</Text>
              </View>
            ))}
          </View>

          {/* Fit Not kartı */}
          {recipe.fitNote ? (
            <View style={styles.fitNote}>
              <View style={styles.fitNoteHead}>
                <Ionicons name="bulb" size={16} color={colors.primary} />
                <Text style={styles.fitNoteTitle}>Fit Not</Text>
              </View>
              <Text style={styles.fitNoteText}>{recipe.fitNote}</Text>
            </View>
          ) : null}

          {/* Sekmeler */}
          <View style={styles.tabs}>
            <TouchableOpacity onPress={() => setTab('ing')} style={[styles.tab, tab === 'ing' && styles.tabOn]}>
              <Text style={[styles.tabText, { color: tab === 'ing' ? colors.ink : '#9AA89E' }]}>Malzemeler</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTab('steps')} style={[styles.tab, tab === 'steps' && styles.tabOn]}>
              <Text style={[styles.tabText, { color: tab === 'steps' ? colors.ink : '#9AA89E' }]}>Hazırlanışı</Text>
            </TouchableOpacity>
          </View>

          {tab === 'ing' ? (
            <View style={{ marginTop: 14, gap: 11 }}>
              {ingredients.map((it, i) => (
                <TouchableOpacity key={i} style={styles.ingRow} onPress={() => setChecked((c) => c.map((v, j) => (j === i ? !v : v)))}>
                  <View style={[styles.check, checked[i] ? styles.checkOn : styles.checkOff]}>
                    {checked[i] ? <Ionicons name="checkmark" size={14} color={colors.primary} /> : null}
                  </View>
                  <Text style={styles.ingName}>{it.name}</Text>
                  <Text style={styles.ingAmount}>{it.amount}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={{ marginTop: 14 }}>
              {recipe.fullText ? (
                <View style={styles.viewToggle}>
                  <TouchableOpacity style={[styles.viewToggleBtn, stepView === 'steps' && styles.viewToggleOn]} onPress={() => setStepView('steps')} activeOpacity={0.8}>
                    <Text style={[styles.viewToggleText, stepView === 'steps' && styles.viewToggleTextOn]}>Adım Adım</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.viewToggleBtn, stepView === 'full' && styles.viewToggleOn]} onPress={() => setStepView('full')} activeOpacity={0.8}>
                    <Text style={[styles.viewToggleText, stepView === 'full' && styles.viewToggleTextOn]}>Uzun Anlatım</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {recipe.fullText && stepView === 'full' ? (
                <Text style={styles.fullText}>{recipe.fullText}</Text>
              ) : (
                <View style={{ gap: 14 }}>
                  {steps.map((s, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
                      <Text style={styles.stepText}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={() => comingSoon('Kaydet')}><Ionicons name="bookmark-outline" size={22} color={colors.primary} /></TouchableOpacity>
        <TouchableOpacity style={styles.cta} activeOpacity={0.85} onPress={() => comingSoon('Adım adım yapım')}>
          <Ionicons name="play" size={18} color={colors.white} />
          <Text style={styles.ctaText}>Yapmaya Başla</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  coverBar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  glass: { width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  sheet: { marginTop: -30, backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontFamily: font.bodyBold, fontSize: 11 },
  title: { fontFamily: font.displayBold, fontSize: 23, color: colors.ink, marginTop: 12, letterSpacing: -0.4 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 11 },
  brand: { fontSize: 13, color: colors.muted, fontFamily: font.bodyBold },
  stat: { flex: 1, backgroundColor: colors.bg, borderRadius: 15, paddingVertical: 12, alignItems: 'center', gap: 5 },
  statVal: { fontFamily: font.displayBold, fontSize: 15, color: colors.ink },
  statLbl: { fontSize: 10, color: colors.faint, fontFamily: font.bodyBold },
  fitNote: { marginTop: 16, backgroundColor: colors.mint, borderRadius: 16, padding: 14 },
  fitNoteHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  fitNoteTitle: { fontFamily: font.bodyBold, fontSize: 13, color: colors.primary },
  fitNoteText: { fontFamily: font.body, fontSize: 13, color: colors.text, lineHeight: 19 },
  tabs: { flexDirection: 'row', gap: 20, borderBottomWidth: 1, borderBottomColor: colors.divider, marginTop: 20 },
  tab: { paddingBottom: 11 },
  tabOn: { borderBottomWidth: 2.5, borderBottomColor: colors.primary },
  tabText: { fontFamily: font.bodyBold, fontSize: 15 },
  ingRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  check: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.mint },
  checkOff: { backgroundColor: colors.bg, borderWidth: 1.5, borderColor: '#DCE4DC' },
  ingName: { flex: 1, fontSize: 14, color: colors.text, fontFamily: font.body },
  ingAmount: { fontSize: 13, color: colors.faint, fontFamily: font.bodyBold },
  stepNum: { width: 26, height: 26, borderRadius: 9, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: font.displayBold, fontSize: 13, color: colors.primary },
  stepText: { flex: 1, fontSize: 14, color: colors.text, fontFamily: font.body, lineHeight: 21 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider, paddingHorizontal: 18, paddingTop: 13, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
  saveBtn: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  cta: { flex: 1, backgroundColor: colors.primary, borderRadius: 17, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...shadow.cta },
  ctaText: { color: colors.white, fontFamily: font.bodyBold, fontSize: 16 },
  viewToggle: { flexDirection: 'row', backgroundColor: '#E9EFE9', borderRadius: 12, padding: 4, marginBottom: 16 },
  viewToggleBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9 },
  viewToggleOn: { backgroundColor: colors.surface, ...shadow.soft },
  viewToggleText: { fontFamily: font.bodyBold, fontSize: 13, color: '#8A988E' },
  viewToggleTextOn: { color: colors.ink },
  fullText: { fontSize: 14.5, color: colors.text, lineHeight: 24, fontFamily: font.body },
});
