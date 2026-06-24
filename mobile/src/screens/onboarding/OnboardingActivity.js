import React from 'react';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import OptionButton from '../../components/onboarding/OptionButton';
import { ACTIVITY_OPTIONS } from '../../onboarding/constants';
import { useOnboardingStore } from '../../store/onboardingStore';
import * as Haptics from 'expo-haptics';

export default function OnboardingActivity({ navigation }) {
  const activityLevel = useOnboardingStore((s) => s.activityLevel);
  const setActivityLevel = useOnboardingStore((s) => s.setActivityLevel);

  return (
    <OnboardingLayout
      navigation={navigation}
      routeName="OnboardingActivity"
      title="Aktivite düzeyin ne durumda?"
      subtitle="Günlük kalori hesabı için kullanılır"
      onNext={() => navigation.navigate('OnboardingIdentity')}
      nextDisabled={!activityLevel}
    >
      {ACTIVITY_OPTIONS.map((opt) => (
        <OptionButton
          key={opt.id}
          label={`${opt.emoji}  ${opt.label}`}
          selected={activityLevel === opt.id}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActivityLevel(opt.id);
          }}
          minHeight={64}
        />
      ))}
    </OnboardingLayout>
  );
}
