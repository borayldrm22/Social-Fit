import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated as RNAnimated, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingProgress from '../../components/onboarding/ProgressBar';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useOnboardingTheme, BRAND } from '../../components/onboarding/onboardingStyles';

export default function OnboardingCommitment({ navigation }) {
  const { c } = useOnboardingTheme();
  const runNutritionPlan = useOnboardingStore((s) => s.runNutritionPlan);
  const scale = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(scale, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        RNAnimated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);

  const go = () => {
    runNutritionPlan();
    navigation.navigate('OnboardingResult');
  };

  return (
    <SafeAreaView style={[styles.flex1, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
      <OnboardingProgress step={11} total={13} onBack={() => navigation.goBack()} canGoBack />
      <View style={styles.centerBlock}>
        <Text style={[styles.title, { color: c.text }]}>
          Her gün sadece 5 dakikanı ayırarak sağlıklı yaşam yolculuğunu bizlerle paylaşmaya hazır mısın?
        </Text>
        <RNAnimated.View style={{ marginBottom: 40, alignItems: 'center', transform: [{ scale }] }}>
          <Text style={styles.emoji}>✅</Text>
        </RNAnimated.View>
      </View>
      <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.footerBg }]}>
        <Pressable
          onPress={go}
          style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.9 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Hazırım"
        >
          <Text style={styles.ctaText}>✅ Hazırım!</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  centerBlock: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: {
    marginBottom: 40,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 34,
  },
  emoji: { fontSize: 72 },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  cta: {
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: BRAND.primary,
    paddingVertical: 16,
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
