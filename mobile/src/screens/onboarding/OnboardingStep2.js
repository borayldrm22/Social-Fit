import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Keyboard } from 'react-native';
import { useOnboarding } from '../../context/OnboardingContext';

const TOTAL_STEPS = 4;
const CURRENT_STEP = 2;

const AGE_MIN = 10;
const AGE_MAX = 120;
const HEIGHT_MIN = 100;
const HEIGHT_MAX = 250;
const WEIGHT_MIN = 30;
const WEIGHT_MAX = 300;

export default function OnboardingStep2({ navigation }) {
  const { age: initAge, heightCm: initH, weightKg: initW, setData } = useOnboarding();
  const [age, setAge] = useState(initAge != null ? String(initAge) : '');
  const [heightCm, setHeightCm] = useState(initH != null ? String(initH) : '');
  const [weightKg, setWeightKg] = useState(initW != null ? String(initW) : '');

  const ageNum = age.trim() === '' ? null : parseInt(age.trim(), 10);
  const heightNum = heightCm.trim() === '' ? null : parseFloat(heightCm.trim().replace(',', '.'));
  const weightNum = weightKg.trim() === '' ? null : parseFloat(weightKg.trim().replace(',', '.'));

  console.log('[Step2] age:', JSON.stringify(age), '→', ageNum, '| height:', JSON.stringify(heightCm), '→', heightNum, '| weight:', JSON.stringify(weightKg), '→', weightNum);

  const isValid = useMemo(() => {
    const v =
      ageNum != null && !isNaN(ageNum) && ageNum >= AGE_MIN && ageNum <= AGE_MAX &&
      heightNum != null && !isNaN(heightNum) && heightNum >= HEIGHT_MIN && heightNum <= HEIGHT_MAX &&
      weightNum != null && !isNaN(weightNum) && weightNum >= WEIGHT_MIN && weightNum <= WEIGHT_MAX;
    console.log('[Step2] isValid:', v);
    return v;
  }, [ageNum, heightNum, weightNum]);

  const handleContinue = () => {
    Keyboard.dismiss();
    if (!isValid) {
      console.log('[Step2] handleContinue blocked — isValid is false');
      return;
    }
    const parsed = { age: ageNum, heightCm: heightNum, weightKg: weightNum };
    console.log('[Step2] navigating with parsed values:', parsed);
    setData(parsed);
    navigation.navigate('OnboardingStep3', parsed);
  };

  const handleSkip = () => {
    navigation.navigate('OnboardingStep4');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(CURRENT_STEP / TOTAL_STEPS) * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            Adım {CURRENT_STEP} / {TOTAL_STEPS}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.skipLink}
          onPress={handleSkip}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.skipText}>Atla</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag">
        <Text style={styles.title}>Biraz kendinizden bahsedin</Text>
        <Text style={styles.subtitle}>Verileriniz yalnızca size özel hesaplamalar için kullanılır</Text>

        <Text style={styles.label}>Yaş</Text>
        <TextInput
          style={styles.input}
          placeholder="örn. 25"
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Boy</Text>
        <TextInput
          style={styles.input}
          placeholder="örn. 170 cm"
          value={heightCm}
          onChangeText={setHeightCm}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Kilo</Text>
        <TextInput
          style={styles.input}
          placeholder="örn. 70 kg"
          value={weightKg}
          onChangeText={setWeightKg}
          keyboardType="decimal-pad"
        />

        <Text style={styles.kvkkNote}>
          Sağlık verileriniz KVKK kapsamında korunmaktadır. Devam ederek onay vermiş olursunuz.
        </Text>

        <TouchableOpacity
          style={[styles.button, !isValid && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!isValid}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Devam Et</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressWrap: { flex: 1, marginRight: 16 },
  progressTrack: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2d6a4f',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
  },
  skipLink: { paddingVertical: 4 },
  skipText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 48 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: '#6b7280',
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  kvkkNote: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#2d6a4f',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
