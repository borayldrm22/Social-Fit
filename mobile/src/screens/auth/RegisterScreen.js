// RegisterScreen.js — SocialFit redesign · Kayıt Ol
// Konum: src/screens/auth/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, font, shadow } from '../../theme/socialFitTheme';

// Basit şifre gücü (0-4)
function strength(p) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}
const BAR_COLORS = ['#E9EFE9', colors.coral, colors.amber, colors.primary, colors.primary];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(true);
  const [busy, setBusy] = useState(false);
  const s = strength(pass);
  const match = pass.length > 0 && pass === pass2;
  const canSubmit = agree && match && pass.length >= 6;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    // Gerçek ad onboarding 1. adımda alınır; kayıtta e-posta ön adı geçici görünen ad olur.
    const placeholderName = (email.split('@')[0] || 'Kullanıcı').trim();
    try { await register?.(email, pass, placeholderName, phone.trim() || undefined); } catch (e) {} finally { setBusy(false); }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1, paddingBottom: 24, paddingTop: insets.top }} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.back} onPress={() => navigation?.goBack?.()}><Ionicons name="arrow-back" size={19} color="#3C4A42" /></TouchableOpacity>

      <View style={{ paddingHorizontal: 24 }}>
        <View style={styles.logo}><Ionicons name="sparkles" size={27} color={colors.white} /></View>
        <Text style={styles.title}>Aramıza katıl 🎉</Text>
        <Text style={styles.sub}>Sağlıklı yaşam topluluğunda yerini al.</Text>

        <Text style={styles.label}>E-posta</Text>
        <View style={styles.field}>
          <Ionicons name="mail-outline" size={19} color={colors.faint} />
          <TextInput value={email} onChangeText={setEmail} placeholder="ornek@email.com" placeholderTextColor={colors.faint}
            autoCapitalize="none" keyboardType="email-address" style={styles.input} />
        </View>

        <Text style={styles.label}>Telefon <Text style={styles.optional}>(isteğe bağlı)</Text></Text>
        <View style={styles.field}>
          <Ionicons name="call-outline" size={19} color={colors.faint} />
          <TextInput value={phone} onChangeText={setPhone} placeholder="05XX XXX XX XX" placeholderTextColor={colors.faint}
            keyboardType="phone-pad" style={styles.input} />
        </View>

        <Text style={styles.label}>Şifre</Text>
        <View style={[styles.field, styles.fieldActive]}>
          <Ionicons name="lock-closed-outline" size={19} color={colors.primary} />
          <TextInput value={pass} onChangeText={setPass} placeholder="••••••" placeholderTextColor={colors.faint}
            secureTextEntry={!show} style={styles.input} />
          <TouchableOpacity onPress={() => setShow((v) => !v)}><Ionicons name={show ? 'eye-outline' : 'eye-off-outline'} size={19} color={colors.faint} /></TouchableOpacity>
        </View>
        <View style={styles.bars}>
          {[0, 1, 2, 3].map((i) => <View key={i} style={[styles.bar, { backgroundColor: i < s ? BAR_COLORS[s] : '#E9EFE9' }]} />)}
        </View>
        <Text style={styles.hint}>Güçlü bir şifre · en az 8 karakter</Text>

        <Text style={styles.label}>Şifre (tekrar)</Text>
        <View style={[styles.field, pass2.length > 0 && !match && styles.fieldError]}>
          <Ionicons name="lock-closed-outline" size={19} color={colors.faint} />
          <TextInput value={pass2} onChangeText={setPass2} placeholder="••••••" placeholderTextColor={colors.faint}
            secureTextEntry={!show} style={styles.input} />
        </View>
        {pass2.length > 0 && !match ? <Text style={styles.errHint}>Şifreler eşleşmiyor</Text> : null}

        <TouchableOpacity style={styles.agree} onPress={() => setAgree((a) => !a)}>
          <View style={[styles.checkbox, agree && { backgroundColor: colors.primary }]}>{agree ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}</View>
          <Text style={styles.agreeText}><Text style={styles.link}>Kullanım koşulları</Text> ve <Text style={styles.link}>gizlilik politikasını</Text> kabul ediyorum.</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.cta, !canSubmit && { opacity: 0.5 }]} activeOpacity={0.85} onPress={submit} disabled={busy || !canSubmit}>
          <Text style={styles.ctaText}>{busy ? 'Oluşturuluyor…' : 'Hesabımı Oluştur'}</Text>
          <Ionicons name="arrow-forward" size={19} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }} />
      <TouchableOpacity style={styles.bottom} onPress={() => navigation?.navigate?.('Login')}>
        <Text style={styles.bottomText}>Zaten üye misin? <Text style={styles.link}>Giriş yap</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  back: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginLeft: 20, marginTop: 8 },
  logo: { width: 54, height: 54, borderRadius: 17, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center', marginTop: 20, ...shadow.cta, shadowColor: colors.coral },
  title: { fontFamily: font.displayBold, fontSize: 28, color: colors.ink, marginTop: 16, letterSpacing: -0.5 },
  sub: { fontSize: 15, color: '#7A887F', marginTop: 6, fontFamily: font.body, lineHeight: 22 },
  label: { fontSize: 13, color: colors.muted, fontFamily: font.bodyBold, marginTop: 14, marginBottom: 8 },
  optional: { color: colors.faint, fontFamily: font.body, fontSize: 12 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4 },
  fieldActive: { borderWidth: 2, borderColor: colors.primary },
  fieldError: { borderWidth: 2, borderColor: colors.coral },
  errHint: { fontSize: 12, color: colors.coral, fontFamily: font.body, marginTop: 6 },
  input: { flex: 1, fontSize: 15, color: colors.ink, fontFamily: font.body, paddingVertical: 13 },
  bars: { flexDirection: 'row', gap: 6, marginTop: 9 },
  bar: { flex: 1, height: 5, borderRadius: 3 },
  hint: { fontSize: 12, color: colors.faint, fontFamily: font.body, marginTop: 7 },
  agree: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 16 },
  checkbox: { width: 21, height: 21, borderRadius: 6, borderWidth: 1.5, borderColor: '#CBD6CC', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  agreeText: { flex: 1, fontSize: 12, color: colors.muted, fontFamily: font.body, lineHeight: 18 },
  link: { color: colors.primary, fontFamily: font.bodyBold },
  cta: { backgroundColor: colors.primary, borderRadius: 18, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, ...shadow.cta },
  ctaText: { color: colors.white, fontFamily: font.bodyBold, fontSize: 16 },
  bottom: { alignItems: 'center', paddingVertical: 14 },
  bottomText: { fontSize: 14, color: colors.muted, fontFamily: font.body },
});
