// PersonalInfoScreen.js — SocialFit · Kişisel Bilgiler (ad, kullanıcı adı, telefon)
// Email salt-okunur (buradan değiştirilemez). Backend: GET /api/users/me, PATCH /api/users/me.
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../../api/client';
import { colors, font, shadow, radius } from '../../theme/socialFitTheme';

export default function PersonalInfoScreen({ navigation }) {
  const api = useApi();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    api.get('/api/users/me').then((me) => {
      if (!active) return;
      setEmail(me?.email || '');
      setDisplayName(me?.profile?.displayName || '');
      setUsername(me?.profile?.username || '');
      setPhone(me?.profile?.phone || '');
      setLoading(false);
    }).catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [api]));

  const save = useCallback(async () => {
    const body = { displayName: displayName.trim(), phone: phone.trim() };
    const uname = username.trim();
    if (uname) body.username = uname;
    setSaving(true);
    try {
      await api.patch('/api/users/me', body);
      Alert.alert('Kaydedildi', 'Bilgilerin güncellendi.');
      navigation.goBack();
    } catch (e) {
      setSaving(false);
      Alert.alert('Hata', e?.message || 'Kaydedilemedi.');
    }
  }, [displayName, username, phone, api, navigation]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Görünen ad</Text>
        <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Adın" placeholderTextColor={colors.faint} maxLength={40} />

        <Text style={styles.label}>Kullanıcı adı</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="kullanici_adi" placeholderTextColor={colors.faint} autoCapitalize="none" autoCorrect={false} maxLength={20} />
        <Text style={styles.hint}>3–20 karakter · harf, rakam, _ veya .</Text>

        <Text style={styles.label}>Telefon</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+90 5xx xxx xx xx" placeholderTextColor={colors.faint} keyboardType="phone-pad" maxLength={20} />

        <Text style={styles.label}>E-posta</Text>
        <View style={[styles.input, styles.readonly]}>
          <Text style={styles.readonlyText}>{email || '—'}</Text>
        </View>
        <Text style={styles.hint}>E-posta buradan değiştirilemez.</Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.5 }]} onPress={save} disabled={saving} activeOpacity={0.9}>
          <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  label: { fontFamily: font.bodyBold, fontSize: 13, color: colors.muted, marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.field, paddingHorizontal: 14, paddingVertical: 12, fontFamily: font.body, fontSize: 15, color: colors.ink },
  readonly: { backgroundColor: colors.divider, justifyContent: 'center' },
  readonlyText: { fontFamily: font.body, fontSize: 15, color: colors.muted },
  hint: { fontFamily: font.body, fontSize: 12, color: colors.faint, marginTop: 6 },
  footer: { paddingHorizontal: 16, paddingTop: 10, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 15, alignItems: 'center', ...shadow.cta },
  saveBtnText: { fontFamily: font.bodyBold, fontSize: 16, color: colors.white },
});
