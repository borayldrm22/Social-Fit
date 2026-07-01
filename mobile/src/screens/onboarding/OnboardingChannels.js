import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import OptionButton from '../../components/onboarding/OptionButton';
import { useOnboardingStore } from '../../store/onboardingStore';
import * as Haptics from 'expo-haptics';
import { useOnboardingTheme } from '../../components/onboarding/onboardingStyles';

export default function OnboardingChannels({ navigation }) {
  const { c } = useOnboardingTheme();
  const channelChoice = useOnboardingStore((s) => s.channelChoice);
  const setChannelChoice = useOnboardingStore((s) => s.setChannelChoice);
  const runNutritionPlan = useOnboardingStore((s) => s.runNutritionPlan);

  return (
    <OnboardingLayout
      navigation={navigation}
      routeName="OnboardingChannels"
      title="Bir kanala katıl"
      subtitle="İlgi alanına uygun toplulukları takip et."
      onNext={() => {
        runNutritionPlan();
        navigation.navigate('OnboardingResult');
      }}
      nextDisabled={!channelChoice}
    >
      <OptionButton
        label="✨ Kendi kanalını yarat"
        selected={channelChoice === 'create'}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setChannelChoice('create');
        }}
        minHeight={72}
      />
      <OptionButton
        label="🔍 Bir uzmanın kanalına katıl"
        selected={channelChoice === 'join'}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setChannelChoice('join');
        }}
        minHeight={72}
      />
      <View style={[styles.note, { backgroundColor: c.noteBg }]}>
        <Text style={[styles.noteText, { color: c.textSecondary }]}>
          İstediğin zaman ayarlardan değiştirebilirsin.
        </Text>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  note: { marginTop: 16, borderRadius: 12, padding: 12 },
  noteText: { textAlign: 'center', fontSize: 14 },
});
