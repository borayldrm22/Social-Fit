import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useOnboarding } from '../../context/OnboardingContext';
import { useApi } from '../../api/client';

const TOTAL_STEPS = 4;
const CURRENT_STEP = 3;
const SLIDER_MIN = 1200;
const SLIDER_MAX = 4000;
const SLIDER_STEP = 50;
const FALLBACK_CALORIE = 2000;

function roundToStep(value, step) {
  return Math.round(value / step) * step;
}

export default function OnboardingStep3({ navigation, route }) {
  const ctx = useOnboarding();
  const api = useApi();
  const params = route.params || {};
  const weightKg = params.weightKg ?? ctx.weightKg;
  const heightCm = params.heightCm ?? ctx.heightCm;
  const age = params.age ?? ctx.age;
  const { setData } = ctx;

  const [loading, setLoading] = useState(true);
  const [calculated, setCalculated] = useState(FALLBACK_CALORIE);
  const [sliderValue, setSliderValue] = useState(FALLBACK_CALORIE);
  const [error, setError] = useState(null);
  const skipTriggered = useRef(false);

  console.log('[Step3] mount/render — weightKg:', weightKg, 'heightCm:', heightCm, 'age:', age);

  useEffect(() => {
    const hasRequired = weightKg != null && heightCm != null && age != null;
    console.log('[Step3] useEffect — hasRequired:', hasRequired);
    if (!hasRequired) {
      if (skipTriggered.current) return;
      skipTriggered.current = true;
      console.log('[Step3] missing values, skipping to Step4');
      setData({ dailyCalorieGoal: FALLBACK_CALORIE });
      navigation.replace('OnboardingStep4');
      return;
    }

    const payload = {
      weightKg: parseFloat(weightKg),
      heightCm: parseFloat(heightCm),
      age: parseInt(age, 10),
      gender: 'male',
      activityLevel: 'moderate',
    };
    console.log('[Step3] calling /api/tools/calorie with:', payload);

    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .post('/api/tools/calorie', payload)
      .then((data) => {
        if (cancelled) return;
        console.log('[Step3] calorie API response:', data);
        const value = data.dailyCalorie != null ? roundToStep(data.dailyCalorie, SLIDER_STEP) : FALLBACK_CALORIE;
        const clamped = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, value));
        setCalculated(clamped);
        setSliderValue(clamped);
      })
      .catch((err) => {
        if (cancelled) return;
        console.log('[Step3] calorie API FAILED:', err?.message || err);
        setCalculated(FALLBACK_CALORIE);
        setSliderValue(FALLBACK_CALORIE);
        setError('Kalori hesaplanamadı. Varsayılan değer kullanılıyor.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [weightKg, heightCm, age]);

  const handleContinue = () => {
    const value = roundToStep(sliderValue, SLIDER_STEP);
    setData({ dailyCalorieGoal: value });
    navigation.navigate('OnboardingStep4');
  };

  const handleSkip = () => {
    const value = calculated != null ? calculated : FALLBACK_CALORIE;
    setData({ dailyCalorieGoal: value });
    navigation.navigate('OnboardingStep4');
  };

  const handleSliderChange = (v) => {
    setSliderValue(roundToStep(v, SLIDER_STEP));
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2d6a4f" />
        <Text style={styles.loadingText}>Kalori hedefi hesaplanıyor...</Text>
      </View>
    );
  }

  const displayValue = roundToStep(sliderValue, SLIDER_STEP);

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

      <View style={styles.content}>
        <Text style={styles.title}>Günlük kalori hedefiniz</Text>
        <View style={styles.numberWrap}>
          <Text style={styles.numberValue}>{displayValue}</Text>
          <Text style={styles.numberUnit}>kcal</Text>
        </View>
        <Text style={styles.subtitle}>
          Bu değeri istediğiniz zaman profilinizden değiştirebilirsiniz
        </Text>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.sliderWrap}>
          <Slider
            style={styles.slider}
            minimumValue={SLIDER_MIN}
            maximumValue={SLIDER_MAX}
            step={SLIDER_STEP}
            value={sliderValue}
            onValueChange={handleSliderChange}
            minimumTrackTintColor="#2d6a4f"
            maximumTrackTintColor="#e5e7eb"
            thumbTintColor="#2d6a4f"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>{SLIDER_MIN}</Text>
            <Text style={styles.sliderLabel}>{SLIDER_MAX}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleContinue} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Devam Et</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
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
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  numberWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  numberValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#2d6a4f',
  },
  numberUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    textAlign: 'center',
  },
  sliderWrap: { marginBottom: 32 },
  slider: { width: '100%', height: 40 },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: -4,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  button: {
    backgroundColor: '#2d6a4f',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
