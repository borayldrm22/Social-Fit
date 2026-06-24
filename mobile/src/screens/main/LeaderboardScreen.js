import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_W } = Dimensions.get('window');

const PERIODS = [
  { key: 'week',  label: 'Haftalık',  icon: '📅' },
  { key: 'month', label: 'Aylık',     icon: '🗓️' },
  { key: 'all',   label: 'Tüm Zamanlar', icon: '🏛️' },
];

const GREEN        = '#2D6A4F';
const GREEN_DARK   = '#1B4332';
const GREEN_MID    = '#40916C';
const GREEN_XL     = '#D8F3DC';
const GOLD         = '#F59E0B';
const GOLD_L       = '#FEF3C7';
const SILVER       = '#94A3B8';
const SILVER_L     = '#F1F5F9';
const BRONZE       = '#CD7F32';
const BRONZE_L     = '#FEF0E6';
const ORANGE       = '#F4845F';
const ORANGE_L     = '#FDDDD5';

function getInitials(name) {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

function getPointsForPeriod(item, period) {
  if (period === 'week')  return item.weekPoints  ?? 0;
  if (period === 'month') return item.monthPoints ?? 0;
  return item.allTimePoints ?? item.totalPoints ?? 0;
}

const MOCK_DATA = {
  myRank: 5,
  myPoints: 340,
  leaderboard: [
    { userId: 'm1', rank: 1, displayName: 'Ayşe Kaya',      avatarUrl: null, weekPoints: 980, monthPoints: 3800, allTimePoints: 12400, currentStreak: 21 },
    { userId: 'm2', rank: 2, displayName: 'Mehmet Demir',   avatarUrl: null, weekPoints: 870, monthPoints: 3400, allTimePoints: 10900, currentStreak: 14 },
    { userId: 'm3', rank: 3, displayName: 'Zeynep Arslan',  avatarUrl: null, weekPoints: 760, monthPoints: 2900, allTimePoints: 9300,  currentStreak: 9  },
    { userId: 'm4', rank: 4, displayName: 'Can Yılmaz',     avatarUrl: null, weekPoints: 640, monthPoints: 2500, allTimePoints: 8100,  currentStreak: 6  },
    { userId: 'm5', rank: 5, displayName: 'Sen',            avatarUrl: null, weekPoints: 340, monthPoints: 1200, allTimePoints: 4200,  currentStreak: 4  },
    { userId: 'm6', rank: 6, displayName: 'Elif Şahin',     avatarUrl: null, weekPoints: 290, monthPoints: 1050, allTimePoints: 3800,  currentStreak: 3  },
    { userId: 'm7', rank: 7, displayName: 'Burak Çelik',    avatarUrl: null, weekPoints: 230, monthPoints: 890,  allTimePoints: 3100,  currentStreak: 2  },
    { userId: 'm8', rank: 8, displayName: 'Selin Aydın',    avatarUrl: null, weekPoints: 180, monthPoints: 720,  allTimePoints: 2600,  currentStreak: 1  },
    { userId: 'm9', rank: 9, displayName: 'Emre Koç',       avatarUrl: null, weekPoints: 120, monthPoints: 540,  allTimePoints: 1900,  currentStreak: 0  },
    { userId: 'm10',rank:10, displayName: 'Nur Öztürk',     avatarUrl: null, weekPoints: 80,  monthPoints: 310,  allTimePoints: 1100,  currentStreak: 0  },
  ],
};

const RANK_CONFIG = {
  1: { medal: '🥇', color: GOLD,   light: GOLD_L,   label: '1.',  size: 72 },
  2: { medal: '🥈', color: SILVER, light: SILVER_L, label: '2.',  size: 60 },
  3: { medal: '🥉', color: BRONZE, light: BRONZE_L, label: '3.',  size: 56 },
};

function Avatar({ url, name, size, borderColor }) {
  const initials = getInitials(name);
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={[styles.avatarImg, { width: size, height: size, borderRadius: size / 2, borderColor }]}
      />
    );
  }
  return (
    <View style={[
      styles.avatarFallback,
      { width: size, height: size, borderRadius: size / 2, borderColor, backgroundColor: borderColor + '33' }
    ]}>
      <Text style={[styles.avatarInitials, { fontSize: size * 0.36, color: borderColor }]}>{initials}</Text>
    </View>
  );
}

