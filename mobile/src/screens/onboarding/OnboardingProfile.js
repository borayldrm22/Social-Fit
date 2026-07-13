import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import OptionButton from '../../components/onboarding/OptionButton';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useOnboardingTheme, ob, BRAND } from '../../components/onboarding/onboardingStyles';
import { idealWeightRangeKg } from '../../utils/calculations';
import { parseDecimal } from '../../utils/parseDecimal';

export default function OnboardingProfile({ navigation }) {
  const { c } = useOnboardingTheme();
  const gender = useOnboardingStore((s) => s.gender);
  const age = useOnboardingStore((s) => s.age);
  const heightCm = useOnboardingStore((s) => s.heightCm);
  const currentWeightKg = useOnboardingStore((s) => s.currentWeightKg);
  const targetWeightKg = useOnboardingStore((s) => s.targetWeightKg);
  const setGender = useOnboardingStore((s) => s.setGender);
  const setAge = useOnboardingStore((s) => s.setAge);
  const setHeightCm = useOnboardingStore((s) => s.setHeightCm);
  const setCurrentWeightKg = useOnboardingStore((s) => s.setCurrentWeightKg);
  const setTargetWeightKg = useOnboardingStore((s) => s.setTargetWeightKg);

  const { control, handleSubmit, watch } = useForm({
    defaultValues: {
      age: age != null ? String(age) : '',
      heightCm: heightCm != null ? String(heightCm) : '',
      currentWeightKg: currentWeightKg != null ? String(currentWeightKg) : '',
      targetWeightKg: targetWeightKg != null ? String(targetWeightKg) : '',
    },
    mode: 'onChange',
  });

  const onSubmit = (data) => {
    // parseDecimal: TR klavyede virgüllü ondalık ("70,5") parseFloat'ta 70'e düşüyordu
    setAge(parseInt(data.age, 10));
    setHeightCm(parseDecimal(data.heightCm));
    setCurrentWeightKg(parseDecimal(data.currentWeightKg));
    setTargetWeightKg(parseDecimal(data.targetWeightKg));
    navigation.navigate('OnboardingActivity');
  };

  const a = watch('age');
  const h = watch('heightCm');
  const cw = watch('currentWeightKg');
  const tw = watch('targetWeightKg');

  const ageN = parseInt(a, 10);
  const hN = parseDecimal(h);
  const cwN = parseDecimal(cw);
  const twN = parseDecimal(tw);
  const valid =
    gender &&
    ageN >= 10 &&
    ageN <= 100 &&
    hN >= 100 &&
    hN <= 250 &&
    cwN >= 30 &&
    cwN <= 300 &&
    twN >= 30 &&
    twN <= 300;

  // Canlı BMI sağlıklı kilo aralığı önerisi (boy girilince görünür)
  const bmiRange = hN >= 100 && hN <= 250 ? idealWeightRangeKg(hN) : null;
  const weightStatus =
    bmiRange && cwN >= 30
      ? cwN < bmiRange.min
        ? 'below'
        : cwN > bmiRange.max
        ? 'above'
        : 'ideal'
      : null;

  const inputStyle = [
    ob.input,
    { borderColor: c.border, backgroundColor: c.inputBg, color: c.text },
  ];

  return (
    <OnboardingLayout
      navigation={navigation}
      routeName="OnboardingProfile"
      title="Bize biraz kendinden bahset"
      subtitle="Bu bilgiler kişisel planın için kullanılır"
      onNext={handleSubmit(onSubmit)}
      nextDisabled={!valid}
    >
      <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Cinsiyet</Text>
      <View style={styles.genderRow}>
        {[
          { id: 'male', label: 'Erkek' },
          { id: 'female', label: 'Kadın' },
          { id: 'other', label: 'Diğer' },
        ].map((g) => (
          <View key={g.id} style={styles.genderCell}>
            <OptionButton
              label={g.label}
              selected={gender === g.id}
              onPress={() => setGender(g.id)}
              minHeight={48}
            />
          </View>
        ))}
      </View>

      <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Yaş</Text>
      <Controller
        control={control}
        name="age"
        rules={{ required: true }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={inputStyle}
            placeholder="örn. 28"
            placeholderTextColor="#94a3b8"
            keyboardType="number-pad"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            accessibilityLabel="Yaş"
          />
        )}
      />

      <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Boy (cm)</Text>
      <Controller
        control={control}
        name="heightCm"
        rules={{ required: true }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={inputStyle}
            placeholder="örn. 170"
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            accessibilityLabel="Boy santimetre"
          />
        )}
      />

      <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Mevcut kilo (kg)</Text>
      <Controller
        control={control}
        name="currentWeightKg"
        rules={{ required: true }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={inputStyle}
            placeholder="örn. 75"
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            accessibilityLabel="Mevcut kilo"
          />
        )}
      />

      {bmiRange ? (
        <View style={[styles.bmiCard, { backgroundColor: c.noteBg, borderColor: c.border }]}>
          <Text style={[styles.bmiTitle, { color: c.textSecondary }]}>⚖️ Sağlıklı kilo aralığın</Text>
          <Text style={[styles.bmiRange, { color: BRAND.primary }]}>
            {bmiRange.min} – {bmiRange.max} kg
          </Text>
          {weightStatus ? (
            <Text style={[styles.bmiStatus, { color: c.textSecondary }]}>
              {weightStatus === 'ideal'
                ? 'Şu an ideal aralıktasın 🎯'
                : weightStatus === 'below'
                ? 'Şu an bu aralığın biraz altındasın'
                : 'Şu an bu aralığın biraz üzerindesin'}
            </Text>
          ) : null}
        </View>
      ) : null}

      <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Hedef kilo (kg)</Text>
      <Controller
        control={control}
        name="targetWeightKg"
        rules={{ required: true }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={inputStyle}
            placeholder="örn. 68"
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            accessibilityLabel="Hedef kilo"
          />
        )}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  genderCell: { flex: 1 },
  bmiCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16 },
  bmiTitle: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  bmiRange: { fontSize: 20, fontWeight: '800' },
  bmiStatus: { fontSize: 13, marginTop: 4 },
});
