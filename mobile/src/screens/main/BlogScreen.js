// BlogScreen.js — SocialFit redesign · Bloglar listesi
// Konum: src/screens/main/BlogScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../../api/client';
import { colors, font, shadow } from '../../theme/socialFitTheme';
import { Chip, Avatar, Placeholder } from '../../components/sf/ui';
import { comingSoon } from '../../utils/comingSoon';

const CATS = ['Tümü', 'Beslenme', 'Motivasyon', 'Antrenman'];
const FEATURED = { id: 'b1', cat: 'BESLENME', read: '5 dk okuma', title: 'Protein ihtiyacını doğru hesaplamanın 5 yolu', author: 'Dyt. Selin Korkmaz', tint: '#E7EEF7' };
const LIST = [
  { id: 'b2', cat: 'MOTİVASYON', catColor: colors.coralDark, title: "Streak'ini korumanın psikolojisi", author: 'Mehmet D.', read: '3 dk', tint: '#FDEBE3' },
  { id: 'b3', cat: 'ANTRENMAN', catColor: colors.primary, title: 'Evde 20 dakikada tam vücut', author: 'Can Y.', read: '6 dk', tint: colors.mint },
];

export default function BlogScreen({ navigation }) {
  const api = useApi();
  const insets = useSafeAreaInsets();
  const [cat, setCat] = useState('Tümü');
  const load = useCallback(async () => { try { await api.get('/blog'); } catch (e) {} }, [api]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const open = (post) => navigation.navigate('BlogDetail', { post });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 28, paddingTop: insets.top }}>
      <View style={styles.header}>
        <View><Text style={styles.title}>Blog</Text><Text style={styles.sub}>Uzmanlardan içerikler</Text></View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => comingSoon('Blog arama')}><Ionicons name="search" size={19} color="#3C4A42" /></TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 16 }}>
        {CATS.map((c) => (<TouchableOpacity key={c} onPress={() => setCat(c)}><Chip label={c} active={cat === c} /></TouchableOpacity>))}
      </ScrollView>

      {/* Öne çıkan */}
      <TouchableOpacity activeOpacity={0.9} style={styles.featured} onPress={() => open(FEATURED)}>
        <Placeholder height={170} radius={0} tint={FEATURED.tint} label="kapak görseli">
          <View style={styles.ftTag}><Text style={styles.ftTagText}>Öne Çıkan</Text></View>
        </Placeholder>
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Text style={styles.cat}>{FEATURED.cat}</Text>
            <View style={styles.dot} />
            <Text style={styles.read}>{FEATURED.read}</Text>
          </View>
          <Text style={styles.fTitle}>{FEATURED.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 12 }}>
            <Avatar name={FEATURED.author} size={30} />
            <Text style={styles.author}>{FEATURED.author}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Liste */}
      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        {LIST.map((p) => (
          <TouchableOpacity key={p.id} activeOpacity={0.9} style={styles.row} onPress={() => open(p)}>
            <Placeholder height={84} radius={14} tint={p.tint} style={{ width: 84 }} label="" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.rowCat, { color: p.catColor }]}>{p.cat}</Text>
              <Text style={styles.rowTitle}>{p.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 }}>
                <Text style={styles.rowMeta}>{p.author}</Text>
                <View style={styles.dot} />
                <Text style={styles.rowMeta}>{p.read}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: font.displayBold, fontSize: 24, color: colors.ink, letterSpacing: -0.3 },
  sub: { fontSize: 13, color: colors.faint, fontFamily: font.body, marginTop: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  featured: { marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.surface, borderRadius: 22, ...shadow.card, overflow: 'hidden' },
  ftTag: { position: 'absolute', top: 12, left: 12, backgroundColor: colors.blue, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 11 },
  ftTagText: { color: colors.white, fontFamily: font.bodyBold, fontSize: 11 },
  cat: { fontSize: 12, color: colors.blue, fontFamily: font.bodyBold },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#C5CFC7' },
  read: { fontSize: 12, color: colors.faint, fontFamily: font.body },
  fTitle: { fontFamily: font.bodyBold, fontSize: 18, color: colors.ink, marginTop: 8, lineHeight: 24, letterSpacing: -0.2 },
  author: { fontSize: 13, color: colors.muted, fontFamily: font.bodyBold },
  row: { flexDirection: 'row', gap: 13, backgroundColor: colors.surface, borderRadius: 18, ...shadow.soft, padding: 10 },
  rowCat: { fontSize: 11, fontFamily: font.bodyBold },
  rowTitle: { fontFamily: font.bodyBold, fontSize: 14, color: colors.ink, lineHeight: 18, marginTop: 4 },
  rowMeta: { fontSize: 12, color: colors.faint, fontFamily: font.body },
});
