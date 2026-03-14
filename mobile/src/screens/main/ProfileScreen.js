import React, { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../api/client';
import { Ionicons } from '@expo/vector-icons';
import { formatRelativeTimeShort } from '../../utils/formatRelativeTime';

const REASON_LABELS = {
  post_created: 'Gönderi paylaştın',
  comment_created: 'Yorum yaptın',
  like_received: 'Gönderin beğenildi',
  group_joined: 'Gruba katıldın',
  friend_added: 'Arkadaş edinin',
  profile_completed: 'Profilini tamamladın',
  coach_booked: 'Koç randevusu aldın',
  streak_daily: 'Günlük seri puanı',
};

export default function ProfileScreen() {
  const { user, refreshUser } = useAuth();
  const api = useApi();
  const [starStats, setStarStats] = useState({ starPoints: 0, weekStarPoints: 0, monthStarPoints: 0 });
  const [streak, setStreak] = useState({ currentStreak: 0, badges: [] });
  const [starHistory, setStarHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [meRes, streakRes, historyRes] = await Promise.all([
        api.get('/api/users/me'),
        api.get('/api/streaks/me'),
        api.get('/api/users/me/star-history').catch(() => []),
      ]);
      setStarStats({
        starPoints: meRes.starPoints ?? 0,
        weekStarPoints: meRes.weekStarPoints ?? 0,
        monthStarPoints: meRes.monthStarPoints ?? 0,
      });
      setStreak({
        currentStreak: streakRes.currentStreak ?? 0,
        badges: streakRes.badges ?? [],
      });
      setStarHistory(Array.isArray(historyRes) ? historyRes : []);
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
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{starStats.weekStarPoints}</Text>
          <Text style={styles.statLabel}>Bu Hafta</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{starStats.monthStarPoints}</Text>
          <Text style={styles.statLabel}>Bu Ay</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{starStats.starPoints}</Text>
          <Text style={styles.statLabel}>Toplam</Text>
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
        <Text style={styles.cardTitle}>Puan Geçmişi</Text>
        {starHistory.length > 0 ? (
          starHistory.map((t) => (
            <View key={t.id} style={styles.historyRow}>
              <Text style={styles.historyLabel}>{REASON_LABELS[t.reason] ?? t.reason}</Text>
              <View style={styles.historyRight}>
                <Text style={styles.historyPoints}>+{t.points}</Text>
                <Text style={styles.historyTime}>{formatRelativeTimeShort(t.createdAt)}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.placeholderText}>Henüz puan geçmişi yok</Text>
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
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#2d6a4f' },
  statLabel: { marginTop: 4, fontSize: 12, color: '#6b7280' },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  historyLabel: { fontSize: 14, color: '#374151', flex: 1 },
  historyRight: { flexDirection: 'row', alignItems: 'center' },
  historyPoints: { fontSize: 14, fontWeight: '700', color: '#2d6a4f', marginRight: 12 },
  historyTime: { fontSize: 12, color: '#9ca3af' },
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
