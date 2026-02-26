import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Switch } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen() {
  const { logout } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(true);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.item}>
        <Text style={styles.text}>Push bildirimleri</Text>
        <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ true: '#2d6a4f' }} />
      </View>
      <TouchableOpacity style={styles.item} onPress={() => Linking.openURL('https://example.com/kvkk')}>
        <Text style={styles.text}>KVKK Aydınlatma Metni</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => Linking.openURL('https://example.com/gizlilik')}>
        <Text style={styles.text}>Gizlilik Politikası</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => Linking.openURL('https://example.com/uyelik')}>
        <Text style={styles.text}>Üyelik Sözleşmesi</Text>
      </TouchableOpacity>
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
  item: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  text: { fontSize: 16 },
  disclaimer: { padding: 16, fontSize: 12, color: '#666' },
  logout: { margin: 16, padding: 14, borderRadius: 8, backgroundColor: '#e63946', alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '600' },
});
