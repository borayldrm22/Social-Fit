// ui.js — SocialFit paylaşılan arayüz bileşenleri
// Konum önerisi: src/components/sf/ui.js
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE } from '../../config';
import { colors, font, shadow, avatarColor, getInitials } from '../../theme/socialFitTheme';

export function avatarUri(profile) {
  const url = profile?.avatarUrl;
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

// Yuvarlatılmış kare avatar (tasarımdaki gibi). round=true ise tam yuvarlak.
export function Avatar({ profile, name, size = 44, round = false, style }) {
  const dn = profile?.displayName ?? name;
  const uri = avatarUri(profile);
  const br = round ? size / 2 : size * 0.34;
  if (uri) return <Image source={{ uri }} style={[{ width: size, height: size, borderRadius: br }, style]} />;
  return (
    <View style={[{ width: size, height: size, borderRadius: br, backgroundColor: avatarColor(dn), alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{ color: colors.white, fontFamily: font.displayBold, fontSize: size * 0.36 }}>{getInitials(dn)}</Text>
    </View>
  );
}

export function StarPill({ value, style }) {
  const v = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value ?? 0}`;
  return (
    <View style={[styles.starPill, style]}>
      <Text style={styles.starText}>⭐ {v}</Text>
    </View>
  );
}

export function Chip({ label, active, style }) {
  return (
    <View style={[styles.chip, active ? styles.chipActive : styles.chipIdle, style]}>
      <Text style={[styles.chipText, { color: active ? colors.white : colors.text }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ value = 0, color = colors.primary, track = colors.divider, height = 7, style }) {
  return (
    <View style={[{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }, style]}>
      <View style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, height: '100%', borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

export function ScreenHeader({ title, subtitle, right }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSub}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function IconButton({ name, onPress, tint = colors.text, bg = colors.surface, bordered = true, size = 38 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: 13, backgroundColor: bg, borderWidth: bordered ? 1 : 0, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={size * 0.5} color={tint} onPress={onPress} />
    </View>
  );
}

// Görsel placeholder (gerçek Image gelene kadar)
export function Placeholder({ height = 160, tint = colors.mint, radius = 18, label = 'görsel', style, children }) {
  return (
    <View style={[{ height, borderRadius: radius, backgroundColor: tint, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, style]}>
      {children ?? <Text style={{ fontSize: 12, color: colors.faint }}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  starPill: { backgroundColor: colors.amberTint, paddingHorizontal: 7, paddingVertical: 1, borderRadius: 10 },
  starText: { fontFamily: font.displayBold, fontSize: 11, color: colors.amberDark },
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 13, marginRight: 8 },
  chipActive: { backgroundColor: colors.primary },
  chipIdle: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipText: { fontFamily: font.bodyBold, fontSize: 13 },
  header: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontFamily: font.displayBold, fontSize: 24, color: colors.ink, letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: colors.faint, fontFamily: font.body, marginTop: 1 },
});
