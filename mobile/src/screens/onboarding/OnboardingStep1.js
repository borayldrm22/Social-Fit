import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useOnboarding } from '../../context/OnboardingContext';

const GOALS = [
  { value: 'lose_weight', title: 'Kilo vermek', subtitle: 'Yağ yakma odaklı plan', color: '#2d6a4f' },
  { value: 'gain_muscle', title: 'Kas yapmak', subtitle: 'Protein ve antrenman takibi', color: '#1e40af' },
  { value: 'eat_healthy', title: 'Sağlıklı beslenmek', subtitle: 'Dengeli beslenme alışkanlıkları', color: '#059669' },
  { value: 'stay_active', title: 'Aktif kalmak', subtitle: 'Günlük hareket hedefleri', color: '#7c3aed' },
];

const TOTAL_STEPS = 4;
const CURRENT_STEP = 1;

export default function OnboardingStep1({ navigation }) {
  const { goal, setData } = useOnboarding();
  const [selected, setSelected] = useState(goal || null);

  const handleContinue = () => {
    setData({ goal: selected });
    navigation.navigate('OnboardingStep2');
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(CURRENT_STEP / TOTAL_STEPS) * 100}%` }]} />
        </View>
        <Text style={styles.progressLabel}>
          Adım {CURRENT_STEP} / {TOTAL_STEPS}
        </Text>
      </View>

      <Text style={styles.title}>Hedefin ne?</Text>
      <Text style={styles.subtitle}>Sana özel bir deneyim hazırlayalım</Text>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.cards}>
          {GOALS.map((g) => (
            <TouchableOpacity
              key={g.value}
              style={[styles.card, selected === g.value && styles.cardSelected]}
              onPress={() => setSelected(g.value)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconPlaceholder, { backgroundColor: g.color }]} />
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, selected === g.value && styles.cardTitleSelected]}>
                  {g.title}
                </Text>
                <Text style={[styles.cardSubtitle, selected === g.value && styles.cardSubtitleSelected]}>
                  {g.subtitle}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, !selected && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!selected}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Devam Et</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
  },
  progressWrap: {
    marginBottom: 28,
  },
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
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  cards: {},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  cardSelected: {
    borderColor: '#2d6a4f',
    backgroundColor: '#f0fdf4',
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardTitleSelected: {
    color: '#166534',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  cardSubtitleSelected: {
    color: '#15803d',
  },
  button: {
    backgroundColor: '#2d6a4f',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
