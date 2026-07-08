// AddRoutineScreen.js — SocialFit · Yeni rutin ekle
// Hazır şablon (ROUTINE_TEMPLATES) ile hızlı doldur veya elle gir.
// Backend: POST /api/routines { title, icon, target, unit, frequency }
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApi } from '../../api/client';
import { colors, font, shadow, radius } from '../../theme/socialFitTheme';
import { ROUTINE_TEMPLATES } from '../../onboarding/constants';

const EMOJIS = ['💧', '📖', '👟', '🧘', '💪', '😴', '🥗', '🏃', '🚭', '☕', '🧴', '📝', '🙏', '🚶', '🍎', '💊'];
const FREQ = [{ key: 'daily', label: 'Günlük' }, { key: 'weekly', label: 'Haftalık' }];

export default function AddRoutineScreen({ navigation }) {
  const api = useApi();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('💧');
  const [target, setTarget] = useState('1');
  const [unit, setUnit] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [saving, setSaving] = useState(false);

  const applyTemplate = useCallback((t) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTitle(t.title);
    setIcon(t.icon);
    setTarget(String(t.target ?? 1));
    setUnit(t.unit || '');
    setFrequency('daily');
  }, []);

  const save = useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed) { Alert.alert('Eksik', 'Rutin başlığı gerekli.'); return; }
    const targetNum = Math.max(1, Math.round(Number(String(target).replace(',', '.')) || 1));
    setSaving(true);
    try {
      // POST ham rutin döner (doneToday yok) — liste focus'ta yeniden çekilir, bu yüzden optimistic eklemiyoruz.
      await api.post('/api/routines', { title: trimmed, icon, target: targetNum, unit: unit.trim(), frequency });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      navigation.goBack();
    } catch (e) {
      setSaving(false);
      Alert.alert('Hata', 'Rutin kaydedilemedi. Lütfen tekrar dene.');
    }
  }, [title, icon, target, unit, frequency, api, navigation]);

  const canSave = !!title.trim() && !saving;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Rutin</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Hazır şablonlar</Text>
        <View style={styles.templateWrap}>
          {ROUTINE_TEMPLATES.map((t) => (
            <TouchableOpacity key={t.id} style={styles.templateChip} onPress={() => applyTemplate(t)} activeOpacity={0.8}>
              <Text style={styles.templateEmoji}>{t.icon}</Text>
              <Text style={styles.templateText}>{t.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Başlık</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Ör. Su iç"
          placeholderTextColor={colors.faint}
          maxLength={40}
        />

        <Text style={styles.sectionLabel}>Simge</Text>
        <View style={styles.emojiWrap}>
          {EMOJIS.map((e) => (
            <TouchableOpacity key={e} onPress={() => setIcon(e)} style={[styles.emojiBtn, icon === e && styles.emojiBtnActive]} activeOpacity={0.8}>
              <Text style={styles.emojiGlyph}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Hedef</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput
            style={[styles.input, { width: 92, textAlign: 'center' }]}
            value={target}
            onChangeText={(t) => setTarget(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="1"
            placeholderTextColor={colors.faint}
            maxLength={6}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={unit}
            onChangeText={setUnit}
            placeholder="bardak / sayfa / adım (opsiyonel)"
            placeholderTextColor={colors.faint}
            maxLength={16}
          />
        </View>

        <Text style={styles.sectionLabel}>Sıklık</Text>
        <View style={styles.freqWrap}>
          {FREQ.map((f) => (
            <TouchableOpacity key={f.key} onPress={() => setFrequency(f.key)} style={[styles.freqBtn, frequency === f.key && styles.freqBtnActive]} activeOpacity={0.85}>
              <Text style={[styles.freqText, frequency === f.key && styles.freqTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]} onPress={save} disabled={!canSave} activeOpacity={0.9}>
          <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor…' : 'Rutini Kaydet'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  iconBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: font.displayBold, fontSize: 18, color: colors.ink },
  sectionLabel: { fontFamily: font.bodyBold, fontSize: 13, color: colors.muted, marginTop: 18, marginBottom: 8 },
  templateWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  templateChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  templateEmoji: { fontSize: 15 },
  templateText: { fontFamily: font.bodyBold, fontSize: 13, color: colors.text },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.field, paddingHorizontal: 14, paddingVertical: 12, fontFamily: font.body, fontSize: 15, color: colors.ink },
  emojiWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: { width: 46, height: 46, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  emojiBtnActive: { borderColor: colors.primary, backgroundColor: colors.mint, borderWidth: 2 },
  emojiGlyph: { fontSize: 22 },
  freqWrap: { flexDirection: 'row', gap: 10 },
  freqBtn: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  freqBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  freqText: { fontFamily: font.bodyBold, fontSize: 14, color: colors.text },
  freqTextActive: { color: colors.white },
  footer: { paddingHorizontal: 16, paddingTop: 10, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 15, alignItems: 'center', ...shadow.cta },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontFamily: font.bodyBold, fontSize: 16, color: colors.white },
});
