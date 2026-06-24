import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE } from '../../config';

const WELCOME_BG_URI = 'https://assets.api.uizard.io/api/cdn/stream/668cbfdc-f3dd-4d94-b92f-85384d2755a5.png';
const DARK_GREEN = '#2d6a4f';
const INPUT_LIGHT_GREEN = '#e8f5e9';

export default function ResetPasswordScreen({ navigation, route }) {
  const prefillEmail = route.params?.email || '';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  const handleCodeChange = (val, idx) => {
    // Sadece rakam
    const digit = val.replace(/[^0-9]/g, '').slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    if (digit && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleCodeKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleReset = async () => {
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      Alert.alert('Hata', '6 haneli kodu eksiksiz girin.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalı.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: prefillEmail, code: fullCode, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bir hata oluştu');

      Alert.alert(
        'Başarılı! ✅',
        'Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.',
        [{ text: 'Giriş Yap', onPress: () => navigation.navigate('Login') }]
      );
    } catch (e) {
      Alert.alert('Hata', e.message || 'Bir hata oluştu. Tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={{ uri: WELCOME_BG_URI }} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboard}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={22} color={DARK_GREEN} />
                <Text style={styles.backText}>Geri</Text>
              </TouchableOpacity>

              <View style={styles.iconWrap}>
                <Ionicons name="key-outline" size={48} color={DARK_GREEN} />
              </View>

              <Text style={styles.title}>Kodu Gir</Text>
              <Text style={styles.subtitle}>
                {prefillEmail
                  ? `${prefillEmail} adresine gönderilen 6 haneli kodu girin.`
                  : 'E-postanıza gönderilen 6 haneli kodu girin.'}
              </Text>

              {/* OTP Kutuları */}
              <View style={styles.otpRow}>
                {code.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={(r) => (inputs.current[idx] = r)}
                    style={[styles.otpBox, digit && styles.otpBoxFilled]}
                    value={digit}
                    onChangeText={(v) => handleCodeChange(v, idx)}
                    onKeyPress={(e) => handleCodeKeyPress(e, idx)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              {/* Yeni Şifre */}
              <Text style={styles.label}>Yeni Şifre</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="En az 6 karakter"
                  placeholderTextColor={`${DARK_GREEN}88`}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={DARK_GREEN}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleReset}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Güncelleniyor...' : 'Şifremi Güncelle'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendBtn}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.resendText}>Kodu tekrar gönder</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safe: { flex: 1 },
  keyboard: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 24 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 26,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backText: { fontSize: 16, color: DARK_GREEN, marginLeft: 4 },

  iconWrap: { alignItems: 'center', marginVertical: 20 },
  title: { fontSize: 24, fontWeight: '800', color: DARK_GREEN, marginBottom: 10, textAlign: 'center' },
  subtitle: {
    fontSize: 13, color: DARK_GREEN, lineHeight: 20,
    marginBottom: 28, textAlign: 'center', opacity: 0.8,
  },

  // OTP
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  otpBox: {
    width: 46, height: 56, borderRadius: 12,
    backgroundColor: INPUT_LIGHT_GREEN,
    textAlign: 'center', fontSize: 24, fontWeight: '700', color: DARK_GREEN,
    borderWidth: 2, borderColor: 'transparent',
  },
  otpBoxFilled: { borderColor: DARK_GREEN },

  // Şifre
  label: { fontSize: 13, fontWeight: '600', color: DARK_GREEN, marginBottom: 8 },
  input: {
    backgroundColor: INPUT_LIGHT_GREEN,
    color: DARK_GREEN,
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
  },
  passwordWrap: { position: 'relative', marginBottom: 20 },
  passwordInput: { paddingRight: 48 },
  eyeButton: {
    position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center',
  },

  button: {
    backgroundColor: DARK_GREEN,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  resendBtn: { alignItems: 'center', paddingVertical: 8 },
  resendText: { fontSize: 14, color: DARK_GREEN, fontWeight: '500' },
});
