import React, { useState } from 'react';
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

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert('Hata', 'E-posta adresinizi girin.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bir hata oluştu');
      setSent(true);
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

              {!sent ? (
                <>
                  {/* Ikon */}
                  <View style={styles.iconWrap}>
                    <Ionicons name="lock-open-outline" size={48} color={DARK_GREEN} />
                  </View>

                  <Text style={styles.title}>Şifremi Unuttum</Text>
                  <Text style={styles.subtitle}>
                    Kayıtlı e-posta adresinizi girin.{'\n'}Size 6 haneli bir sıfırlama kodu göndereceğiz.
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="E-posta adresiniz"
                    placeholderTextColor={DARK_GREEN}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoFocus
                  />

                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSend}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Gönderiliyor...' : 'Kod Gönder'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Başarı durumu */}
                  <View style={styles.iconWrap}>
                    <Ionicons name="checkmark-circle-outline" size={56} color={DARK_GREEN} />
                  </View>

                  <Text style={styles.title}>Kod Gönderildi!</Text>
                  <Text style={styles.subtitle}>
                    <Text style={styles.emailHighlight}>{email}</Text>
                    {'\n'}adresine 6 haneli sıfırlama kodu gönderildi.{'\n'}
                    Gelen kutunuzu kontrol edin.
                  </Text>

                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('ResetPassword', { email })}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>Kodu Gir →</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.resendBtn}
                    onPress={() => { setSent(false); setEmail(''); }}
                  >
                    <Text style={styles.resendText}>Farklı e-posta dene</Text>
                  </TouchableOpacity>
                </>
              )}
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

  iconWrap: { alignItems: 'center', marginVertical: 24 },

  title: { fontSize: 24, fontWeight: '800', color: DARK_GREEN, marginBottom: 10, textAlign: 'center' },
  subtitle: {
    fontSize: 14, color: DARK_GREEN, lineHeight: 22,
    marginBottom: 28, textAlign: 'center', opacity: 0.85,
  },
  emailHighlight: { fontWeight: '700' },

  input: {
    backgroundColor: INPUT_LIGHT_GREEN,
    color: DARK_GREEN,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
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
