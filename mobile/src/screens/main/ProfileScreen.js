import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE } from '../../config';

const GREEN = '#2D6A4F';
const GREEN_DARK = '#1B4332';
const GREEN_XL = '#D8F3DC';
const ORANGE = '#F4845F';
const ORANGE_L = '#FDDDD5';
const GOLD = '#F59E0B';
const GOLD_L = '#FEF3C7';

// Badge definitions with emoji and unlock criteria
const BADGE_DEFS = [
  { id: 'streak7',   emoji: '🔥', label: '7 Günlük Seri',   unlocked: false },
  { id: 'streak14',  emoji: '⚡', label: '14 Gün Devam',    unlocked: false },
  { id: 'streak30',  emoji: '💎', label: '30 Gün Şampiyon', unlocked: false },
  { id: 'post10',    emoji: '📸', label: '10 Gönderi',      unlocked: false },
  { id: 'social',    emoji: '🤝', label: 'Sosyal Kelebek',  unlocked: false },
  { id: 'diet',      emoji: '🥗', label: 'Diyet Ustası',    unlocked: false },
  { id: 'steps',     emoji: '🚶', label: 'Adım Sayacı',     unlocked: false },
  { id: 'coach',     emoji: '👩‍⚕️', label: 'Koç Randevusu',  unlocked: false },
];

// Days of week abbreviated in Turkish
const WEEK_DAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

