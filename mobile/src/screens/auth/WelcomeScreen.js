// WelcomeScreen.js — SocialFit redesign · Karşılama (auth)
// Konum: src/screens/auth/WelcomeScreen.js
// Logo animasyonlu açılır, ardından "Hesap Oluştur / Giriş Yap" alanı aşağıdan belirir.
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, font, shadow } from '../../theme/socialFitTheme';

export default function WelcomeScreen({ navigation }) {
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]),
      Animated.timing(contentAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(footerAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [logoScale, logoOpacity, contentAnim, footerAnim]);

  const contentTranslate = contentAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const footerTranslate = footerAnim.interpolate({ inputRange: [0, 1], outputRange: [26, 0] });

  return (
    <LinearGradient colors={['#10402B', colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={styles.screen}>
      <View style={styles.center}>
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
          <View style={styles.logo}><Ionicons name="leaf" size={48} color={colors.white} /></View>
        </Animated.View>

        <Animated.View style={{ alignItems: 'center', opacity: contentAnim, transform: [{ translateY: contentTranslate }] }}>
          <Text style={styles.brand}>Social<Text style={{ color: '#A9E0C2' }}>Fit</Text></Text>
          <Text style={styles.tag}>Birlikte hareket et, birlikte güçlen.</Text>
          <View style={styles.pills}>
            {['🔥 Streak', '🤝 Topluluk', '🥗 Beslenme'].map((p) => (
              <View key={p} style={styles.pill}><Text style={styles.pillText}>{p}</Text></View>
            ))}
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: footerAnim, transform: [{ translateY: footerTranslate }] }]}>
        <TouchableOpacity style={styles.primary} activeOpacity={0.85} onPress={() => navigation?.navigate?.('Register')}>
          <Text style={styles.primaryText}>Hesap Oluştur</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondary} activeOpacity={0.8} onPress={() => navigation?.navigate?.('Login')}>
          <Text style={styles.secondaryText}>Giriş Yap</Text>
        </TouchableOpacity>
      </Animated.View>
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
