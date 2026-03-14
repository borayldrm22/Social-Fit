import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useApi } from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#2d6a4f';

function formatSlot(slotAt) {
  const d = new Date(slotAt);
  return {
    date: d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' }),
    time: d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    iso: slotAt,
  };
}

export default function CoachBookingScreen({ route, navigation }) {
  const coachId = route.params?.coachId;
  const api = useApi();
  const [coach, setCoach] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [coachError, setCoachError] = useState(null);

  const loadCoach = useCallback(async () => {
    if (!coachId) {
      setCoachError('Koç bilgisi yok.');
      setLoading(false);
      return;
    }
    try {
      const data = await api.get(`/api/coaches/${coachId}`);
      setCoach(data);
      setCoachError(null);
    } catch (e) {
      setCoach(null);
      setCoachError(e.message || 'Koç yüklenemedi.');
    }
  }, [coachId, api]);

  const loadSlots = useCallback(async () => {
    if (!coachId) return;
    try {
      const data = await api.get(`/api/coaches/${coachId}/slots`);
      const list = (data.slots || []).map((s) => formatSlot(s.slotAt));
      setSlots(list);
    } catch (e) {
      setSlots([]);
    }
  }, [coachId, api]);

  const load = useCallback(async () => {
    setLoading(true);
    await loadCoach();
    await loadSlots();
    setLoading(false);
  }, [loadCoach, loadSlots]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const bookSlot = async (slotAt) => {
    if (!coach) return;
    try {
      const b = await api.post('/api/bookings', { coachId: coach.id, slotAt });
      setBooking(b);
      Alert.alert('Randevu Alındı', `${coach.displayName} ile randevunuz kaydedildi. Ödeme ekranı yakında eklenecek.`, [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Hata', e.message || 'Randevu alınamadı.');
    }
  };

  if (!coachId) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Koç bilgisi yok. Lütfen listeden bir diyetisyen seçin.</Text>
      </View>
    );
  }

  if (coachError && !coach) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>{coachError}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {coach && (
        <>
          <View style={styles.header}>
            <Text style={styles.coachName}>{coach.displayName}</Text>
            {coach.bio ? <Text style={styles.coachBio}>{coach.bio}</Text> : null}
          </View>
          <Text style={styles.sectionTitle}>Müsait saatler</Text>
        </>
      )}
      {loading && !coach ? (
        <Text style={styles.empty}>Yükleniyor...</Text>
      ) : (
        <FlatList
          data={slots}
          keyExtractor={(item) => item.iso}
          ListEmptyComponent={<Text style={styles.empty}>Müsait slot bulunamadı.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.slot}
              onPress={() => bookSlot(item.iso)}
              activeOpacity={0.7}
            >
              <Text style={styles.slotDate}>{item.date}</Text>
              <Text style={styles.slotTime}>{item.time}</Text>
              <Ionicons name="calendar-outline" size={18} color={PRIMARY} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#fff', padding: 16, marginBottom: 8 },
  coachName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  coachBio: { fontSize: 14, color: '#6b7280', marginTop: 6 },
  sectionTitle: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, fontSize: 15, fontWeight: '600', color: '#374151' },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 6,
    padding: 14,
    borderRadius: 10,
  },
  slotDate: { flex: 1, fontSize: 15, color: '#111827' },
  slotTime: { fontSize: 15, fontWeight: '600', color: PRIMARY, marginRight: 10 },
  empty: { textAlign: 'center', padding: 24, color: '#6b7280' },
});