function avatarUri(profile) {
  const url = profile?.avatarUrl;
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

function getInitial(name) {
  return (name || '?').charAt(0).toUpperCase();
}

export default function ProfileScreen({ navigation }) {
  const { user, refreshUser, logout } = useAuth();
  const api = useApi();

  const [stats, setStats] = useState({
    starPoints: 0,
    postCount: 0,
    followerCount: 0,
    followingCount: 0,
    groupCount: 0,
  });
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0, badges: [] });
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [meRes, streakRes, postsRes] = await Promise.all([
        api.get('/api/users/me'),
        api.get('/api/streaks/me').catch(() => ({ currentStreak: 0, longestStreak: 0, badges: [] })),
        api.get('/api/posts?limit=6').catch(() => []),
      ]);
      setStats({
        starPoints: meRes.starPoints ?? 0,
        postCount: meRes._count?.posts ?? meRes.postCount ?? 0,
        followerCount: meRes._count?.followers ?? meRes.followerCount ?? 0,
        followingCount: meRes._count?.following ?? meRes.followingCount ?? 0,
        groupCount: meRes._count?.groupMemberships ?? meRes.groupCount ?? 0,
      });
      setStreak({
        currentStreak: streakRes.currentStreak ?? 0,
        longestStreak: streakRes.longestStreak ?? 0,
        badges: Array.isArray(streakRes.badges) ? streakRes.badges : [],
      });
      setPosts(Array.isArray(postsRes) ? postsRes.slice(0, 6) : []);
    } catch (e) {}
  }, [api]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), load()]);
    setRefreshing(false);
  };

  const profile = user?.profile || {};
  const displayName = profile.displayName || user?.email?.split('@')[0] || 'Kullanıcı';
  const bio = profile.goalNote?.trim() || 'Fitness tutkunu 💪';

  // Build badge list — mark earned ones from API
  const earnedIds = new Set((streak.badges || []).map((b) => b.id ?? b.name));
  const badgeList = BADGE_DEFS.map((b) => ({
    ...b,
    unlocked: earnedIds.has(b.id) || earnedIds.has(b.label),
  }));
  // Put unlocked badges first
  badgeList.sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0));

  // Weekly activity dots — simulate last 7 days based on streak
  const todayIdx = new Date().getDay(); // 0=Sun
  const weekActivity = WEEK_DAYS.map((_, i) => {
    const daysAgo = ((todayIdx === 0 ? 7 : todayIdx) - 1) - i;
    return daysAgo >= 0 && daysAgo < streak.currentStreak;
  });

  const uri = avatarUri(profile);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
      >
        {/* ── GREEN HEADER ── */}
        <View style={styles.header}>
          {/* Top row: settings + share */}
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate && navigation.navigate('EditProfile')}
            >
              <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="share-social-outline" size={20} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            {uri ? (
              <Image source={{ uri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{getInitial(displayName)}</Text>
              </View>
            )}
            {/* Star points chip on avatar */}
            <View style={styles.starChip}>
              <Text style={styles.starChipText}>⭐ {stats.starPoints}</Text>
            </View>
          </View>

          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.bio} numberOfLines={2}>{bio}</Text>

          {/* Edit profile button */}
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate && navigation.navigate('EditProfile')}
          >
            <Ionicons name="pencil-outline" size={14} color={GREEN} />
            <Text style={styles.editBtnText}>Profili Düzenle</Text>
          </TouchableOpacity>
        </View>

        {/* ── 4-STAT BAR ── */}
        <View style={styles.statBar}>
          <StatItem value={stats.postCount} label="Gönderi" />
          <View style={styles.statDivider} />
          <StatItem value={stats.followerCount} label="Takipçi" />
          <View style={styles.statDivider} />
          <StatItem value={stats.followingCount} label="Takip" />
          <View style={styles.statDivider} />
          <StatItem value={stats.groupCount} label="Grup" />
        </View>

        {/* ── STREAK CARD ── */}
        <View style={styles.streakCard}>
          <View style={styles.streakTop}>
            <View>
              <Text style={styles.streakTitle}>🔥 Günlük Seri</Text>
              <Text style={styles.streakSub}>En uzun: {streak.longestStreak} gün</Text>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeNum}>{streak.currentStreak}</Text>
              <Text style={styles.streakBadgeLabel}>gün</Text>
            </View>
          </View>
          {/* 7-day dots */}
          <View style={styles.weekRow}>
            {WEEK_DAYS.map((day, i) => (
              <View key={day} style={styles.dayCol}>
                <View style={[styles.dayDot, weekActivity[i] && styles.dayDotActive]} />
                <Text style={styles.dayLabel}>{day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── BADGE COLLECTION ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>🏅 Rozetler</Text>
            <Text style={styles.sectionSub}>{badgeList.filter((b) => b.unlocked).length}/{badgeList.length}</Text>
          </View>
          <View style={styles.badgeGrid}>
            {badgeList.map((badge) => (
              <View key={badge.id} style={[styles.badgeItem, !badge.unlocked && styles.badgeItemLocked]}>
                <Text style={[styles.badgeEmoji, !badge.unlocked && styles.badgeEmojiLocked]}>
                  {badge.unlocked ? badge.emoji : '🔒'}
                </Text>
                <Text style={[styles.badgeLabel, !badge.unlocked && styles.badgeLabelLocked]} numberOfLines={2}>
                  {badge.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── POST GRID ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>📸 Gönderiler</Text>
            {posts.length > 0 && (
              <TouchableOpacity>
                <Text style={styles.seeAll}>Tümünü gör</Text>
              </TouchableOpacity>
            )}
          </View>
          {posts.length === 0 ? (
            <View style={styles.postGridEmpty}>
              <Ionicons name="camera-outline" size={36} color="#D1D5DB" />
              <Text style={styles.postGridEmptyText}>Henüz gönderi yok</Text>
            </View>
          ) : (
            <View style={styles.postGrid}>
              {Array.from({ length: 6 }).map((_, i) => {
                const post = posts[i];
                if (!post) {
                  return <View key={`empty-${i}`} style={[styles.postCell, styles.postCellEmpty]} />;
                }
                const imgUrl = post.imageUrl
                  ? (post.imageUrl.startsWith('http') ? post.imageUrl : `${API_BASE}${post.imageUrl}`)
                  : null;
                return (
                  <TouchableOpacity key={post.id} style={styles.postCell} activeOpacity={0.85}>
                    {imgUrl ? (
                      <Image source={{ uri: imgUrl }} style={styles.postImg} />
                    ) : (
                      <View style={styles.postImgPlaceholder}>
                        <Text style={styles.postCaption} numberOfLines={3}>{post.caption || ''}</Text>
                      </View>
                    )}
                    {post.starPoints > 0 && (
                      <View style={styles.postStarChip}>
                        <Text style={styles.postStarChipText}>⭐ {post.starPoints}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* ── LOGOUT ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color={ORANGE} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function StatItem({ value, label }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7FAF8' },
  container: { flex: 1 },

  // ── Header ──
  header: {
    backgroundColor: GREEN,
    paddingTop: 52,
    paddingBottom: 28,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Avatar
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: '#fff' },
  avatarFallback: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 40, fontWeight: '700', color: '#fff' },
  starChip: {
    position: 'absolute', bottom: -6, right: -6,
    backgroundColor: GOLD_L,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#fff',
  },
  starChipText: { fontSize: 11, fontWeight: '700', color: '#92400E' },

  displayName: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 6 },
  bio: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, textAlign: 'center', paddingHorizontal: 32 },

  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 20, marginTop: 16,
  },
  editBtnText: { fontSize: 13, fontWeight: '700', color: GREEN },

  // ── Stat Bar ──
  statBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 18, paddingVertical: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2, fontWeight: '500' },
  statDivider: { width: 1, height: 32, backgroundColor: '#F3F4F6' },

  // ── Streak Card ──
  streakCard: {
    backgroundColor: ORANGE,
    marginHorizontal: 16, marginTop: 14,
    borderRadius: 20, padding: 18,
  },
  streakTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  streakTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  streakSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  streakBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
  },
  streakBadgeNum: { fontSize: 22, fontWeight: '800', color: '#fff', lineHeight: 26 },
  streakBadgeLabel: { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 4 },
  dayDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dayDotActive: { backgroundColor: '#fff' },
  dayLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  // ── Section ──
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 14,
    borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sectionSub: { fontSize: 13, color: '#9CA3AF' },
  seeAll: { fontSize: 13, color: GREEN, fontWeight: '600' },

  // ── Badge Grid ──
  badgeGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  badgeItem: {
    width: '22%', alignItems: 'center',
    backgroundColor: GREEN_XL,
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 4,
    marginBottom: 4,
  },
  badgeItemLocked: { backgroundColor: '#F9FAFB' },
  badgeEmoji: { fontSize: 28, marginBottom: 4 },
  badgeEmojiLocked: { opacity: 0.5 },
  badgeLabel: {
    fontSize: 10, fontWeight: '600', color: GREEN, textAlign: 'center', lineHeight: 13,
  },
  badgeLabelLocked: { color: '#9CA3AF' },

  // ── Post Grid ──
  postGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  postCell: {
    width: '32.5%', aspectRatio: 1,
    borderRadius: 10, overflow: 'hidden',
    position: 'relative',
  },
  postCellEmpty: { backgroundColor: '#F3F4F6' },
  postImg: { width: '100%', height: '100%' },
  postImgPlaceholder: {
    flex: 1, backgroundColor: GREEN_XL,
    justifyContent: 'center', alignItems: 'center',
    padding: 8,
  },
  postCaption: { fontSize: 10, color: GREEN, textAlign: 'center' },
  postStarChip: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: 8,
  },
  postStarChipText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  postGridEmpty: {
    alignItems: 'center', paddingVertical: 32, gap: 8,
  },
  postGridEmptyText: { fontSize: 14, color: '#9CA3AF' },

  // ── Logout ──
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 16, marginTop: 14,
    paddingVertical: 14,
    borderRadius: 16, borderWidth: 1.5, borderColor: ORANGE_L,
    backgroundColor: '#fff',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: ORANGE },
});
