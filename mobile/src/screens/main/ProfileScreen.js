import React, { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../api/client';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, refreshUser } = useAuth();
  const api = useApi();
  const [streak, setStreak] = useState({ currentStreak: 0, starPoints: 0, badges: [] });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get('/api/streaks/me');
      setStreak({ currentStreak: data.currentStreak || 0, starPoints: data.starPoints || 0, badges: data.badges || [] });
    } catch (e) {}
  }, [api]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), load()]);
    setRefreshing(false);
  };

  React.useEffect(() => { load(); }, [load]);

  const profile = user?.profile || {};
  const subtitle = profile.goalNote?.trim() || 'Fitness tutkunu';
  const goalsList = profile.goalNote ? profile.goalNote.trim().split(/\n+/).filter(Boolean) : [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        {profile.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={56} color="#9ca3af" />
          </View>
        )}
        <Text style={styles.displayName}>{profile.displayName || 'Kullanıcı'}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Ionicons name="star" size={22} color="#2d6a4f" />
          <Text style={styles.statValue}>{streak.starPoints}</Text>
          <Text style={styles.statLabel}>Yıldız Puan</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="trophy" size={22} color="#2d6a4f" />
          <Text style={styles.statValue}>{streak.badges?.length ?? 0}</Text>
          <Text style={styles.statLabel}>Başarılar</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="flag" size={22} color="#2d6a4f" />
          <Text style={styles.statValue}>{goalsList.length}</Text>
          <Text style={styles.statLabel}>Hedefler</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Başarılar</Text>
        {streak.badges?.length > 0 ? (
          streak.badges.map((b) => (
            <View key={b.id} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{b.name}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.placeholderText}>Henüz rozet yok</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Hedefler</Text>
        {goalsList.length > 0 ? (
          goalsList.map((goal, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{goal}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.placeholderText}>Hedeflerinizi profil düzenlemeden ekleyin</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Abonelik</Text>
        <Text style={styles.cardRow}>Plan: Premium</Text>
        <Text style={styles.cardRow}>Yenileme: 12 Ara 2023</Text>
        <TouchableOpacity style={styles.manageButton}>
          <Text style={styles.manageButtonText}>Aboneliği Yönet</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  content: { paddingBottom: 24 },
  header: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24 },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  avatarPlaceholder: { backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  displayName: { marginTop: 12, fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { marginTop: 4, fontSize: 14, color: '#6b7280' },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  stat: { alignItems: 'center' },
  statValue: { marginTop: 6, fontSize: 20, fontWeight: '700', color: '#2d6a4f' },
  statLabel: { marginTop: 2, fontSize: 12, color: '#6b7280' },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#2d6a4f', marginBottom: 12 },
  bulletRow: { flexDirection: 'row', marginBottom: 6 },
  bullet: { color: '#2d6a4f', marginRight: 8 },
  bulletText: { flex: 1, fontSize: 14, color: '#374151' },
  placeholderText: { fontSize: 14, color: '#9ca3af' },
  cardRow: { fontSize: 14, color: '#374151', marginBottom: 4 },
  manageButton: { marginTop: 12, backgroundColor: '#2d6a4f', padding: 12, borderRadius: 10, alignItems: 'center' },
  manageButtonText: { color: '#fff', fontWeight: '600' },
});