function PodiumPillar({ item, rank, period, onPress }) {
  const cfg = RANK_CONFIG[rank];
  const pts = getPointsForPeriod(item, period);
  const pillarHeights = { 1: 100, 2: 72, 3: 56 };
  const marginTops    = { 1: 0,   2: 28, 3: 44 };

  return (
    <TouchableOpacity
      style={[styles.podiumCol, { marginTop: marginTops[rank] }]}
      onPress={() => onPress?.(item)}
      activeOpacity={0.85}
    >
      <Text style={styles.podiumMedalEmoji}>{cfg.medal}</Text>

      <View style={styles.podiumAvatarWrap}>
        <Avatar
          url={item.avatarUrl}
          name={item.displayName}
          size={cfg.size}
          borderColor={cfg.color}
        />
        {rank === 1 && (
          <View style={styles.crownWrap}>
            <Text style={styles.crownEmoji}>👑</Text>
          </View>
        )}
      </View>

      <Text style={styles.podiumName} numberOfLines={1}>
        {item.displayName || 'Kullanıcı'}
      </Text>

      {rank === 1 && item.currentStreak > 0 && (
        <View style={styles.streakPill}>
          <Text style={styles.streakPillText}>🔥 {item.currentStreak} gün</Text>
        </View>
      )}

      <View style={[styles.podiumPtsBadge, { backgroundColor: cfg.light }]}>
        <Text style={[styles.podiumPtsText, { color: cfg.color }]}>{pts}</Text>
        <Text style={[styles.podiumPtsLabel, { color: cfg.color + 'AA' }]}>puan</Text>
      </View>

      <View style={[styles.podiumBase, { height: pillarHeights[rank], backgroundColor: cfg.color + '22', borderTopColor: cfg.color }]}>
        <Text style={[styles.podiumRankLabel, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function LeaderboardScreen({ navigation }) {
  const api = useApi();
  const { user } = useAuth();
  const [period, setPeriod]     = useState('week');
  const [data, setData]         = useState({ leaderboard: [], myRank: null, myPoints: 0 });
  const [streak, setStreak]     = useState({ currentStreak: 0, starPoints: 0, badges: [] });
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const tabAnim = useRef(new Animated.Value(0)).current;

  const loadLeaderboard = useCallback(async (p) => {
    try {
      const res = await api.get(`/api/leaderboard?period=${p || period}`);
      const list = res.leaderboard || [];
      setData(list.length > 0 ? res : MOCK_DATA);
    } catch {
      setData(MOCK_DATA);
    }
  }, [api, period]);

  const loadStreak = useCallback(async () => {
    try {
      const res = await api.get('/api/streaks/me');
      setStreak({ currentStreak: res.currentStreak ?? 4, starPoints: res.starPoints ?? 340, badges: res.badges ?? [] });
    } catch {
      setStreak({ currentStreak: 4, starPoints: 340, badges: [{ id: 'streak7' }] });
    }
  }, [api]);

  const load = useCallback(async (p = period) => {
    setLoading(true);
    await Promise.all([loadLeaderboard(p), loadStreak()]);
    setLoading(false);
  }, [loadLeaderboard, loadStreak, period]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(period);
    setRefreshing(false);
  }, [load, period]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onPeriodChange = useCallback((p, idx) => {
    setPeriod(p);
    load(p);
    Animated.spring(tabAnim, { toValue: idx, useNativeDriver: false, tension: 80, friction: 10 }).start();
  }, [load, tabAnim]);

  const openChat = useCallback((item) => {
    const parent = navigation.getParent?.();
    if (parent) {
      parent.navigate('Messages', {
        screen: 'Chat',
        params: { userId: item.userId, displayName: item.displayName || 'Kullanıcı', avatarUrl: item.avatarUrl ?? null },
      });
    }
  }, [navigation]);

  const profile = user?.profile || {};
  const list    = data.leaderboard || [];
  const top3    = list.slice(0, 3);
  const rest    = list.slice(3);

  const tabW    = (SCREEN_W - 32) / PERIODS.length;
  const tabLeft = tabAnim.interpolate({ inputRange: [0, 1, 2], outputRange: [0, tabW, tabW * 2] });

  const myIdx = PERIODS.findIndex((p) => p.key === period);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Gradient Hero ── */}
        <LinearGradient
          colors={[GREEN_DARK, GREEN, GREEN_MID]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {/* Başlık + Avatar */}
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroTitle}>Lider Tablosu</Text>
              <Text style={styles.heroSub}>En aktif olmak için yarış! 🏆</Text>
            </View>
            {profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.heroAvatar} />
            ) : (
              <View style={[styles.heroAvatar, styles.heroAvatarFallback]}>
                <Text style={styles.heroAvatarText}>
                  {(profile.displayName || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* 3 stat kutusu */}
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>⭐</Text>
              <Text style={styles.statVal}>{streak.starPoints}</Text>
              <Text style={styles.statLbl}>Puanım</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxCenter]}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statVal}>{streak.currentStreak}</Text>
              <Text style={styles.statLbl}>Streak</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>🏅</Text>
              <Text style={styles.statVal}>{streak.badges?.length ?? 0}</Text>
              <Text style={styles.statLbl}>Rozet</Text>
            </View>
          </View>

          {/* Sıram kartı */}
          {data.myRank != null && (
            <View style={styles.myRankRow}>
              <Ionicons name="podium-outline" size={18} color="rgba(255,255,255,0.7)" />
              <Text style={styles.myRankLabel}>Sıran:</Text>
              <Text style={styles.myRankNum}>#{data.myRank}</Text>
              <View style={styles.myRankDot} />
              <Text style={styles.myRankPts}>{data.myPoints ?? 0} puan</Text>
            </View>
          )}
        </LinearGradient>

        {/* ── Dönem Seçici Tab ── */}
        <View style={styles.tabBarWrap}>
          <View style={styles.tabBar}>
            <Animated.View style={[styles.tabIndicator, { width: tabW, left: tabLeft }]} />
            {PERIODS.map((p, idx) => (
              <TouchableOpacity
                key={p.key}
                style={[styles.tab, { width: tabW }]}
                onPress={() => onPeriodChange(p.key, idx)}
                activeOpacity={0.7}
              >
                <Text style={styles.tabIcon}>{p.icon}</Text>
                <Text style={[styles.tabText, period === p.key && styles.tabTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading && list.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Yükleniyor...</Text>
          </View>
        ) : list.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="trophy-outline" size={52} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Henüz veri yok</Text>
            <Text style={styles.emptyText}>Bu dönem için puan kaydı bulunamadı.</Text>
          </View>
        ) : (
          <>
            {/* ── Podyum ── */}
            <View style={styles.podiumSection}>
              <View style={styles.podiumWrap}>
                {/* 2. */}
                {top3[1] && <PodiumPillar item={top3[1]} rank={2} period={period} onPress={openChat} />}
                {/* 1. */}
                {top3[0] && <PodiumPillar item={top3[0]} rank={1} period={period} onPress={openChat} />}
                {/* 3. */}
                {top3[2] && <PodiumPillar item={top3[2]} rank={3} period={period} onPress={openChat} />}
              </View>
            </View>

            {/* ── 4.+ Liste ── */}
            {rest.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.listTitle}>Diğer Sıralamalar</Text>
                {rest.map((item, i) => {
                  const pts    = getPointsForPeriod(item, period);
                  const maxPts = getPointsForPeriod(list[0], period) || 1;
                  const pct    = Math.max(4, Math.round((pts / maxPts) * 100));
                  const isSelf = item.userId === user?.id || item.userId === 'm5';

                  return (
                    <View
                      key={item.userId}
                      style={[styles.leaderRow, isSelf && styles.leaderRowSelf]}
                    >
                      {/* Sıra */}
                      <View style={styles.rankNumWrap}>
                        <Text style={[styles.rankNum, isSelf && styles.rankNumSelf]}>
                          {item.rank}
                        </Text>
                      </View>

                      {/* Avatar */}
                      <Avatar
                        url={item.avatarUrl}
                        name={item.displayName}
                        size={44}
                        borderColor={isSelf ? GREEN : '#E5E7EB'}
                      />

                      {/* İsim + Bar */}
                      <View style={styles.leaderInfo}>
                        <View style={styles.leaderTopRow}>
                          <Text style={[styles.leaderName, isSelf && styles.leaderNameSelf]} numberOfLines={1}>
                            {item.displayName || 'Kullanıcı'}
                            {isSelf ? ' (Sen)' : ''}
                          </Text>
                          {item.currentStreak > 0 && (
                            <View style={styles.streakBadge}>
                              <Text style={styles.streakBadgeText}>🔥 {item.currentStreak}</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: isSelf ? GREEN : GREEN_XL }]} />
                        </View>
                      </View>

                      {/* Puan */}
                      <View style={styles.ptsWrap}>
                        <Text style={[styles.ptsVal, isSelf && styles.ptsValSelf]}>{pts}</Text>
                        <Text style={styles.ptsLbl}>puan</Text>
                      </View>

                      {/* Meydan oku */}
                      {!isSelf && (
                        <TouchableOpacity
                          style={styles.challengeBtn}
                          onPress={() => openChat(item)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="flash-outline" size={14} color={ORANGE} />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7FAF8' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  // ── Hero ──────────────────────────────────────────────────
  hero: {
    paddingTop: 52, paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  heroTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 22,
  },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  heroAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.4)' },
  heroAvatarFallback: { backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  heroAvatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },

  // Stat kutuları
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16, paddingVertical: 14, alignItems: 'center',
  },
  statBoxCenter: { backgroundColor: 'rgba(255,255,255,0.2)' },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statVal:  { fontSize: 22, fontWeight: '900', color: '#fff' },
  statLbl:  { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  // Sıram satırı
  myRankRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14, paddingVertical: 11, paddingHorizontal: 16,
  },
  myRankLabel: { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  myRankNum:   { fontSize: 18, fontWeight: '900', color: '#fff' },
  myRankDot:   { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },
  myRankPts:   { fontSize: 14, color: 'rgba(255,255,255,0.75)' },

  // ── Tab Bar ───────────────────────────────────────────────
  tabBarWrap: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 4 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 16, height: 48,
    position: 'relative', overflow: 'hidden',
  },
  tabIndicator: {
    position: 'absolute', top: 4, bottom: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  tab: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, zIndex: 1,
  },
  tabIcon: { fontSize: 14 },
  tabText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  tabTextActive: { color: GREEN, fontWeight: '700' },

  // ── Podyum ────────────────────────────────────────────────
  podiumSection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  podiumWrap: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 24, paddingTop: 24, paddingBottom: 0,
    paddingHorizontal: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
    overflow: 'hidden',
  },
  podiumCol: { flex: 1, alignItems: 'center' },
  podiumMedalEmoji: { fontSize: 26, marginBottom: 6 },

  podiumAvatarWrap: { position: 'relative', marginBottom: 8 },
  avatarImg: { borderWidth: 3 },
  avatarFallback: {
    borderWidth: 3,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials: { fontWeight: '800' },
  crownWrap: {
    position: 'absolute', top: -18, left: 0, right: 0,
    alignItems: 'center',
  },
  crownEmoji: { fontSize: 22 },

  podiumName: { fontSize: 12, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 4, paddingHorizontal: 4 },
  streakPill: {
    backgroundColor: ORANGE_L, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, marginBottom: 6,
  },
  streakPillText: { fontSize: 11, color: ORANGE, fontWeight: '700' },
  podiumPtsBadge: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, marginBottom: 10, alignItems: 'center',
  },
  podiumPtsText: { fontSize: 16, fontWeight: '900' },
  podiumPtsLabel: { fontSize: 10, fontWeight: '600', marginTop: 1 },

  podiumBase: {
    width: '100%', alignItems: 'center', justifyContent: 'center',
    borderTopWidth: 2,
  },
  podiumRankLabel: { fontSize: 15, fontWeight: '900', paddingTop: 8, paddingBottom: 6 },

  // ── Sıralama Listesi ──────────────────────────────────────
  listSection: { paddingHorizontal: 16, paddingTop: 16 },
  listTitle: {
    fontSize: 14, fontWeight: '700', color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 12, marginLeft: 2,
  },

  leaderRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14,
    marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  leaderRowSelf: {
    backgroundColor: GREEN_XL,
    borderWidth: 1.5, borderColor: GREEN,
  },

  rankNumWrap: { width: 28, alignItems: 'center' },
  rankNum: { fontSize: 14, fontWeight: '700', color: '#9CA3AF' },
  rankNumSelf: { color: GREEN },

  leaderInfo: { flex: 1, marginLeft: 10 },
  leaderTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  leaderName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  leaderNameSelf: { color: GREEN_DARK, fontWeight: '700' },
  streakBadge: {
    backgroundColor: GOLD_L, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
  },
  streakBadgeText: { fontSize: 11, color: '#B45309', fontWeight: '700' },

  barTrack: { height: 5, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 4 },

  ptsWrap: { alignItems: 'flex-end', marginLeft: 10 },
  ptsVal:  { fontSize: 16, fontWeight: '900', color: '#374151' },
  ptsValSelf: { color: GREEN },
  ptsLbl:  { fontSize: 10, color: '#9CA3AF' },

  challengeBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: ORANGE_L,
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 8,
  },

  // ── Boş ──────────────────────────────────────────────────
  emptyWrap: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151' },
  emptyText:  { fontSize: 14, color: '#9CA3AF' },
});
