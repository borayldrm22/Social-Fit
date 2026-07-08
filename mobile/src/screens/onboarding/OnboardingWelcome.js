import React, { useState, useEffect } from 'react';
import { TextInput, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useOnboardingTheme, ob } from '../../components/onboarding/onboardingStyles';
import { useApi } from '../../api/client';

const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;

export default function OnboardingWelcome({ navigation }) {
  const api = useApi();
  const { c } = useOnboardingTheme();
  const setFullName = useOnboardingStore((s) => s.setFullName);
  const setUsername = useOnboardingStore((s) => s.setUsername);
  const savedName = useOnboardingStore((s) => s.fullName);
  const savedUser = useOnboardingStore((s) => s.username);

  const [fullName, setNameLocal] = useState(savedName || '');
  const [username, setUserLocal] = useState(savedUser || '');
  const [status, setStatus] = useState('idle'); // idle | checking | available | taken | invalid

  const norm = username.trim().toLowerCase().replace(/^@/, '');

  // Canlı müsaitlik kontrolü (debounce'lu)
  useEffect(() => {
    if (!norm) { setStatus('idle'); return; }
    if (!USERNAME_RE.test(norm)) { setStatus('invalid'); return; }
    setStatus('checking');
    let active = true;
    const t = setTimeout(() => {
      api.get(`/api/users/username-available?username=${encodeURIComponent(norm)}`)
        .then((r) => { if (active) setStatus(r?.available ? 'available' : 'taken'); })
        .catch(() => { if (active) setStatus('idle'); });
    }, 450);
    return () => { active = false; clearTimeout(t); };
  }, [norm, api]);

  const nameOk = fullName.trim().length >= 2;
  // Format geçerli + "alınmış"/"kontrol ediliyor" değilse geç. Check erişilemezse (backend
  // henüz deploy değil → status 'idle') engellemeyiz; benzersizlik submit'te de kontrol edilir.
  const usernameOk = USERNAME_RE.test(norm) && status !== 'taken' && status !== 'checking';
  const ok = nameOk && usernameOk;

  const onSubmit = () => {
    setFullName(fullName.trim());
    setUsername(norm);
    navigation.navigate('OnboardingProfile');
  };

  const inputStyle = [ob.input, { borderColor: c.border, backgroundColor: c.inputBg, color: c.text }];

  const statusMeta = {
    checking: { text: 'Kontrol ediliyor…', color: c.textSecondary },
    available: { text: 'Müsait ✓', color: '#16A34A' },
    taken: { text: 'Bu kullanıcı adı alınmış', color: '#DC2626' },
    invalid: { text: '3-20 karakter · harf, rakam, _ veya .', color: c.textSecondary },
    idle: { text: 'Sana özel @kullanıcı adın', color: c.textSecondary },
  }[status];

  return (
    <OnboardingLayout
      navigation={navigation}
      routeName="OnboardingWelcome"
      title="Seni tanımak istiyoruz 👋"
      subtitle="Planını hazırlamak için birkaç kısa soru."
      onNext={onSubmit}
      nextLabel="Başlayalım →"
      nextDisabled={!ok}
      canGoBack={false}
    >
      <Text style={[styles.hint, { color: c.textSecondary }]}>Adın ve soyadın</Text>
      <TextInput
        style={inputStyle}
        placeholder="Adın Soyadın"
        placeholderTextColor="#94a3b8"
        value={fullName}
        onChangeText={setNameLocal}
        autoCapitalize="words"
        autoCorrect={false}
        accessibilityLabel="Ad Soyad"
      />

      <Text style={[styles.hint, { color: c.textSecondary, marginTop: 18 }]}>Kullanıcı adın</Text>
      <View style={[styles.userRow, { borderColor: c.border, backgroundColor: c.inputBg }]}>
        <Text style={[styles.at, { color: c.textSecondary }]}>@</Text>
        <TextInput
          style={[styles.userInput, { color: c.text }]}
          placeholder="kullaniciadi"
          placeholderTextColor="#94a3b8"
          value={username}
          onChangeText={setUserLocal}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
          accessibilityLabel="Kullanıcı adı"
        />
        {status === 'checking' ? (
          <ActivityIndicator size="small" color={c.textSecondary} />
        ) : status === 'available' ? (
          <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
        ) : status === 'taken' || status === 'invalid' ? (
          <Ionicons name="close-circle" size={20} color="#DC2626" />
        ) : null}
      </View>
      <Text style={[styles.status, { color: statusMeta.color }]}>{statusMeta.text}</Text>

      <View style={{ height: 24 }} />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14,
  },
  at: { fontSize: 16, fontWeight: '600' },
  userInput: { flex: 1, fontSize: 16, paddingVertical: 14 },
  status: { fontSize: 12.5, marginTop: 7 },
});
