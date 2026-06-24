import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingTheme, BRAND } from './onboardingStyles';

export default function OptionButton({
  label,
  sublabel,
  selected,
  onPress,
  emoji,
  accessibilityLabel,
  minHeight = 56,
}) {
  const { isDark, c } = useOnboardingTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel || label}
      style={({ pressed }) => [
        styles.row,
        {
          minHeight,
          borderColor: selected ? BRAND.primary : c.border,
          backgroundColor: selected ? c.cardSelectedBg : c.cardBg,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <View style={styles.textCol}>
        <Text
          style={[
            styles.label,
            { color: selected ? (isDark ? '#d1fae5' : '#065f46') : c.text },
          ]}
        >
          {label}
        </Text>
        {sublabel ? (
          <Text style={[styles.sub, { color: c.textMuted }]}>{sublabel}</Text>
        ) : null}
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={24} color={BRAND.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  emoji: { marginRight: 12, fontSize: 22 },
  textCol: { flex: 1, minWidth: 0 },
  label: { fontSize: 16, fontWeight: '600' },
  sub: { marginTop: 2, fontSize: 14 },
});
