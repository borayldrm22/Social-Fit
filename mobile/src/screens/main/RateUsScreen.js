// RateUsScreen.js — SocialFit · Bizi Değerlendir
// <4 yıldız → uygulama içi geri bildirim (POST /api/users/me/feedback)
// >=4 yıldız → mağaza değerlendirmesine yönlendir
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../api/client';
import { colors, font, shadow, radius } from '../../theme/socialFitTheme';

// TODO: mağaza yayınına çıkınca gerçek linklerle değiştir
const STORE_URL = Platform.select({
  ios: 'https://apps.apple.com/app/idXXXXXXXX',
  android: 'https://play.google.com/store/apps/details?id=app.socialfit',
});

export default function RateUsScreen({ navigation }) {
  const api = useApi();
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const isHappy = rating >= 4;
  const isSad = rating >= 1 && rating <= 3;

  const openStore = useCallback(() => {
    Linking.openURL(STORE_URL).catch(() => Alert.alert('Yakında', 'Mağaza sayfası henüz yayında değil.'));
  }, []);

  const sendFeedback = useCallback(async () => {
    if (!message.trim()) { Alert.alert('Eksik', 'Lütfen birkaç kelime yaz.'); return; }
    setSaving(true);
    try {
      await api.post('/api/users/me/feedback', { rating, message: message.trim() });
      Alert.alert('Teşekkürler', 'Geri bildirimin bize ulaştı. Daha iyisi için çalışacağız.');
      navigation.goBack();
    } catch (e) {
      setSaving(false);
      Alert.alert('Hata', e?.message || 'Geri bildirim gönderilemedi.');
    }
  }, [rating, message, api, navigation]);

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.emoji}>{isHappy ? '🎉' : isSad ? '🙏' : '⭐'}</Text>
          <Text style={styles.title}>SocialFit'i ne kadar seviyorsun?</Text>
          <Text style={styles.sub}>Puanın bize yol gösterir.</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setRating(n)} hitSlop={6} activeOpacity={0.7}>
                <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={38} color={n <= rating ? colors.amber : colors.faint} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isHappy ? (
          <View style={styles.card}>
            <Text style={styles.blockTitle}>Bunu duymak harika! 💚</Text>
            <Text style={styles.blockText}>Değerlendirmeni mağazada paylaşır mısın? Bize çok yardımcı olur.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={openStore} activeOpacity={0.9}>
              <Text style={styles.primaryBtnText}>Mağazada Değerlendir</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {isSad ? (
          <View style={styles.card}>
            <Text style={styles.blockTitle}>Üzgünüz. Neyi daha iyi yapabiliriz?</Text>
            <TextInput
              style={styles.textarea}
              value={message}
              onChangeText={setMessage}
              placeholder="Yaşadığın sorunu veya önerini yaz…"
              placeholderTextColor={colors.faint}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={800}
            />
            <TouchableOpacity style={[styles.primaryBtn, saving && { opacity: 0.5 }]} onPress={sendFeedback} disabled={saving} activeOpacity={0.9}>
              <Text style={styles.primaryBtnText}>{saving ? 'Gönderiliyor…' : 'Gönder'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  card: { backgroundColor: colors.surface, borderRadius: 20, ...shadow.soft, padding: 20, marginBottom: 14, alignItems: 'center' },
  emoji: { fontSize: 40, marginBottom: 8 },
  title: { fontFamily: font.displayBold, fontSize: 18, color: colors.ink, textAlign: 'center' },
  sub: { fontFamily: font.body, fontSize: 13.5, color: colors.faint, textAlign: 'center', marginTop: 4 },
  stars: { flexDirection: 'row', gap: 8, marginTop: 16 },
  blockTitle: { fontFamily: font.bodyBold, fontSize: 15.5, color: colors.ink, textAlign: 'center', marginBottom: 10, alignSelf: 'stretch' },
  blockText: { fontFamily: font.body, fontSize: 14, color: colors.text, textAlign: 'center', lineHeight: 21, marginBottom: 16 },
  textarea: { alignSelf: 'stretch', minHeight: 120, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.field, padding: 14, fontFamily: font.body, fontSize: 15, color: colors.ink, marginBottom: 14 },
  primaryBtn: { alignSelf: 'stretch', backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', ...shadow.cta },
  primaryBtnText: { fontFamily: font.bodyBold, fontSize: 15, color: colors.white },
});
