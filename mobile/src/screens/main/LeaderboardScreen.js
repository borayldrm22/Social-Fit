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
  { key: 'week', label: 'Haftalık' },
  { key: 'month', label: 'Aylık' },
  { key: 'all', label: 'Tüm Zamanlar' },
];

const PRIMARY_GREEN = '#2d6a4f';
const FOOTER_BG = '#1b4332';

export default function LeaderboardScreen({ navigation }) {
  const api = useApi();
  const { user } = useAuth();
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState({ leaderboard: [], period: 'month', myRank: null, myPoints: 0 });
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
            displayName: item.profile?.displayName || 'Kullanıcı',
            avatarUrl: item.profile?.avatarUrl ?? null,
          },
        });
      }
    },
    [navigation]
  );

  const profile = user?.profile || {};
  const list = data.leaderboard || [];
  const top7 = list.slice(0, 7);
  const maxPoints = Math.max(...top7.map((e) => e.points), 1);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Personal block */}
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
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
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

      {/* 2. Leaderboard block */}
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
          list.map((item) => {
            const is1 = item.rank === 1;
            const is2 = item.rank === 2;
            const is3 = item.rank === 3;
            const rowStyle = [
              styles.leaderRow,
              is1 && styles.leaderRow1,
              is2 && styles.leaderRow2,
              is3 && styles.leaderRow3,
            ];
            return (
              <View key={item.userId} style={rowStyle}>
                <Text style={styles.leaderRank}>#{item.rank}</Text>
                {item.profile?.avatarUrl ? (
                  <Image source={{ uri: item.profile.avatarUrl }} style={styles.leaderAvatar} />
                ) : (
                  <View style={[styles.leaderAvatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={20} color="#9ca3af" />
                  </View>
                )}
                <View style={styles.leaderInfo}>
                  <Text style={styles.leaderName} numberOfLines={1}>
                    {item.profile?.displayName || 'Kullanıcı'}
                  </Text>
                  <Text style={styles.leaderMeta}>
                    Seri: {item.currentStreak ?? 0} gün | Yıldız: {item.starPoints ?? item.points}
                  </Text>
                </View>
                {item.rank > 7 && (
                  <TouchableOpacity style={styles.challengeBtn} onPress={() => openChat(item)}>
                    <Text style={styles.challengeBtnText}>Meydan oku</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
        {(data.myRank != null || data.myPoints > 0) && (
          <View style={styles.footerBar}>
            <Text style={styles.footerText}>
              Sıralaman: {data.myRank ?? '–'}. | Paylaşmaya devam et… Grup meydan okumalarına katılarak daha fazla yıldız kazan!
            </Text>
          </View>
        )}
      </View>

      {/* 3. Your rank + chart */}
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
        {top7.length > 0 && (
          <View style={styles.chartBlock}>
            {top7.map((entry) => (
              <View key={entry.userId} style={styles.chartRow}>
                <Text style={styles.chartRank}>Sıra {entry.rank}</Text>
                <View style={styles.chartBarWrap}>
                  <View
                    style={[
                      styles.chartBar,
                      { width: `${(entry.points / maxPoints) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.chartPoints}>{entry.points}</Text>
              </View>
            ))}
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
  leaderRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12,
    marginBottom: 4, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
  },
  leaderRow1: { backgroundColor: '#fef3c7' },
  leaderRow2: { backgroundColor: '#f3f4f6' },
  leaderRow3: { backgroundColor: '#ffedd5' },
  leaderRank: { width: 32, fontWeight: '700', color: PRIMARY_GREEN, fontSize: 14 },
  leaderAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  leaderInfo: { flex: 1 },
  leaderName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  leaderMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  challengeBtn: { backgroundColor: PRIMARY_GREEN, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  challengeBtnText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  footerBar: {
    backgroundColor: FOOTER_BG, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginTop: 12,
  },
  footerText: { fontSize: 13, color: '#fff', textAlign: 'center' },
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
  chartBar: { height: '100%', backgroundColor: PRIMARY_GREEN, borderRadius: 4 },
  chartPoints: { fontSize: 12, fontWeight: '600', color: '#374151', width: 40, textAlign: 'right' },
});
