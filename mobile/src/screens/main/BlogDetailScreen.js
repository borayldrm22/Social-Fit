// BlogDetailScreen.js — SocialFit redesign · Blog yazı detayı
// Konum: src/screens/main/BlogDetailScreen.js
// route.params: { post }
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, shadow } from '../../theme/socialFitTheme';
import { Avatar, Placeholder } from '../../components/sf/ui';
import { comingSoon } from '../../utils/comingSoon';

export default function BlogDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const post = route?.params?.post || { title: 'Protein ihtiyacını doğru hesaplamanın 5 yolu', cat: 'BESLENME', author: 'Dyt. Selin Korkmaz' };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Kapak */}
        <Placeholder height={214} radius={0} tint="#EFF3F9" label="">
          <View style={[styles.coverBar, { top: insets.top + 6 }]}>
            <TouchableOpacity style={styles.glass} onPress={() => navigation?.goBack?.()}><Ionicons name="arrow-back" size={20} color={colors.ink} /></TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={styles.glass} onPress={() => comingSoon('Kaydet')}><Ionicons name="bookmark-outline" size={19} color={colors.ink} /></TouchableOpacity>
              <TouchableOpacity style={styles.glass} onPress={() => Share.share({ message: `${post.title || 'Social Fit blog yazısı'} — Social Fit 🌿` }).catch(() => {})}><Ionicons name="share-social-outline" size={19} color={colors.ink} /></TouchableOpacity>
            </View>
          </View>
        </Placeholder>

        <View style={{ padding: 22 }}>
          <View style={styles.catBadge}><Text style={styles.catText}>{post.cat}</Text></View>
          <Text style={styles.title}>{post.title}</Text>

          <View style={styles.authorRow}>
            <Avatar name={post.author} size={42} />
            <View style={{ flex: 1 }}>
              <Text style={styles.author}>{post.author}</Text>
              <Text style={styles.date}>24 Haz · 5 dk okuma</Text>
            </View>
            <TouchableOpacity style={styles.follow} onPress={() => comingSoon('Takip Et')}><Text style={styles.followText}>Takip Et</Text></TouchableOpacity>
          </View>

          <Text style={styles.p}>Günlük protein ihtiyacın yaşına, kilona ve aktivite düzeyine göre değişir. Çoğu kişi sandığından <Text style={styles.b}>çok daha az</Text> protein alıyor.</Text>
          <Text style={styles.h2}>1. Vücut ağırlığını temel al</Text>
          <Text style={styles.p}>Hareketsiz bir yaşamda kilogram başına 0.8g yeterliyken, düzenli antrenman yapıyorsan bu oran 1.6–2.2g'a kadar çıkar.</Text>

          <View style={styles.tip}>
            <Text style={styles.tipText}>💡 78 kg ve orta aktif biri için günde yaklaşık <Text style={styles.b}>110–130g</Text> protein ideal aralıktır.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.fAction} onPress={() => comingSoon('Beğeni')}><Ionicons name="heart" size={22} color={colors.like} /><Text style={styles.fActionText}>342</Text></TouchableOpacity>
        <TouchableOpacity style={styles.fAction} onPress={() => comingSoon('Yorumlar')}><Ionicons name="chatbubble-outline" size={21} color="#6B7280" /><Text style={styles.fActionText}>28</Text></TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.saveCta} activeOpacity={0.85} onPress={() => comingSoon('Kaydet')}>
          <Ionicons name="bookmark-outline" size={17} color={colors.white} />
          <Text style={styles.saveText}>Kaydet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  coverBar: { position: 'absolute', top: 12, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  glass: { width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
  catBadge: { alignSelf: 'flex-start', backgroundColor: '#E7EEF7', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 10 },
  catText: { color: colors.blue, fontFamily: font.bodyBold, fontSize: 11 },
  title: { fontFamily: font.displayBold, fontSize: 24, color: colors.ink, marginTop: 13, letterSpacing: -0.4, lineHeight: 30 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.divider },
  author: { fontFamily: font.bodyBold, fontSize: 14, color: colors.ink },
  date: { fontSize: 12, color: colors.faint, fontFamily: font.body, marginTop: 1 },
  follow: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 13 },
  followText: { color: colors.white, fontFamily: font.bodyBold, fontSize: 13 },
  p: { fontSize: 15, color: colors.text, lineHeight: 26, marginTop: 16 },
  b: { fontFamily: font.bodyBold, color: colors.ink },
  h2: { fontFamily: font.displayBold, fontSize: 17, color: colors.ink, marginTop: 20 },
  tip: { marginTop: 18, backgroundColor: '#F0F8F3', borderLeftWidth: 3, borderLeftColor: colors.primary, borderRadius: 12, padding: 14 },
  tipText: { fontSize: 14, color: '#1F4D38', lineHeight: 22, fontFamily: font.body },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider, paddingHorizontal: 18, paddingTop: 13, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 16 },
  fAction: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  fActionText: { fontFamily: font.displayBold, fontSize: 14, color: colors.text },
  saveCta: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 7, ...shadow.cta },
  saveText: { color: colors.white, fontFamily: font.bodyBold, fontSize: 14 },
});
