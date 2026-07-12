// ChangePasswordScreen.js — SocialFit · Şifre değiştir
// Backend: PATCH /api/users/me/password { currentPassword, newPassword }
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApi } from '../../api/client';
import { colors, font, shadow, radius } from '../../theme/socialFitTheme';

export default function ChangePasswordScreen({ navigation }) {
  const api = useApi();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const save = useCallback(async () => {
    if (!current) { Alert.alert('Eksik', 'Mevcut şifreni gir.'); return; }
    if (next.length < 6) { Alert.alert('Zayıf şifre', 'Yeni şifre en az 6 karakter olmalı.'); return; }
    if (next !== confirm) { Alert.alert('Eşleşmiyor', 'Yeni şifre ile tekrarı aynı değil.'); return; }
    setSaving(true);
    try {
      await api.patch('/api/users/me/password', { currentPassword: current, newPassword: next });
      Alert.alert('Başarılı', 'Şifren güncellendi.');
      navigation.goBack();
    } catch (e) {
      setSaving(false);
      Alert.alert('Hata', e?.message || 'Şifre güncellenemedi.');
    }
  }, [current, next, confirm, api, navigation]);

  const canSave = !!current && next.length >= 6 && next === confirm && !saving;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Mevcut şifre</Text>
        <TextInput style={styles.input} value={current} onChangeText={setCurrent} secureTextEntry placeholder="••••••" placeholderTextColor={colors.faint} autoCapitalize="none" />

        <Text style={styles.label}>Yeni şifre</Text>
        <TextInput style={styles.input} value={next} onChangeText={setNext} secureTextEntry placeholder="En az 6 karakter" placeholderTextColor={colors.faint} autoCapitalize="none" />

        <Text style={styles.label}>Yeni şifre (tekrar)</Text>
        <TextInput style={styles.input} value={confirm} onChangeText={setConfirm} secureTextEntry placeholder="Yeni şifreyi tekrar gir" placeholderTextColor={colors.faint} autoCapitalize="none" />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity style={[styles.saveBtn, !canSave && { opacity: 0.5 }]} onPress={save} disabled={!canSave} activeOpacity={0.9}>
          <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor…' : 'Şifreyi Güncelle'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  label: { fontFamily: font.bodyBold, fontSize: 13, color: colors.muted, marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.field, paddingHorizontal: 14, paddingVertical: 12, fontFamily: font.body, fontSize: 15, color: colors.ink },
  footer: { paddingHorizontal: 16, paddingTop: 10, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 15, alignItems: 'center', ...shadow.cta },
  saveBtnText: { fontFamily: font.bodyBold, fontSize: 16, color: colors.white },
});
