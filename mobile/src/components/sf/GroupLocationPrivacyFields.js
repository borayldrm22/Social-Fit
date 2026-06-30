// GroupLocationPrivacyFields.js — Grup oluştur/düzenle için gizlilik + konum seçimi
// Controlled: value={{ isPrivate, latitude, longitude, locationName }}, onChange(partial)
import React, { useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const GREEN = '#2D6A4F';
const ISTANBUL = { latitude: 41.0082, longitude: 28.9784, latitudeDelta: 0.25, longitudeDelta: 0.25 };

export default function GroupLocationPrivacyFields({ value, onChange }) {
  const { isPrivate, latitude, longitude, locationName } = value;
  const mapRef = useRef(null);
  const hasLoc = latitude != null && longitude != null;

  const useCurrent = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('İzin gerekli', 'Konumunu kullanmak için izin ver.'); return; }
      const pos = await Location.getCurrentPositionAsync({});
      onChange({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      mapRef.current?.animateToRegion({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 500);
    } catch (e) { Alert.alert('Hata', 'Konum alınamadı.'); }
  };

  return (
    <View>
      <Text style={styles.label}>Gizlilik</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity style={[styles.toggle, !isPrivate && styles.toggleOn]} onPress={() => onChange({ isPrivate: false })} activeOpacity={0.8}>
          <Ionicons name="earth" size={16} color={!isPrivate ? '#fff' : '#6B7280'} />
          <Text style={[styles.toggleText, !isPrivate && styles.toggleTextOn]}>Herkese Açık</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggle, isPrivate && styles.toggleOn]} onPress={() => onChange({ isPrivate: true })} activeOpacity={0.8}>
          <Ionicons name="lock-closed" size={16} color={isPrivate ? '#fff' : '#6B7280'} />
          <Text style={[styles.toggleText, isPrivate && styles.toggleTextOn]}>Gizli</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>{isPrivate ? 'Gizli grupta katılım admin onayı gerektirir.' : 'Herkese açık gruba isteyen anında katılır.'}</Text>

      <Text style={styles.label}>Konum (haritada görünür)</Text>
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={hasLoc ? { latitude, longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 } : ISTANBUL}
          onPress={(e) => onChange({ latitude: e.nativeEvent.coordinate.latitude, longitude: e.nativeEvent.coordinate.longitude })}
        >
          {hasLoc ? <Marker coordinate={{ latitude, longitude }} pinColor={GREEN} /> : null}
        </MapView>
        <TouchableOpacity style={styles.locBtn} onPress={useCurrent} activeOpacity={0.85}>
          <Ionicons name="locate" size={15} color={GREEN} />
          <Text style={styles.locBtnText}>Mevcut konumum</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>{hasLoc ? 'Konum seçildi. Değiştirmek için haritaya dokun.' : 'Haritaya dokunarak grubun konumunu seç (opsiyonel).'}</Text>

      <Text style={styles.label}>Konum adı (opsiyonel)</Text>
      <TextInput
        style={styles.input}
        placeholder="örn. Kadıköy, İstanbul"
        placeholderTextColor="#9CA3AF"
        value={locationName || ''}
        onChangeText={(t) => onChange({ locationName: t })}
        maxLength={60}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  toggle: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 12, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  toggleOn: { backgroundColor: GREEN, borderColor: GREEN },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  toggleTextOn: { color: '#fff' },
  hint: { fontSize: 12, color: '#9CA3AF', marginBottom: 18, lineHeight: 16 },
  mapWrap: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8 },
  map: { width: '100%', height: 170 },
  locBtn: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  locBtnText: { fontSize: 12, fontWeight: '700', color: GREEN },
  input: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: '#111827', marginBottom: 20 },
});
