import React from 'react';
import { View, StyleSheet } from 'react-native';
import OptionButton from './OptionButton';

export default function MultiSelectGrid({ options, selectedIds, onToggle, columns = 1 }) {
  const rows = [];
  for (let i = 0; i < options.length; i += columns) {
    rows.push(options.slice(i, i + columns));
  }

  return (
    <View style={styles.wFull}>
      {rows.map((row, ri) => (
        <View key={ri} style={[styles.wFull, styles.row, columns > 1 && styles.gap8]}>
          {row.map((opt) => {
            const selected = selectedIds.includes(opt.id);
            return (
              <View
                key={opt.id}
                style={columns > 1 ? [styles.flex1, styles.mb8] : styles.wFull}
              >
                <OptionButton
                  label={opt.label}
                  emoji={opt.emoji}
                  selected={selected}
                  onPress={() => onToggle(opt.id)}
                  minHeight={columns > 1 ? 72 : 56}
                />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wFull: { width: '100%' },
  flex1: { flex: 1 },
  row: { flexDirection: 'row' },
  gap8: { gap: 8 },
  mb8: { marginBottom: 8 },
});
