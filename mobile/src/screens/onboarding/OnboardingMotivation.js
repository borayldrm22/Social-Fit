import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated as RNAnimated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingProgress from '../../components/onboarding/ProgressBar';
import { useOnboardingStore } from '../../store/onboardingStore';
import { BRAND } from '../../components/onboarding/onboardingStyles';

export default function OnboardingMotivation({ navigation }) {
  const username = useOnboardingStore((s) => s.username);
  const name = (username || 'Sosyal Fit').toUpperCase();
  const fade = useRef(new RNAnimated.Value(0)).current;
  const scale = useRef(new RNAnimated.Value(0.92)).current;

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
      RNAnimated.spring(scale, { toValue: 1, friction: 7, useNativeDriver: true }),
    ]).start();
  }, [fade, scale]);

  return (
    <LinearGradient colors={['#0f172a', '#14532d', '#0c4a6e']} style={styles.flex1}>
      <SafeAreaView style={styles.flex1} edges={['top', 'bottom']}>
        <OnboardingProgress
          step={3}
          total={13}
          onBack={() => navigation.goBack()}
          canGoBack
          onDarkBackground
        />
        <RNAnimated.View
          style={{ flex: 1, opacity: fade, transform: [{ scale }], paddingHorizontal: 24 }}
        >
          <View style={styles.centerCol}>
            <Text style={styles.bodyText}>
              Aklına koyduğun her şeyi başarabilirsin. Vücudun ve iraden sandığından çok daha güçlü.
            </Text>
            <Text style={styles.nameText}>Hazır mısın, {name}?</Text>
            <View style={styles.dotsRow}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  style={[styles.dot, { opacity: 0.4 + (i % 3) * 0.2, backgroundColor: BRAND.primary }]}
                />
              ))}
            </View>
          </View>
          <Pressable
            onPress={() => navigation.navigate('OnboardingChallenge')}
            style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.9 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Evet devam"
          >
            <Text style={styles.ctaText}>Evet, devam →</Text>
          </Pressable>
        </RNAnimated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  centerCol: { flex: 1, justifyContent: 'center' },
  bodyText: {
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 28,
    color: 'rgba(255,255,255,0.9)',
  },
  nameText: { textAlign: 'center', fontSize: 24, fontWeight: '700', color: '#fff' },
  dotsRow: {
    marginTop: 32,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cta: {
    marginBottom: 8,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: BRAND.primary,
    paddingVertical: 16,
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
