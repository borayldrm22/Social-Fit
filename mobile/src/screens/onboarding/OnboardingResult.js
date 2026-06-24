import React, { useEffect, useState } from 'react';
import { View, Text, useColorScheme, StyleSheet } from 'react-native';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { useOnboardingStore } from '../../store/onboardingStore';
import { idealWeightRangeKg } from '../../utils/calculations';

function CountUp({ value, suffix = '', duration = 900, color }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (value == null || Number.isNaN(value)) {
      setN(0);
      return;
    }
    const t0 = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / duration);
      setN(Math.round(value * p));
      if (p >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [value, duration]);
  if (value == null) {
    return (
      <Text style={[styles.count, { color }]}>—</Text>
    );
  }
  return (
    <Text style={[styles.count, { color }]}>
      {n}
      {suffix}
    </Text>
  );
}

function Card({ children, isDark }) {
  return (
    <View
      style={[
        styles.card,
        {
          borderColor: isDark ? '#475569' : '#e2e8f0',
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
        },
      ]}
    >
      {children}
    </View>
  );
}

export default function OnboardingResult({ navigation }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const muted = isDark ? '#cbd5e1' : '#475569';
  const text = isDark ? '#f8fafc' : '#0f172a';
  const dailyCalories = useOnboardingStore((s) => s.dailyCalories);
  const macros = useOnboardingStore((s) => s.macros);
  const estimatedWeeks = useOnboardingStore((s) => s.estimatedWeeks);
  const heightCm = useOnboardingStore((s) => s.heightCm);
  const range = idealWeightRangeKg(heightCm || 0);

  return (
    <OnboardingLayout
      navigation={navigation}
      routeName="OnboardingResult"
      title="Senin için hesapladık 🎉"
      subtitle="Kişisel özetin aşağıda — topluluğa geçmeden önce bir göz at."
      onNext={() => navigation.navigate('OnboardingSocial')}
      nextLabel="Devam →"
    >
      <Card isDark={isDark}>
        <Text style={[styles.cardLabel, { color: muted }]}>🔥 Günlük kalori</Text>
        <CountUp value={dailyCalories} suffix=" kcal" color={text} />
      </Card>
      <Card isDark={isDark}>
        <Text style={[styles.cardLabel, { color: muted, marginBottom: 8 }]}>Makrolar (hedef)</Text>
        <View style={styles.macroRow}>
          <Text style={[styles.macroLabel, { color: text }]}>🥩 Protein:</Text>
          <CountUp value={macros?.protein} suffix=" g" color={text} />
        </View>
        <View style={styles.macroRow}>
          <Text style={[styles.macroLabel, { color: text }]}>🍞 Karbonhidrat:</Text>
          <CountUp value={macros?.carbs} suffix=" g" color={text} />
        </View>
        <View style={styles.macroRow}>
          <Text style={[styles.macroLabel, { color: text }]}>🥑 Yağ:</Text>
          <CountUp value={macros?.fat} suffix=" g" color={text} />
        </View>
      </Card>
      <Card isDark={isDark}>
        <Text style={[styles.cardLabel, { color: muted }]}>⚖️ Sağlıklı kilo aralığı (BMI)</Text>
        <Text style={[styles.cardStrong, { color: text }]}>
          {range.min != null && range.max != null ? `${range.min} - ${range.max} kg` : '—'}
        </Text>
      </Card>
      <Card isDark={isDark}>
        <Text style={[styles.cardLabel, { color: muted }]}>📅 Tahmini süre (defisit planına göre)</Text>
        <CountUp value={estimatedWeeks} suffix=" hafta" color={text} />
      </Card>
      <View style={{ height: 16 }} />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLabel: { fontSize: 16, marginBottom: 4 },
  cardStrong: { fontSize: 20, fontWeight: '700' },
  count: { fontSize: 20, fontWeight: '700' },
  macroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  macroLabel: { fontSize: 16 },
});
