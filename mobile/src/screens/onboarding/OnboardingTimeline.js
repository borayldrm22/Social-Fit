import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import OptionButton from '../../components/onboarding/OptionButton';
import { TIMELINE_OPTIONS } from '../../onboarding/constants';
import { useOnboardingStore } from '../../store/onboardingStore';
import { estimateMonthsAtFiveKgPerMonth } from '../../utils/calculations';
import * as Haptics from 'expo-haptics';
import { useOnboardingTheme } from '../../components/onboarding/onboardingStyles';

export default function OnboardingTimeline({ navigation }) {
  const { c } = useOnboardingTheme();
  const timeline = useOnboardingStore((s) => s.timeline);
  const setTimeline = useOnboardingStore((s) => s.setTimeline);
  const weightGoalKg = useOnboardingStore((s) => s.weightGoalKg);
  const maintainWeightGoal = useOnboardingStore((s) => s.maintainWeightGoal);

  const months = !maintainWeightGoal ? estimateMonthsAtFiveKgPerMonth(weightGoalKg) : null;

  return (
    <OnboardingLayout
      navigation={navigation}
      routeName="OnboardingTimeline"
      title="Bu hedefe ne kadar sürede ulaşmak istersin?"
      subtitle={timeline ? undefined : 'Bir seçenek seç'}
      onNext={() => navigation.navigate('OnboardingProfile')}
      nextDisabled={!timeline}
    >
      {TIMELINE_OPTIONS.map((opt) => (
        <OptionButton
          key={opt.id}
          label={opt.label}
          selected={timeline === opt.id}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTimeline(opt.id);
          }}
        />
      ))}
      {!maintainWeightGoal && months != null && weightGoalKg > 0 ? (
        <View style={[styles.hintBox, { backgroundColor: c.skyHintBg }]}>
          <Text style={[styles.hintText, { color: c.skyHintText }]}>
            Bu hedefe yaklaşık <Text style={styles.hintBold}>{months}</Text> ayda ulaşabilirsin (yaklaşık
            ayda 5 kg).
          </Text>
        </View>
      ) : null}
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  hintBox: { marginTop: 16, borderRadius: 16, padding: 16 },
  hintText: { textAlign: 'center', fontSize: 16, lineHeight: 24 },
  hintBold: { fontWeight: '700' },
});
