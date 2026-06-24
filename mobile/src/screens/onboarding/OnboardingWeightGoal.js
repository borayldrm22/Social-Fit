import React, { useEffect } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useOnboardingTheme, BRAND } from '../../components/onboarding/onboardingStyles';

export default function OnboardingWeightGoal({ navigation }) {
  const { c } = useOnboardingTheme();
  const weightGoalKg = useOnboardingStore((s) => s.weightGoalKg);
  const maintainWeightGoal = useOnboardingStore((s) => s.maintainWeightGoal);
  const setWeightGoalKg = useOnboardingStore((s) => s.setWeightGoalKg);
  const setMaintainWeightGoal = useOnboardingStore((s) => s.setMaintainWeightGoal);

  useEffect(() => {
    if (!maintainWeightGoal && weightGoalKg == null) setWeightGoalKg(5);
  }, [maintainWeightGoal, weightGoalKg, setWeightGoalKg]);

  const kg = weightGoalKg ?? 5;
  const displayKg = maintainWeightGoal ? 0 : kg;

  return (
    <OnboardingLayout
      navigation={navigation}
      routeName="OnboardingWeightGoal"
      title="Hadi biraz somutlaştıralım"
      subtitle="Kaç kilo vermek istiyorsun?"
      onNext={() => navigation.navigate('OnboardingTimeline')}
      nextDisabled={!maintainWeightGoal && (weightGoalKg == null || weightGoalKg < 1)}
    >
      <View
        style={[
          styles.toggleRow,
          { borderColor: c.border, backgroundColor: c.inputBg },
        ]}
      >
        <Text style={[styles.toggleLabel, { color: c.text, flex: 1 }]}>Formumu korumak</Text>
        <Switch
          value={maintainWeightGoal}
          onValueChange={(v) => {
            setMaintainWeightGoal(v);
            if (v) setWeightGoalKg(0);
            else if (weightGoalKg == null || weightGoalKg < 1) setWeightGoalKg(5);
          }}
          trackColor={{ false: '#cbd5e1', true: '#86efac' }}
          thumbColor={maintainWeightGoal ? BRAND.primary : '#f4f4f5'}
        />
      </View>
      {!maintainWeightGoal ? (
        <>
          <View style={styles.kgWrap}>
            <Text style={[styles.kgBig, { color: BRAND.primary }]}>{Math.round(displayKg)}</Text>
            <Text style={[styles.kgUnit, { color: c.textMuted }]}>kg</Text>
          </View>
          <Slider
            style={{ width: '100%', height: 48 }}
            minimumValue={1}
            maximumValue={40}
            step={1}
            value={kg}
            minimumTrackTintColor={BRAND.primary}
            maximumTrackTintColor="#e2e8f0"
            thumbTintColor={BRAND.primary}
            onValueChange={(v) => setWeightGoalKg(v)}
          />
          <Text style={[styles.sliderHint, { color: c.textMuted }]}>Kaydırarak hedefini seç</Text>
        </>
      ) : (
        <Text style={[styles.maintainNote, { color: c.textSecondary }]}>
          Harika — kilonu koruma yolunda sana özel plan hazırlayacağız.
        </Text>
      )}
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  toggleLabel: { fontSize: 16, fontWeight: '500' },
  kgWrap: { alignItems: 'center', marginBottom: 8 },
  kgBig: { fontSize: 48, fontWeight: '700' },
  kgUnit: { fontSize: 16 },
  sliderHint: { textAlign: 'center', fontSize: 14, marginTop: 4 },
  maintainNote: { textAlign: 'center', fontSize: 16, lineHeight: 24 },
});
