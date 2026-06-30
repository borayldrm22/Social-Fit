// LoginScreen.js — SocialFit redesign · Giriş Yap
// Konum: src/screens/auth/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, font, shadow } from '../../theme/socialFitTheme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try { await login?.(email, pass); } catch (e) {} finally { setBusy(false); }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1, paddingBottom: 24, paddingTop: insets.top }} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.back} onPress={() => navigation?.goBack?.()}><Ionicons name="arrow-back" size={19} color="#3C4A42" /></TouchableOpacity>

      <View style={{ paddingHorizontal: 24 }}>
        <View style={styles.logo}><Ionicons name="leaf" size={28} color={colors.white} /></View>
        <Text style={styles.title}>Tekrar hoş geldin 👋</Text>
        <Text style={styles.sub}>Seni özledik! Kaldığın yerden yolculuğuna devam et.</Text>

        <Text style={styles.label}>E-posta</Text>
        <View style={styles.field}>
          <Ionicons name="mail-outline" size={19} color={colors.faint} />
          <TextInput value={email} onChangeText={setEmail} placeholder="ornek@email.com" placeholderTextColor={colors.faint}
            autoCapitalize="none" keyboardType="email-address" style={styles.input} />
        </View>

        <Text style={styles.label}>Şifre</Text>
        <View style={[styles.field, styles.fieldActive]}>
          <Ionicons name="lock-closed-outline" size={19} color={colors.primary} />
          <TextInput value={pass} onChangeText={setPass} placeholder="••••••••" placeholderTextColor={colors.faint}
            secureTextEntry={!show} style={styles.input} />
          <TouchableOpacity onPress={() => setShow((s) => !s)}><Ionicons name={show ? 'eye-outline' : 'eye-off-outline'} size={19} color={colors.faint} /></TouchableOpacity>
        </View>

        <View style={styles.rowBetween}>
          <TouchableOpacity style={styles.remember} onPress={() => setRemember((r) => !r)}>
            <View style={[styles.checkbox, remember && { backgroundColor: colors.primary }]}>{remember ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}</View>
            <Text style={styles.rememberText}>Beni hatırla</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation?.navigate?.('ForgotPassword')}><Text style={styles.link}>Şifremi unuttum?</Text></TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.cta} activeOpacity={0.85} onPress={submit} disabled={busy}>
          <Text style={styles.ctaText}>{busy ? 'Giriş yapılıyor…' : 'Giriş Yap'}</Text>
        </TouchableOpacity>

        <View style={styles.divider}><View style={styles.line} /><Text style={styles.divText}>veya şununla devam et</Text><View style={styles.line} /></View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={styles.social}><Text style={[styles.socialG, { color: '#4285F4' }]}>G</Text><Text style={styles.socialText}>Google</Text></View>
          <View style={styles.social}><Text style={{ fontSize: 17 }}>🍎</Text><Text style={styles.socialText}>Apple</Text></View>
        </View>
      </View>

      <View style={{ flex: 1 }} />
      <TouchableOpacity style={styles.bottom} onPress={() => navigation?.navigate?.('Register')}>
        <Text style={styles.bottomText}>Hesabın yok mu? <Text style={styles.link}>Kayıt ol</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  back: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginLeft: 20, marginTop: 8 },
  logo: { width: 54, height: 54, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 22, ...shadow.cta },
  title: { fontFamily: font.displayBold, fontSize: 28, color: colors.ink, marginTop: 18, letterSpacing: -0.5 },
  sub: { fontSize: 15, color: '#7A887F', marginTop: 7, fontFamily: font.body, lineHeight: 22 },
  label: { fontSize: 13, color: colors.muted, fontFamily: font.bodyBold, marginTop: 18, marginBottom: 8 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4 },
  fieldActive: { borderWidth: 2, borderColor: colors.primary },
  input: { flex: 1, fontSize: 15, color: colors.ink, fontFamily: font.body, paddingVertical: 14 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  remember: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: { width: 21, height: 21, borderRadius: 6, borderWidth: 1.5, borderColor: '#CBD6CC', alignItems: 'center', justifyContent: 'center' },
  rememberText: { fontSize: 13, color: colors.muted, fontFamily: font.bodyBold },
  link: { fontSize: 13, color: colors.primary, fontFamily: font.bodyBold },
  cta: { backgroundColor: colors.primary, borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 22, ...shadow.cta },
  ctaText: { color: colors.white, fontFamily: font.bodyBold, fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22 },
  line: { flex: 1, height: 1, backgroundColor: '#DCE4DC' },
  divText: { fontSize: 12, color: '#9AA89E', fontFamily: font.bodyBold },
  social: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 15, paddingVertical: 13, marginTop: 16 },
  socialG: { fontFamily: font.displayBold, fontSize: 17 },
  socialText: { fontFamily: font.bodyBold, fontSize: 14, color: colors.ink },
  bottom: { alignItems: 'center', paddingVertical: 14 },
  bottomText: { fontSize: 14, color: colors.muted, fontFamily: font.body },
});
