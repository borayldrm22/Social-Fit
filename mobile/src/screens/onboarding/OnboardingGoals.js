import React, { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import MultiSelectGrid from '../../components/onboarding/MultiSelectGrid';
import { GOAL_OPTIONS } from '../../onboarding/constants';
import { useOnboardingStore } from '../../store/onboardingStore';

export default function OnboardingGoals({ navigation }) {
  const goals = useOnboardingStore((s) => s.goals);
  const setGoals = useOnboardingStore((s) => s.setGoals);

  const onToggle = useCallback(
    (id) => {
      const set = new Set(goals);
      if (set.has(id)) {
        set.delete(id);
        setGoals([...set]);
        return;
      }
      if (set.size >= 3) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      set.add(id);
      setGoals([...set]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [goals, setGoals],
  );

  return (
    <OnboardingLayout
      navigation={navigation}
      routeName="OnboardingGoals"
      title="Hedeflerini seçerek başlayalım"
      subtitle="En fazla 3 hedef seç"
      onNext={() => navigation.navigate('OnboardingProfile')}
      nextDisabled={goals.length < 1}
    >
      <MultiSelectGrid options={GOAL_OPTIONS} selectedIds={goals} onToggle={onToggle} columns={2} />
    </OnboardingLayout>
  );
}
