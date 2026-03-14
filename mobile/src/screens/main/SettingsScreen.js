import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';

const PREFS_KEY = 'notification_preferences';
const DEFAULT_PREFS = {
  pushEnabled: true,
  messages: true,
  groupComments: true,
  badges: true,
  streakReminder: true,
};

export default function SettingsScreen() {
  const { logout } = useAuth();
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);

  const loadPrefs = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(PREFS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setPrefs((p) => ({ ...DEFAULT_PREFS, ...p, ...parsed }));
      }
    } catch (e) {}
  }, []);

  React.useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  const updatePref = (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next)).catch(() => {});
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bildirimler</Text>
        <View style={styles.item}>
          <Text style={styles.text}>Push bildirimleri</Text>
          <Switch value={prefs.pushEnabled} onValueChange={(v) => updatePref('pushEnabled', v)} trackColor={{ true: '#2d6a4f' }} />
        </View>
        {prefs.pushEnabled && (
          <>
            <View style={styles.item}>
              <Text style={styles.subLabel}>Yeni mesajlar</Text>
              <Switch value={prefs.messages} onValueChange={(v) => updatePref('messages', v)} trackColor={{ true: '#2d6a4f' }} />
            </View>
            <View style={styles.item}>
              <Text style={styles.subLabel}>Grup yorumları</Text>
              <Switch value={prefs.groupComments} onValueChange={(v) => updatePref('groupComments', v)} trackColor={{ true: '#2d6a4f' }} />
            </View>
            <View style={styles.item}>
              <Text style={styles.subLabel}>Rozetler</Text>
              <Switch value={prefs.badges} onValueChange={(v) => updatePref('badges', v)} trackColor={{ true: '#2d6a4f' }} />
            </View>
            <View style={styles.item}>
              <Text style={styles.subLabel}>Seri hatırlatıcı</Text>
              <Switch value={prefs.streakReminder} onValueChange={(v) => updatePref('streakReminder', v)} trackColor={{ true: '#2d6a4f' }} />
            </View>
          </>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Yasal</Text>
        <TouchableOpacity style={styles.item} onPress={() => Linking.openURL('https://example.com/kvkk')}>
          <Text style={styles.text}>KVKK Aydınlatma Metni</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => Linking.openURL('https://example.com/gizlilik')}>
          <Text style={styles.text}>Gizlilik Politikası</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => Linking.openURL('https://example.com/uyelik')}>
          <Text style={styles.text}>Üyelik Sözleşmesi</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.disclaimer}>
        Sağlık ve beslenme verileriniz özel nitelikli kişisel veri kapsamındadır. Uygulamayı kullanarak açık rızanızı vermiş sayılırsınız.
      </Text>
      <TouchableOpacity style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  section: { marginTop: 8 },
  sectionTitle: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, fontSize: 13, fontWeight: '600', color: '#6b7280' },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  text: { fontSize: 16 },
  subLabel: { fontSize: 15, color: '#374151' },
  disclaimer: { padding: 16, fontSize: 12, color: '#666' },
  logout: { margin: 16, padding: 14, borderRadius: 8, backgroundColor: '#e63946', alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '600' },
});
