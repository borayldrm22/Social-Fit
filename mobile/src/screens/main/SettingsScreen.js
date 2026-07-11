// SettingsScreen.js — SocialFit · Ayarlar (design-system, bölümlenmiş)
// Faz A: iskelet + kolay gerçekler. Privacy toggle (PATCH /me) + account badge bağlı,
// Personal Info/Hedef -> EditProfile, About -> InfoScreen. Yapılmayanlar comingSoon.
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { comingSoon } from '../../utils/comingSoon';
import { colors, font, shadow } from '../../theme/socialFitTheme';

const PREFS_KEY = 'notification_preferences';
const DEFAULT_PREFS = { pushEnabled: true, messages: true, groupComments: true, badges: true, streakReminder: true };

function SectionHeader({ children }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function Row({ icon, label, value, onPress, right, danger, last }) {
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap style={[styles.row, !last && styles.rowBorder]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? colors.coralDark : colors.primary} />
      </View>
      <Text style={[styles.rowLabel, danger && { color: colors.coralDark }]}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {right !== undefined ? right : (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.faint} /> : null)}
      </View>
    </Wrap>
  );
}

export default function SettingsScreen({ navigation }) {
  const api = useApi();
  const { logout } = useAuth();
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [isPublic, setIsPublic] = useState(true);
  const [accountType, setAccountType] = useState('Basic');
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    AsyncStorage.getItem(PREFS_KEY)
      .then((raw) => { if (active && raw) setPrefs((p) => ({ ...DEFAULT_PREFS, ...p, ...JSON.parse(raw) })); })
      .catch(() => {});
    api.get('/api/users/me')
      .then((me) => {
        if (!active) return;
        setIsPublic(me?.profile?.isPublic !== false);
        setAccountType(me?.subscription?.plan === 'premium' ? 'Premium' : 'Basic');
      })
      .catch(() => {});
    return () => { active = false; };
  }, [api]));

  const updatePref = (key, val) => {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next)).catch(() => {});
  };

  const togglePrivacy = (val) => {
    if (savingPrivacy) return;
    setIsPublic(val); // optimistic
    setSavingPrivacy(true);
    api.patch('/api/users/me', { isPublic: val })
      .catch(() => { setIsPublic(!val); Alert.alert('Hata', 'Gizlilik ayarı kaydedilemedi.'); })
      .finally(() => setSavingPrivacy(false));
  };

  const goEditProfile = () => navigation.getParent()?.navigate('Profile', { screen: 'EditProfile' });
  const openInfo = (page) => navigation.navigate('Info', { page });

  const confirmLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabından çıkmak istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 36 }}>
      {/* Hesap */}
      <SectionHeader>Hesap</SectionHeader>
      <View style={styles.card}>
        <Row icon="person-outline" label="Kişisel Bilgiler" onPress={() => navigation.navigate('PersonalInfo')} />
        <Row icon="flag-outline" label="Hedefim" onPress={goEditProfile} />
        <Row icon="ribbon-outline" label="Hesap Türü" value={`${accountType} hesap`} />
        <Row icon="diamond-outline" label="Abonelik" onPress={() => comingSoon('Abonelik')} last />
      </View>

      {/* Gizlilik & Güvenlik */}
      <SectionHeader>Gizlilik & Güvenlik</SectionHeader>
      <View style={styles.card}>
        <Row
          icon="lock-closed-outline"
          label="Gizli hesap"
          right={<Switch value={!isPublic} onValueChange={(v) => togglePrivacy(!v)} trackColor={{ true: colors.primary }} />}
        />
        <Row icon="ban-outline" label="Engellenen Hesaplar" onPress={() => comingSoon('Engellenen Hesaplar')} />
        <Row icon="key-outline" label="Şifre Değiştir" onPress={() => navigation.navigate('ChangePassword')} last />
      </View>

      {/* Görünüm & Dil */}
      <SectionHeader>Uygulama</SectionHeader>
      <View style={styles.card}>
        <Row icon="contrast-outline" label="Görünüm" value="Açık" onPress={() => comingSoon('Görünüm (koyu mod)')} />
        <Row icon="language-outline" label="Dil" value="Türkçe" onPress={() => comingSoon('Dil')} last />
      </View>

      {/* Bildirimler */}
      <SectionHeader>Bildirimler</SectionHeader>
      <View style={styles.card}>
        <Row
          icon="notifications-outline"
          label="Push bildirimleri"
          right={<Switch value={prefs.pushEnabled} onValueChange={(v) => updatePref('pushEnabled', v)} trackColor={{ true: colors.primary }} />}
          last={!prefs.pushEnabled}
        />
        {prefs.pushEnabled ? (
          <>
            <Row icon="chatbubble-outline" label="Yeni mesajlar" right={<Switch value={prefs.messages} onValueChange={(v) => updatePref('messages', v)} trackColor={{ true: colors.primary }} />} />
            <Row icon="people-outline" label="Grup yorumları" right={<Switch value={prefs.groupComments} onValueChange={(v) => updatePref('groupComments', v)} trackColor={{ true: colors.primary }} />} />
            <Row icon="ribbon-outline" label="Rozetler" right={<Switch value={prefs.badges} onValueChange={(v) => updatePref('badges', v)} trackColor={{ true: colors.primary }} />} />
            <Row icon="flame-outline" label="Seri hatırlatıcı" right={<Switch value={prefs.streakReminder} onValueChange={(v) => updatePref('streakReminder', v)} trackColor={{ true: colors.primary }} />} last />
          </>
        ) : null}
      </View>

      {/* SocialFit Hakkında */}
      <SectionHeader>SocialFit Hakkında</SectionHeader>
      <View style={styles.card}>
        <Row icon="help-circle-outline" label="Sıkça Sorulan Sorular" onPress={() => openInfo('faq')} />
        <Row icon="document-text-outline" label="Kullanım Şartları" onPress={() => openInfo('terms')} />
        <Row icon="shield-checkmark-outline" label="Gizlilik Sözleşmesi" onPress={() => openInfo('privacy')} />
        <Row icon="information-circle-outline" label="Hakkımızda" onPress={() => openInfo('about')} />
        <Row icon="mail-outline" label="İletişim" onPress={() => openInfo('contact')} />
        <Row icon="star-half-outline" label="Bizi Değerlendir" onPress={() => navigation.navigate('RateUs')} last />
      </View>

      <Text style={styles.disclaimer}>
        Sağlık ve beslenme verileriniz özel nitelikli kişisel veri kapsamındadır. Uygulamayı kullanarak açık rızanızı vermiş sayılırsınız.
      </Text>

      <TouchableOpacity style={styles.logout} onPress={confirmLogout} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={18} color={colors.coralDark} />
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  sectionTitle: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 8, fontFamily: font.bodyBold, fontSize: 12.5, color: colors.faint, letterSpacing: 0.4, textTransform: 'uppercase' },
  card: { marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 18, ...shadow.soft, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  rowIconDanger: { backgroundColor: colors.coralTint },
  rowLabel: { flex: 1, fontFamily: font.bodyBold, fontSize: 15, color: colors.ink },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontFamily: font.body, fontSize: 13.5, color: colors.faint },
  disclaimer: { paddingHorizontal: 22, paddingTop: 20, fontSize: 12, color: colors.faint, fontFamily: font.body, lineHeight: 18 },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 18, paddingVertical: 14, borderRadius: 14, backgroundColor: colors.coralTint },
  logoutText: { fontFamily: font.bodyBold, fontSize: 15, color: colors.coralDark },
});
