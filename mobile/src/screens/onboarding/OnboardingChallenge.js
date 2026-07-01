import React, { useCallback } from 'react';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import MultiSelectGrid from '../../components/onboarding/MultiSelectGrid';
import { CHALLENGE_OPTIONS } from '../../onboarding/constants';
import { useOnboardingStore } from '../../store/onboardingStore';
import * as Haptics from 'expo-haptics';

export default function OnboardingChallenge({ navigation }) {
  const challenges = useOnboardingStore((s) => s.challenges);
  const setChallenges = useOnboardingStore((s) => s.setChallenges);

  const onToggle = useCallback(
    (id) => {
      const set = new Set(challenges);
      if (set.has(id)) set.delete(id);
      else {
        set.add(id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setChallenges([...set]);
    },
    [challenges, setChallenges],
  );

  return (
    <OnboardingLayout
      navigation={navigation}
      routeName="OnboardingChallenge"
      title="Sağlığınla ilgili en çok zorlandığın konu nedir?"
      subtitle="Birden fazla seçebilirsin"
      onNext={() => navigation.navigate('OnboardingChannels')}
      nextDisabled={challenges.length < 1}
    >
      <MultiSelectGrid options={CHALLENGE_OPTIONS} selectedIds={challenges} onToggle={onToggle} columns={1} />
    </OnboardingLayout>
  );
}
