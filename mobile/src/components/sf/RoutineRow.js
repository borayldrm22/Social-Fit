// RoutineRow.js — SocialFit · Tek rutin satırı (paylaşılan)
// Sol emoji · Orta başlık + hedef · Sağ daire checkbox.
// Dokun → optimistic tik → PATCH /api/routines/:id/complete → hata olursa geri al.
// Tamamlanınca (awarded>0) global +yıldız kutlaması (StarRewardContext).
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../api/client';
import { useStarReward } from '../../context/StarRewardContext';
import { colors, font } from '../../theme/socialFitTheme';

function goalLabel(routine) {
  const freq = routine.frequency === 'weekly' ? 'Haftada' : 'Günde';
  const unit = (routine.unit || '').trim();
  if (!unit && (routine.target ?? 1) <= 1) return freq === 'Haftada' ? 'Her hafta' : 'Her gün';
  if (!unit) return `${freq} ${routine.target}`;
  return `${freq} ${routine.target} ${unit}`;
}

export default function RoutineRow({ routine, onChange, onDelete, style }) {
  const api = useApi();
  const { celebrate } = useStarReward();
  const [done, setDone] = useState(!!routine.doneToday);
  const [busy, setBusy] = useState(false);

  // Liste yeniden çekildiğinde (focus/pull) prop'tan senkronla — ama isteğin ortasında dokunma.
  useEffect(() => { if (!busy) setDone(!!routine.doneToday); }, [routine.id, routine.doneToday, busy]);

  const toggle = useCallback(async () => {
    if (busy) return;
    const next = !done;
    setDone(next);                       // optimistic tik
    onChange?.(routine.id, next);        // ebeveyn sayaç güncellemesi (optimistic)
    Haptics.impactAsync(next ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setBusy(true);
    try {
      const res = await api.patch(`/api/routines/${routine.id}/complete`);
      const serverDone = !!res.doneToday;
      if (serverDone !== next) { setDone(serverDone); onChange?.(routine.id, serverDone); }
      if (res.awarded > 0) celebrate({ points: res.awarded }); // awarded=0 iken celebrate zaten no-op
    } catch (e) {
      setDone(!next);                     // geri al
      onChange?.(routine.id, !next);
    } finally {
      setBusy(false);
    }
  }, [busy, done, routine.id, api, celebrate, onChange]);

  return (
    <View style={[styles.row, style]}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{routine.icon || '✅'}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.title, done && styles.titleDone]} numberOfLines={1}>{routine.title}</Text>
        <Text style={styles.goal} numberOfLines={1}>{goalLabel(routine)}</Text>
      </View>
      {onDelete ? (
        <TouchableOpacity onPress={() => onDelete(routine)} hitSlop={8} style={styles.trash} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={18} color={colors.faint} />
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity onPress={toggle} activeOpacity={0.8} hitSlop={8} disabled={busy}>
        <View style={[styles.check, done && styles.checkDone]}>
          {done ? <Ionicons name="checkmark" size={18} color={colors.white} /> : null}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  iconWrap: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  title: { fontFamily: font.bodyBold, fontSize: 15, color: colors.ink },
  titleDone: { color: colors.muted, textDecorationLine: 'line-through' },
  goal: { fontSize: 12.5, color: colors.faint, fontFamily: font.body, marginTop: 2 },
  trash: { padding: 4, marginRight: 2 },
  check: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  checkDone: { backgroundColor: colors.primary, borderColor: colors.primary },
});
