// StarGuideCard.js — SocialFit · "Yıldız nasıl kazanılır?" mini kartı
// Puan değerleri backend ile senkron: streaks.js (+20/+50), users.js, groups.js, bookings.js, posts.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, radius, shadow } from '../../theme/socialFitTheme';

// [emoji, etiket, puan, öne çıkan mı]
const RULES = [
  ['📸', 'Günlük paylaşım / öğün', 20, true],
  ['🔥', '7 günlük seri bonusu', 50, true],
  ['🎯', 'Profil tamamlama', 20, false],
  ['🩺', 'Koç randevusu', 25, false],
  ['🤝', 'Arkadaş ekleme', 15, false],
  ['👥', 'Gruba katılma', 10, false],
  ['💬', 'Yorum yapma', 2, false],
  ['❤️', 'Beğeni alma', 1, false],
];

export default function StarGuideCard({ style }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.head}>
        <Text style={styles.star}>⭐</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Yıldız nasıl kazanılır?</Text>
          <Text style={styles.subtitle}>Her aktivite seni liderlikte yukarı taşır</Text>
        </View>
      </View>

      <View style={styles.list}>
        {RULES.map(([icon, label, pts, hero]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.label} numberOfLines={1}>{label}</Text>
            <View style={[styles.pill, hero && styles.pillHero]}>
              <Text style={[styles.pillText, hero && styles.pillTextHero]}>+{pts}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.note}>Günlük puan günde bir kez verilir — her gün paylaş, seriyi kırma! 💪</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 18,
    ...shadow.card,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  star: { fontSize: 30 },
  title: { fontFamily: font.displayBold, fontSize: 18, color: colors.ink },
  subtitle: { fontFamily: font.body, fontSize: 12.5, color: colors.muted, marginTop: 2 },
  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { fontSize: 17, width: 24, textAlign: 'center' },
  label: { flex: 1, fontFamily: font.body, fontSize: 14, color: colors.text },
  pill: {
    backgroundColor: colors.mintSoft,
    borderRadius: radius.full,
    paddingHorizontal: 11,
    paddingVertical: 4,
    minWidth: 44,
    alignItems: 'center',
  },
  pillHero: { backgroundColor: colors.amberTint },
  pillText: { fontFamily: font.bodyBold, fontSize: 13, color: colors.primary },
  pillTextHero: { color: colors.amberDark },
  note: {
    fontFamily: font.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 14,
    lineHeight: 17,
  },
});
