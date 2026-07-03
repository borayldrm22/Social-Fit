import React from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useOnboardingTheme, ob } from '../../components/onboarding/onboardingStyles';

export default function OnboardingWelcome({ navigation }) {
  const setUsername = useOnboardingStore((s) => s.setUsername);
  const saved = useOnboardingStore((s) => s.username);
  const { c } = useOnboardingTheme();
  const { control, handleSubmit, watch } = useForm({
    defaultValues: { username: saved || '' },
    mode: 'onChange',
  });
  const v = watch('username');
  const ok = (v || '').trim().length >= 2;

  const onSubmit = ({ username: u }) => {
    setUsername(u.trim());
    navigation.navigate('OnboardingProfile');
  };

  return (
    <OnboardingLayout
      navigation={navigation}
      routeName="OnboardingWelcome"
      title="Seni tanımak istiyoruz 👋"
      subtitle="Planını hazırlamak için birkaç kısa soru."
      onNext={handleSubmit(onSubmit)}
      nextLabel="Başlayalım →"
      nextDisabled={!ok}
      canGoBack={false}
    >
      <Text style={[styles.hint, { color: c.textSecondary }]}>Adın ve soyadın</Text>
      <Controller
        control={control}
        name="username"
        rules={{ required: true, minLength: 2, maxLength: 40 }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[
              ob.input,
              {
                borderColor: c.border,
                backgroundColor: c.inputBg,
                color: c.text,
              },
            ]}
            placeholder="Adın Soyadın"
            placeholderTextColor="#94a3b8"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            autoCapitalize="words"
            autoCorrect={false}
            accessibilityLabel="Ad Soyad"
          />
        )}
      />
      <View style={{ height: 32 }} />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
});
