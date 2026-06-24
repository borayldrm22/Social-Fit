import React, { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import MultiSelectGrid from '../../components/onboarding/MultiSelectGrid';
import { IDENTITY_OPTIONS } from '../../onboarding/constants';
import { useOnboardingStore } from '../../store/onboardingStore';

export default function OnboardingIdentity({ navigation }) {
  const identityStatements = useOnboardingStore((s) => s.identityStatements);
  const setIdentityStatements = useOnboardingStore((s) => s.setIdentityStatements);

  const onToggle = useCallback(
    (id) => {
      const set = new Set(identityStatements);
      if (set.has(id)) {
        set.delete(id);
        setIdentityStatements([...set]);
        return;
      }
      if (set.size >= 3) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      set.add(id);
      setIdentityStatements([...set]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [identityStatements, setIdentityStatements],
  );

  return (
    <OnboardingLayout
      navigation={navigation}
      routeName="OnboardingIdentity"
      title="Seni en iyi tanımlayan cümle hangisi?"
      subtitle="Tam 3 madde seç"
      onNext={() => navigation.navigate('OnboardingChannels')}
      nextDisabled={identityStatements.length < 3}
    >
      <MultiSelectGrid options={IDENTITY_OPTIONS} selectedIds={identityStatements} onToggle={onToggle} columns={1} />
    </OnboardingLayout>
  );
}
