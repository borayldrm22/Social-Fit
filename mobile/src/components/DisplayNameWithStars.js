import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Displays displayName with star points next to it (e.g. "Nilsu Şahin ★ 42").
 * Use wherever usernames appear so star points are visible per README.
 */
export default function DisplayNameWithStars({ displayName, starPoints, nameStyle, style }) {
  const name = displayName || 'Kullanıcı';
  const points = starPoints ?? 0;

  return (
    <View style={[styles.wrap, style]}>
      <Text style={[styles.name, nameStyle]} numberOfLines={1}>
        {name}
      </Text>
      <View style={styles.starRow}>
        <Ionicons name="star" size={12} color="#f59e0b" style={styles.starIcon} />
        <Text style={styles.points}>{points}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  name: { fontWeight: '600', fontSize: 16, color: '#111827' },
  starRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 6 },
  starIcon: { marginRight: 2 },
  points: { fontSize: 12, color: '#b45309', fontWeight: '600' },
});
