import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useApi } from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#2d6a4f';

export default function CoachesScreen({ navigation }) {
  const api = useApi();
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      const data = await api.get('/api/coaches');
      setCoaches(Array.isArray(data) ? data : []);
    } catch (e) {
      setCoaches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useFocusEffect(useCallback(() => { load(true); }, [load]));

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Diyetisyeninizle randevu alın</Text>
      <FlatList
        data={coaches}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.empty}>Yükleniyor...</Text>
          ) : (
            <Text style={styles.empty}>Şu an listelenecek diyetisyen yok.</Text>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CoachBooking', { coachId: item.id })}
          >
            {item.avatarUrl ? (
              <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={32} color="#9ca3af" />
              </View>
            )}
            <View style={styles.cardText}>
              <Text style={styles.name}>{item.displayName}</Text>
              {item.bio ? <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text> : null}
              <Text style={styles.cta}>Randevu seç →</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  subtitle: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, fontSize: 14, color: '#6b7280' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: { backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  cardText: { flex: 1, marginLeft: 14, minWidth: 0 },
  name: { fontSize: 17, fontWeight: '700', color: '#111827' },
  bio: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  cta: { fontSize: 13, color: PRIMARY, fontWeight: '600', marginTop: 6 },
  empty: { textAlign: 'center', padding: 24, color: '#6b7280' },
});
