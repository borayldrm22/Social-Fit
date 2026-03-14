import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const PERIODS = [
  { key: 'week', label: 'Bu Hafta' },
  { key: 'month', label: 'Bu Ay' },
  { key: 'all', label: 'Tüm Zamanlar' },
];

const PRIMARY_GREEN = '#2d6a4f';
const GOLD = '#f59e0b';
const SILVER = '#9ca3af';
const BRONZE = '#CD7F32';

function getInitials(displayName) {
  if (!displayName || !displayName.trim()) return '?';
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return displayName.trim().slice(0, 2).toUpperCase();
}

function getPointsForPeriod(item, period) {
  if (period === 'week') return item.weekPoints ?? 0;
  if (period === 'month') return item.monthPoints ?? 0;
  return item.allTimePoints ?? item.totalPoints ?? 0;
}

export default function LeaderboardScreen({ navigation }) {
  const api = useApi();
  const { user } = useAuth();
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState({ leaderboard: [], period: 'week', myRank: null, myPoints: 0 });
  const [streak, setStreak] = useState({ currentStreak: 0, starPoints: 0, badges: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef(null);
  const listSectionRef = useRef(null);
  const listSectionYRef = useRef(0);

  const loadLeaderboard = useCallback(
    async (p) => {
      try {
        const res = await api.get(`/api/leaderboard?period=${p || period}`);
        setData(res);
      } catch (e) {
        setData({ leaderboard: [], period: p || period, myRank: null, myPoints: 0 });
      }
    },
    [api, period]
  );

  const loadStreak = useCallback(async () => {
    try {
      const res = await api.get('/api/streaks/me');
      setStreak({
        currentStreak: res.currentStreak ?? 0,
        starPoints: res.starPoints ?? 0,
        badges: res.badges ?? [],
      });
    } catch (e) {}
  }, [api]);

  const load = useCallback(
    async (p = period) => {
      setLoading(true);
      await Promise.all([loadLeaderboard(p), loadStreak()]);
      setLoading(false);
    },
    [loadLeaderboard, loadStreak, period]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(period);
    setRefreshing(false);
  }, [load, period]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onPeriodChange = useCallback(
    (p) => {
      setPeriod(p);
      load(p);
    },
    [load]
  );

  const scrollToList = useCallback(() => {
    scrollRef.current?.scrollTo({ y: listSectionYRef.current, animated: true });
  }, []);

  const openChat = useCallback(
    (item) => {
      const parent = navigation.getParent?.();
      if (parent) {
        parent.navigate('Messages', {
          screen: 'Chat',
          params: {
            userId: item.userId,
            displayName: item.displayName || 'Kullanıcı',
            avatarUrl: item.avatarUrl ?? null,
          },
        });
      }
    },
    [navigation]
  );

  const profile = user?.profile || {};
  const list = data.leaderboard || [];
  const top3 = list.slice(0, 3);
  const rest = list.slice(3, 50);

  const rankColor = (rank) => {
    if (rank === 1) return GOLD;
    if (rank === 2) return SILVER;
    if (rank === 3) return BRONZE;
    return '#6b7280';
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Personal block */}
      <View style={styles.personalBlock}>
        <View style={styles.welcomeRow}>
          <Text style={styles.welcomeText}>Lider tablosuna hoş geldin</Text>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.welcomeAvatar} />
          ) : (
            <View style={[styles.welcomeAvatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={28} color="#9ca3af" />
            </View>
          )}
        </View>
        <View style={styles.statsRow}>
          <View style={styles.starBox}>
            <Text style={styles.starValue}>{streak.starPoints}</Text>
            <Text style={styles.starLabel}>puan</Text>
          </View>
          <View style={styles.streakCircle}>
            <Text style={styles.streakValue}>{streak.currentStreak}</Text>
            <Text style={styles.streakLabel}>gün seri</Text>
          </View>
        </View>
        <Text style={styles.ctaText}>Aktif kal, yıldız kazan!</Text>
        <View style={styles.calendarStrip}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const isToday = i === 6;
            return (
              <View
                key={i}
                style={[styles.calendarDot, isToday && styles.calendarDotActive]}
              />
            );
          })}
        </View>
        <View style={styles.challengesCard}>
          <Text style={styles.challengesTitle}>Meydan okumalara katıl</Text>
          <View style={styles.challengeRow}>
            <Text style={styles.challengeCol}>Lider</Text>
            <Text style={styles.challengeCol}>Üst</Text>
            <Text style={styles.challengeCol}>Koru</Text>
          </View>
          <View style={styles.challengeRow}>
            <Text style={styles.challengeVal}>5</Text>
            <Text style={styles.challengeVal}>10</Text>
            <Text style={styles.challengeVal}>1</Text>
          </View>
          <View style={styles.progressRow}>
            <View style={[styles.progressBar, styles.progressFill, { width: '60%' }]} />
            <View style={[styles.progressBar, styles.progressFill, { width: '40%' }]} />
            <View style={[styles.progressBar, styles.progressFill, { width: '10%' }]} />
          </View>
          <View style={styles.challengeRow}>
            <Text style={styles.challengeLabel}>Kazanılan</Text>
            <Text style={styles.challengeLabel}>Kazanılan</Text>
            <Text style={styles.challengeLabel}>Kazanılan</Text>
          </View>
          <View style={styles.challengeRow}>
            <Text style={styles.challengeVal}>{streak.badges?.length ?? 0}</Text>
            <Text style={styles.challengeVal}>0</Text>
            <Text style={styles.challengeVal}>0</Text>
          </View>
          <View style={styles.progressRow}>
            <View style={[styles.progressBar, styles.progressFill, { width: `${Math.min(100, ((streak.badges?.length ?? 0) / 5) * 100)}%` }]} />
            <View style={[styles.progressBar, { width: '100%' }]} />
            <View style={[styles.progressBar, { width: '100%' }]} />
          </View>
          <View style={styles.rewardsRow}>
            <Text style={styles.rewardsLabel}>Ödüller</Text>
            <Text style={styles.rewardsVal}>Koçluk, Premium, 15</Text>
          </View>
        </View>
      </View>

      {/* Leaderboard block */}
      <View
        ref={listSectionRef}
        onLayout={(e) => { listSectionYRef.current = e.nativeEvent.layout.y; }}
        style={styles.leaderboardBlock}
      >
        <View style={styles.leaderboardHeader}>
          <View style={styles.leaderboardTitleRow}>
            <Ionicons name="trophy" size={22} color={PRIMARY_GREEN} style={styles.trophyIcon} />
            <Text style={styles.leaderboardTitle}>Social Fit Lider Tablosu</Text>
          </View>
          <TouchableOpacity onPress={scrollToList}>
            <Text style={styles.rewardsLink}>Ödüller</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tabs}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.tab, period === p.key && styles.tabActive]}
              onPress={() => onPeriodChange(p.key)}
            >
              <Text style={[styles.tabText, period === p.key && styles.tabTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {loading && list.length === 0 ? (
          <Text style={styles.empty}>Yükleniyor...</Text>
        ) : list.length === 0 ? (
          <Text style={styles.empty}>Henüz veri yok.</Text>
        ) : (
          <>
            {/* Top 3 podium cards */}
            <View style={styles.podiumRow}>
              {top3.map((item) => {
                const accent = item.rank === 1 ? GOLD : item.rank === 2 ? SILVER : BRONZE;
                const isSecond = item.rank === 2;
                return (
                  <View
                    key={item.userId}
                    style={[
                      styles.podiumCard,
                      { borderColor: accent, backgroundColor: `${accent}12` },
                      isSecond && styles.podiumCardSecond,
                    ]}
                  >
                    <Text style={[styles.podiumRank, { color: accent }]}>{item.rank}</Text>
                    {item.avatarUrl ? (
                      <Image source={{ uri: item.avatarUrl }} style={styles.podiumAvatar} />
                    ) : (
                      <View style={[styles.podiumAvatar, styles.podiumAvatarPlaceholder, { backgroundColor: accent }]}>
                        <Text style={styles.podiumInitials}>{getInitials(item.displayName)}</Text>
                      </View>
                    )}
                    <Text style={styles.podiumName} numberOfLines={1}>{item.displayName || 'Kullanıcı'}</Text>
                    <View style={styles.podiumStreakBadge}>
                      <Text style={styles.podiumStreakText}>🔥 {item.currentStreak ?? 0}</Text>
                    </View>
                    <Text style={[styles.podiumPoints, { color: accent }]}>
                      {getPointsForPeriod(item, period)}
                    </Text>
                    <Text style={styles.podiumPointsLabel}>puan</Text>
                  </View>
                );
              })}
            </View>
            {/* Ranks 4–50 */}
            {rest.map((item) => (
              <View key={item.userId} style={styles.leaderRow}>
                <Text style={[styles.leaderRank, { color: rankColor(item.rank) }]}>{item.rank}</Text>
                {item.avatarUrl ? (
                  <Image source={{ uri: item.avatarUrl }} style={styles.leaderAvatar} />
                ) : (
                  <View style={[styles.leaderAvatar, styles.avatarPlaceholder]}>
                    <Text style={styles.leaderInitials}>{getInitials(item.displayName)}</Text>
                  </View>
                )}
                <View style={styles.leaderInfo}>
                  <View style={styles.leaderNameRow}>
                    <Text style={styles.leaderName} numberOfLines={1}>{item.displayName || 'Kullanıcı'}</Text>
                    <View style={styles.streakBadge}>
                      <Text style={styles.streakBadgeText}>🔥 {item.currentStreak ?? 0}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.leaderPoints}>{getPointsForPeriod(item, period)}</Text>
                {item.rank > 7 && (
                  <TouchableOpacity style={styles.challengeBtn} onPress={() => openChat(item)}>
                    <Text style={styles.challengeBtnText}>Meydan oku</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </>
        )}

        {/* My rank banner */}
        <View style={styles.myRankBanner}>
          <Text style={styles.myRankText}>
            Sıran: #{data.myRank ?? '–'} · {data.myPoints ?? 0} puan
          </Text>
        </View>
      </View>

      {/* Your rank + chart */}
      <View style={styles.yourRankBlock}>
        <Text style={styles.yourRankTitle}>Sıralaman</Text>
        <Text style={styles.yourRankSub}>
          {data.myRank != null
            ? data.myRank <= 10
              ? `Bu dönem Top ${data.myRank}`
              : `${data.myRank}. sıradasın`
            : 'Henüz sıralama yok'}
        </Text>
        <TouchableOpacity style={styles.detailsBtn} onPress={scrollToList}>
          <Text style={styles.detailsBtnText}>Detayları gör</Text>
        </TouchableOpacity>
        {list.length > 0 && (
          <View style={styles.chartBlock}>
            {list.slice(0, 7).map((entry) => {
              const maxPoints = Math.max(...list.slice(0, 7).map((e) => getPointsForPeriod(e, period)), 1);
              const points = getPointsForPeriod(entry, period);
              return (
                <View key={entry.userId} style={styles.chartRow}>
                  <Text style={styles.chartRank}>Sıra {entry.rank}</Text>
                  <View style={styles.chartBarWrap}>
                    <View
                      style={[
                        styles.chartBar,
                        { width: `${(points / maxPoints) * 100}%`, backgroundColor: rankColor(entry.rank) },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartPoints}>{points}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingBottom: 32 },
  personalBlock: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  welcomeText: { fontSize: 18, fontWeight: '600', color: '#111827' },
  welcomeAvatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 8 },
  starBox: {},
  starValue: { fontSize: 28, fontWeight: '700', color: PRIMARY_GREEN },
  starLabel: { fontSize: 12, color: '#6b7280' },
  streakCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#e8f5e9',
    justifyContent: 'center', alignItems: 'center',
  },
  streakValue: { fontSize: 20, fontWeight: '700', color: PRIMARY_GREEN },
  streakLabel: { fontSize: 10, color: '#6b7280' },
  ctaText: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  calendarStrip: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  calendarDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb' },
  calendarDotActive: { backgroundColor: PRIMARY_GREEN },
  challengesCard: {
    backgroundColor: '#f9fafb', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb',
  },
  challengesTitle: { fontSize: 16, fontWeight: '700', color: PRIMARY_GREEN, marginBottom: 12 },
  challengeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  challengeCol: { fontSize: 12, color: '#6b7280', flex: 1 },
  challengeVal: { fontSize: 12, fontWeight: '600', color: '#374151', flex: 1 },
  challengeLabel: { fontSize: 11, color: '#9ca3af', flex: 1 },
  progressRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#e5e7eb', borderRadius: 3 },
  progressFill: { backgroundColor: PRIMARY_GREEN },
  rewardsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  rewardsLabel: { fontSize: 12, color: '#6b7280' },
  rewardsVal: { fontSize: 12, color: '#374151' },
  leaderboardBlock: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  leaderboardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  leaderboardTitleRow: { flexDirection: 'row', alignItems: 'center' },
  trophyIcon: { marginRight: 8 },
  leaderboardTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  rewardsLink: { fontSize: 14, color: PRIMARY_GREEN, fontWeight: '600' },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#f3f4f6' },
  tabActive: { backgroundColor: PRIMARY_GREEN },
  tabText: { fontSize: 14, color: '#6b7280' },
  tabTextActive: { fontSize: 14, color: '#fff', fontWeight: '600' },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  podiumCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    marginHorizontal: 4,
  },
  podiumCardSecond: { marginTop: 24 },
  podiumRank: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  podiumAvatar: { width: 48, height: 48, borderRadius: 24, marginBottom: 6 },
  podiumAvatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  podiumInitials: { fontSize: 18, fontWeight: '700', color: '#fff' },
  podiumName: { fontSize: 12, fontWeight: '600', color: '#111827', marginBottom: 4 },
  podiumStreakBadge: { marginBottom: 4 },
  podiumStreakText: { fontSize: 11, color: '#6b7280' },
  podiumPoints: { fontSize: 18, fontWeight: '800' },
  podiumPointsLabel: { fontSize: 10, color: '#6b7280' },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  leaderRank: { width: 28, fontWeight: '700', fontSize: 15 },
  leaderAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  leaderInitials: { fontSize: 14, fontWeight: '700', color: '#374151' },
  leaderInfo: { flex: 1 },
  leaderNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  leaderName: { fontSize: 15, fontWeight: '600', color: '#111827', marginRight: 6 },
  streakBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  streakBadgeText: { fontSize: 11, color: '#92400e', fontWeight: '600' },
  leaderPoints: { fontSize: 16, fontWeight: '700', color: PRIMARY_GREEN, marginRight: 8 },
  challengeBtn: { backgroundColor: PRIMARY_GREEN, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  challengeBtnText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  myRankBanner: {
    backgroundColor: '#1b4332',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 16,
    alignItems: 'center',
  },
  myRankText: { fontSize: 15, color: '#fff', fontWeight: '700' },
  empty: { textAlign: 'center', padding: 24, color: '#6b7280' },
  yourRankBlock: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 },
  yourRankTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  yourRankSub: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  detailsBtn: { alignSelf: 'flex-start', backgroundColor: '#d1fae5', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  detailsBtnText: { fontSize: 14, color: PRIMARY_GREEN, fontWeight: '600' },
  chartBlock: { marginTop: 16 },
  chartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  chartRank: { width: 56, fontSize: 12, color: '#6b7280' },
  chartBarWrap: { flex: 1, height: 20, backgroundColor: '#e5e7eb', borderRadius: 4, marginHorizontal: 8, overflow: 'hidden' },
  chartBar: { height: '100%', borderRadius: 4 },
  chartPoints: { fontSize: 12, fontWeight: '600', color: '#374151', width: 40, textAlign: 'right' },
});
