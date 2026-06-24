import React from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingProgress from './ProgressBar';
import { ONBOARDING_ROUTE_STEP, ONBOARDING_TOTAL_STEPS } from '../../onboarding/constants';
import { useOnboardingTheme, ob, BRAND } from './onboardingStyles';

export default function OnboardingLayout({
  navigation,
  routeName,
  title,
  subtitle,
  children,
  onNext,
  nextLabel = 'Devam',
  nextDisabled = false,
  loading = false,
  scroll = true,
  canGoBack,
}) {
  const { c } = useOnboardingTheme();
  const step = ONBOARDING_ROUTE_STEP[routeName] ?? 1;
  const showBack = canGoBack !== undefined ? canGoBack : step > 1;

  const body = (
    <>
      {title ? (
        <Text style={[ob.title, { color: c.text }]}>{title}</Text>
      ) : null}
      {subtitle ? (
        <Text style={[ob.subtitle, { color: c.textSecondary }]}>{subtitle}</Text>
      ) : null}
      {children}
    </>
  );

  return (
    <SafeAreaView style={[ob.flex1, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
      <OnboardingProgress
        step={step}
        total={ONBOARDING_TOTAL_STEPS}
        onBack={() => navigation.goBack()}
        canGoBack={showBack}
      />
      <KeyboardAvoidingView
        style={ob.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={ob.flex1}>
          {scroll ? (
            <ScrollView
              style={[ob.flex1, ob.px16]}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={ob.scrollPad}
              showsVerticalScrollIndicator={false}
            >
              {body}
            </ScrollView>
          ) : (
            <View style={[ob.flex1, ob.px16]}>{body}</View>
          )}
        </View>
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: c.border,
            backgroundColor: c.footerBg,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 8,
          }}
        >
          <Pressable
            onPress={onNext}
            disabled={nextDisabled || loading}
            accessibilityRole="button"
            accessibilityLabel={nextLabel}
            style={[
              ob.cta,
              { backgroundColor: nextDisabled || loading ? c.ctaDisabled : BRAND.primary },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={ob.ctaText}>{nextLabel}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
