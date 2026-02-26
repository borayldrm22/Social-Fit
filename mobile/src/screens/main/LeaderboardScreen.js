import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useApi } from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';

export default function LeaderboardScreen() {
  const api = useApi();
  const [data, setData] = useState({ leaderboard: [], period: 'month' });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/leaderboard?period=month');
      setData(res);
    } catch (e) {
      setData({ leaderboard: [], period: 'month' });
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const list = data.leaderboard || [];
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lider tablosu (bu ay)</Text>
      <FlatList
        data={list}
        keyExtractor={(item) => item.userId}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={<Text style={styles.empty}>Henüz veri yok.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rank}>#{item.rank}</Text>
            <Text style={styles.name}>{item.profile?.displayName || 'Kullanıcı'}</Text>
            <Text style={styles.points}>{item.points} puan</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rank: { width: 36, fontWeight: 'bold', color: '#2d6a4f' },
  name: { flex: 1 },
  points: { color: '#666' },
  empty: { textAlign: 'center', padding: 24, color: '#666' },
});
