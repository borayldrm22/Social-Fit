import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingTheme, BRAND } from './onboardingStyles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function OnboardingProgress({ step, total, onBack, canGoBack = true, onDarkBackground }) {
  const { isDark, c } = useOnboardingTheme();
  const pct = Math.min(1, Math.max(0, step / total));
  const prevPct = useRef(pct);

  useEffect(() => {
    if (prevPct.current !== pct) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      prevPct.current = pct;
    }
  }, [pct]);

  const trackBg = onDarkBackground ? 'rgba(255,255,255,0.25)' : isDark ? '#334155' : '#e2e8f0';
  const backIcon = onDarkBackground ? '#f8fafc' : isDark ? '#e2e8f0' : '#0f172a';
  const stepColor = onDarkBackground ? 'rgba(248,250,252,0.85)' : c.textMuted;
  const backLabelColor = onDarkBackground ? '#f8fafc' : c.text;

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        {canGoBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Geri"
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color={backIcon} />
            <Text style={[styles.backText, { color: backLabelColor }]}>Geri</Text>
          </Pressable>
        ) : (
          <View style={styles.spacer} />
        )}
        <Text style={[styles.stepLabel, { color: stepColor }]}>
          Adım {step} / {total}
        </Text>
        <View style={styles.spacer} />
      </View>
      {/* Koşan adam → finish çizgisi */}
      <View style={styles.lane}>
        <Text style={styles.finish}>🏁</Text>
        <Image
          source={require('../../../assets/runner.png')}
          style={[styles.runner, { left: `${pct * 100}%` }]}
        />
      </View>
      <View style={[styles.track, { backgroundColor: trackBg }]}>
        <View
          style={{
            width: `${pct * 100}%`,
            height: '100%',
            borderRadius: 9999,
            backgroundColor: BRAND.primary,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  backBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingRight: 16 },
  backText: { fontSize: 16 },
  stepLabel: { fontSize: 14, fontWeight: '600' },
  spacer: { width: 64 },
  track: { height: 6, borderRadius: 9999, overflow: 'hidden' },
  lane: { height: 26, position: 'relative', marginBottom: 3 },
  finish: { position: 'absolute', right: -2, bottom: 0, fontSize: 17 },
  runner: { position: 'absolute', bottom: -1, width: 26, height: 26, marginLeft: -26, resizeMode: 'contain' },
});
