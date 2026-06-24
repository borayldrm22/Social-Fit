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
import { useAuth } from '../../context/AuthContext';

const WELCOME_BG_URI = 'https://assets.api.uizard.io/api/cdn/stream/668cbfdc-f3dd-4d94-b92f-85384d2755a5.png';
const DARK_GREEN = '#2d6a4f';
const INPUT_LIGHT_GREEN = '#e8f5e9';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Hata', 'E-posta ve şifre girin.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      Alert.alert('Giriş başarısız', e.message || 'Tekrar deneyin.');
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
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                We missed you!{'\n'}Continue your journey where you left off
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={DARK_GREEN}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <View style={styles.passwordWrap}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Password"
                  placeholderTextColor={DARK_GREEN}
                  value={password}
                  onChangeText={setPassword}
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

              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberRow}
                  onPress={() => setRememberMe((v) => !v)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Log in'}</Text>
              </TouchableOpacity>

              <Text style={styles.signInWith}>Sign in with</Text>
              <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-google" size={24} color="#374151" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-apple" size={26} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLinkText}>Hesabınız yok mu? Kayıt olun</Text>
            </TouchableOpacity>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: { fontSize: 16, color: DARK_GREEN, marginLeft: 4 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 24 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 26,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: DARK_GREEN,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: DARK_GREEN,
    lineHeight: 22,
    marginBottom: 24,
    opacity: 0.9,
  },
  input: {
    backgroundColor: INPUT_LIGHT_GREEN,
    color: DARK_GREEN,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  passwordWrap: { position: 'relative', marginBottom: 12 },
  passwordInput: { paddingRight: 48 },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: DARK_GREEN,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: DARK_GREEN, borderColor: DARK_GREEN },
  rememberText: { fontSize: 14, color: DARK_GREEN },
  forgotText: { fontSize: 14, color: DARK_GREEN, fontWeight: '500' },
  button: {
    backgroundColor: INPUT_LIGHT_GREEN,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: DARK_GREEN, fontWeight: '700', fontSize: 16 },
  signInWith: {
    fontSize: 14,
    color: DARK_GREEN,
    textAlign: 'center',
    marginBottom: 12,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialButton: {
    marginHorizontal: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerLink: { marginTop: 20, alignItems: 'center' },
  registerLinkText: { fontSize: 14, color: DARK_GREEN, fontWeight: '500' },
});
