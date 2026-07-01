// OnboardingLayout.js — SocialFit redesign · Onboarding ortak kabuk
// Konum: src/components/sf/OnboardingLayout.js
//
// Tüm onboarding adımları bunu sarar: ilerleme çubuğu (X/total), geri oku,
// kaydırılabilir gövde ve sticky alt CTA. Mevcut OnboardingNavigator akışına takılır.
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, shadow } from '../../theme/socialFitTheme';

export default function OnboardingLayout({
  step = 1, total = 13, onBack, onNext,
  ctaLabel = 'Devam', ctaDisabled = false, ctaIcon = 'arrow-forward',
  dark = false, footer = true, scroll = true, children,
}) {
  const fg = dark ? colors.white : colors.ink;
  const trackBg = dark ? 'rgba(255,255,255,0.18)' : '#E9EFE9';
  const fillBg = dark ? '#7AC79B' : colors.primary;
  const Body = scroll ? ScrollView : View;

  return (
    <KeyboardAvoidingView style={[styles.screen, dark && { backgroundColor: 'transparent' }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* İlerleme başlığı */}
      <View style={styles.progressRow}>
        {step > 1 && onBack ? (
          <TouchableOpacity style={[styles.back, dark && styles.backDark]} onPress={onBack}>
            <Ionicons name="chevron-back" size={18} color={dark ? colors.white : '#3C4A42'} />
          </TouchableOpacity>
        ) : null}
        <View style={[styles.track, { backgroundColor: trackBg }]}>
          <View style={{ width: `${(step / total) * 100}%`, height: '100%', borderRadius: 5, backgroundColor: fillBg }} />
        </View>
        <Text style={[styles.count, { color: dark ? 'rgba(255,255,255,0.7)' : colors.faint }]}>{step}/{total}</Text>
      </View>

      <Body style={{ flex: 1 }} contentContainerStyle={scroll ? { paddingBottom: 24 } : undefined}>
        {children}
      </Body>

      {footer ? (
        <View style={[styles.footer, dark && styles.footerDark]}>
          <TouchableOpacity style={[styles.cta, ctaDisabled && { opacity: 0.5 }]} activeOpacity={0.85} onPress={onNext} disabled={ctaDisabled}>
            <Text style={styles.ctaText}>{ctaLabel}</Text>
            {ctaIcon ? <Ionicons name={ctaIcon} size={19} color={colors.white} /> : null}
          </TouchableOpacity>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12 },
  back: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  backDark: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 0 },
  track: { flex: 1, height: 7, borderRadius: 5, overflow: 'hidden' },
  count: { fontFamily: font.displayBold, fontSize: 12 },
  footer: { borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.surface, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 26 },
  footerDark: { borderTopWidth: 0, backgroundColor: 'transparent' },
  cta: { backgroundColor: colors.primary, borderRadius: 18, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...shadow.cta },
  ctaText: { color: colors.white, fontFamily: font.bodyBold, fontSize: 16 },
});
