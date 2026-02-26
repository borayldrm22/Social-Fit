import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function MoreScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('Tools')}>
        <Text style={styles.text}>Araçlar (BKİ, Kalori)</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('Leaderboard')}>
        <Text style={styles.text}>Lider Tablosu</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.text}>Ayarlar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  item: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  text: { fontSize: 16 },
});
