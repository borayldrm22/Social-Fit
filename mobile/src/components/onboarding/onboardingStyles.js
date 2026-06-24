import { StyleSheet, useColorScheme } from 'react-native';

export const BRAND = {
  primary: '#22C55E',
  secondary: '#0EA5E9',
  accent: '#F59E0B',
  darkBg: '#0F172A',
};

export function useOnboardingTheme() {
  const isDark = useColorScheme() === 'dark';
  return {
    isDark,
    c: {
      bg: isDark ? BRAND.darkBg : '#FFFFFF',
      cardBg: isDark ? '#1e293b' : '#FFFFFF',
      text: isDark ? '#f8fafc' : '#0f172a',
      textSecondary: isDark ? '#cbd5e1' : '#475569',
      textMuted: isDark ? '#94a3b8' : '#64748b',
      border: isDark ? '#475569' : '#e2e8f0',
      inputBg: isDark ? '#1e293b' : '#f8fafc',
      cardSelectedBg: isDark ? 'rgba(6, 78, 59, 0.35)' : '#ecfdf5',
      noteBg: isDark ? '#1e293b' : '#f1f5f9',
      footerBg: isDark ? BRAND.darkBg : '#FFFFFF',
      skyHintBg: isDark ? '#0c4a6e' : '#e0f2fe',
      skyHintText: isDark ? '#e0f2fe' : '#0c4a6e',
      ctaDisabled: isDark ? '#475569' : '#cbd5e1',
    },
  };
}

export const ob = StyleSheet.create({
  flex1: { flex: 1 },
  wFull: { width: '100%' },
  row: { flexDirection: 'row' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  gap8: { gap: 8 },
  px16: { paddingHorizontal: 16 },
  py8: { paddingVertical: 8 },
  mb12: { marginBottom: 12 },
  mb16: { marginBottom: 16 },
  mb24: { marginBottom: 24 },
  mt16: { marginTop: 16 },
  scrollPad: { paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8, paddingHorizontal: 4 },
  subtitle: { fontSize: 16, lineHeight: 24, marginBottom: 24, paddingHorizontal: 4 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
  },
  cta: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
