// WelcomeScreen.js — SocialFit redesign · Karşılama (auth)
// Konum: src/screens/auth/WelcomeScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, font, shadow } from '../../theme/socialFitTheme';

export default function WelcomeScreen({ navigation }) {
  return (
    <LinearGradient colors={['#10402B', colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={styles.screen}>
      <View style={styles.center}>
        <View style={styles.logo}><Ionicons name="leaf" size={48} color={colors.white} /></View>
        <Text style={styles.brand}>Social<Text style={{ color: '#A9E0C2' }}>Fit</Text></Text>
        <Text style={styles.tag}>Birlikte hareket et, birlikte güçlen. Kendinin en iyi versiyonu olmaya hazır mısın?</Text>
        <View style={styles.pills}>
          {['🔥 Streak', '🤝 Topluluk', '🥗 Beslenme'].map((p) => (
            <View key={p} style={styles.pill}><Text style={styles.pillText}>{p}</Text></View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primary} activeOpacity={0.85} onPress={() => navigation?.navigate?.('Register')}>
          <Text style={styles.primaryText}>Hesap Oluştur</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondary} activeOpacity={0.8} onPress={() => navigation?.navigate?.('Login')}>
          <Text style={styles.secondaryText}>Giriş Yap</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24, paddingTop: 120, paddingBottom: 34 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 92, height: 92, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  brand: { fontFamily: font.displayBold, fontSize: 34, color: colors.white, marginTop: 24, letterSpacing: -0.8 },
  tag: { fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 25, marginTop: 12, fontFamily: font.body },
  pills: { flexDirection: 'row', gap: 7, marginTop: 24 },
  pill: { backgroundColor: 'rgba(255,255,255,0.13)', paddingHorizontal: 13, paddingVertical: 7, borderRadius: 13 },
  pillText: { fontSize: 12, fontFamily: font.bodyBold, color: colors.white },
  footer: { gap: 12 },
  primary: { backgroundColor: colors.white, borderRadius: 18, paddingVertical: 17, alignItems: 'center', ...shadow.card },
  primaryText: { color: colors.ink, fontFamily: font.bodyBold, fontSize: 16 },
  secondary: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', borderRadius: 18, paddingVertical: 17, alignItems: 'center' },
  secondaryText: { color: colors.white, fontFamily: font.bodyBold, fontSize: 16 },
});
