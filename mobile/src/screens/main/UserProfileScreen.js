import React, { useState, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ScrollView, RefreshControl, ActivityIndicator, FlatList,
} from 'react-native';
import { useApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE } from '../../config';

const GREEN = '#2D6A4F';
const GREEN_XL = '#D8F3DC';
const ORANGE = '#F4845F';
const GOLD = '#F59E0B';
const GOLD_L = '#FEF3C7';

const GROUP_EMOJIS = ['💪','🥗','🏃','🧘','🔥','🏋️','🚴','🥊'];
const GROUP_COLORS = ['#D8F3DC','#DBEAFE','#FEF3C7','#FDDDD5','#EDE9FE','#FCE7F3'];

function resolveUri(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

function getInitial(name) {
  return (name || '?').charAt(0).toUpperCase();
}

function rankEmoji(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

function StatBox({ icon, label, value, accent }) {
  return (
    <View style={[styles.statBox, accent && { borderColor: accent, borderWidth: 1.5 }]}>
      <Text style={styles.statBoxIcon}>{icon}</Text>
      <Text style={[styles.statBoxValue, accent && { color: accent }]}>{value}</Text>
      <Text style={styles.statBoxLabel}>{label}</Text>
    </View>
  );
}

export default function UserProfileScreen({ route, navigation }) {
  const { userId } = route.params || {};
  const api = useApi();
  const { user: me } = useAuth();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [commonGroups, setCommonGroups] = useState([]);
  const [tab, setTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isSelf = userId === me?.id;

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const userData = await api.get(`/api/users/${userId}`);
      setProfile(userData);

      // Gizli profil ve takip etmiyorsak içerikleri yükleme
      const canSeeContent = userData.isPublic !== false || userData.isFollowing || userId === me?.id;
      if (canSeeContent) {
        const [postsData, groupsData] = await Promise.all([
          api.get(`/api/users/${userId}/posts`).catch(() => []),
          api.get(`/api/users/${userId}/common-groups`).catch(() => []),
        ]);
        setPosts(Array.isArray(postsData) ? postsData : []);
        setCommonGroups(Array.isArray(groupsData) ? groupsData : []);
      } else {
        setPosts([]);
        setCommonGroups([]);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, api, me?.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      if (profile.isFollowing) {
        await api.delete(`/api/users/${userId}/follow`);
        setProfile((p) => p && { ...p, isFollowing: false, followerCount: Math.max(0, p.followerCount - 1) });
      } else {
        await api.post(`/api/users/${userId}/follow`, {});
        setProfile((p) => p && { ...p, isFollowing: true, followerCount: p.followerCount + 1 });
      }
    } catch {}
    setFollowLoading(false);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={GREEN} /></View>;
  }
  if (!profile) {
    return <View style={styles.center}><Text style={styles.errorText}>Kullanıcı bulunamadı.</Text></View>;
  }

  const displayName = profile.profile?.displayName || 'Kullanıcı';
  const bio = profile.profile?.goalNote?.trim() || '';
  const avatarUrl = resolveUri(profile.profile?.avatarUrl);

  // ── TABS ──────────────────────────────────────────────────────
  const renderPosts = () => (
    posts.length === 0
      ? <View style={styles.emptyWrap}>
          <Ionicons name="camera-outline" size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>Henüz gönderi yok</Text>
        </View>
      : <View style={styles.postGrid}>
          {posts.map((p) => {
            const img = resolveUri(p.imageUrl);
            return (
              <TouchableOpacity key={p.id} style={styles.postCell} activeOpacity={0.85}>
                {img
                  ? <Image source={{ uri: img }} style={styles.postImg} />
                  : <View style={styles.postImgPlaceholder}>
                      <Text style={styles.postImgPlaceholderText} numberOfLines={3}>{p.caption || ''}</Text>
                    </View>
                }
                <View style={styles.postOverlay}>
                  <Ionicons name="heart" size={12} color="#fff" />
                  <Text style={styles.postOverlayText}>{p._count?.likes ?? 0}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
  );

  const renderGroups = () => (
    commonGroups.length === 0
      ? <View style={styles.emptyWrap}>
          <Ionicons name="people-outline" size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>Ortak grup bulunamadı</Text>
        </View>
      : commonGroups.map((g, idx) => {
          const emoji = GROUP_EMOJIS[idx % GROUP_EMOJIS.length];
          const bg = GROUP_COLORS[idx % GROUP_COLORS.length];
          const img = resolveUri(g.imageUrl);
          return (
            <TouchableOpacity
              key={g.id}
              style={styles.groupRow}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Groups', { screen: 'GroupFeed', params: { groupId: g.id, groupName: g.name } })}
            >
              {img
                ? <Image source={{ uri: img }} style={styles.groupAvatar} />
                : <View style={[styles.groupAvatar, { backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 22 }}>{emoji}</Text>
                  </View>
              }
              <View style={styles.groupInfo}>
                <Text style={styles.groupName} numberOfLines={1}>{g.name}</Text>
                <Text style={styles.groupMeta}>
                  <Ionicons name="people-outline" size={12} color="#9CA3AF" /> {g.memberCount} üye
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </TouchableOpacity>
          );
        })
  );

  const renderStats = () => (
    <View style={styles.statsSection}>
      {/* Streak kartı */}
      <View style={styles.streakCard}>
        <View style={styles.streakCardLeft}>
          <Text style={styles.streakCardTitle}>🔥 Günlük Seri</Text>
          <Text style={styles.streakCardSub}>Ardışık aktif gün</Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakBadgeNum}>{profile.currentStreak ?? 0}</Text>
          <Text style={styles.streakBadgeLabel}>gün</Text>
        </View>
      </View>

      {/* Stat kutuları */}
      <View style={styles.statBoxRow}>
        <StatBox
          icon="⭐"
          label="Star Puan"
          value={profile.starPoints ?? 0}
          accent={GOLD}
        />
        <StatBox
          icon={typeof profile.leaderboardRank === 'number' && profile.leaderboardRank <= 3
            ? rankEmoji(profile.leaderboardRank)
            : '🏆'}
          label="Sıralama"
          value={profile.leaderboardRank ? `#${profile.leaderboardRank}` : '—'}
          accent={profile.leaderboardRank === 1 ? GOLD : profile.leaderboardRank === 2 ? '#9CA3AF' : profile.leaderboardRank === 3 ? '#CD7C2F' : null}
        />
        <StatBox
          icon="📸"
          label="Gönderi"
          value={profile.postCount ?? 0}
        />
      </View>

      {/* Takipçi / Takip */}
      <View style={styles.followStatRow}>
        <View style={styles.followStatItem}>
          <Text style={styles.followStatNum}>{profile.followerCount ?? 0}</Text>
          <Text style={styles.followStatLabel}>Takipçi</Text>
        </View>
        <View style={styles.followStatDivider} />
        <View style={styles.followStatItem}>
          <Text style={styles.followStatNum}>{profile.followingCount ?? 0}</Text>
          <Text style={styles.followStatLabel}>Takip Edilen</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={GREEN} />}
    >
      {/* ── GREEN HEADER ── */}
      <View style={styles.header}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {avatarUrl
            ? <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            : <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{getInitial(displayName)}</Text>
              </View>
          }
          {(profile.starPoints ?? 0) > 0 && (
            <View style={styles.starChip}>
              <Text style={styles.starChipText}>⭐ {profile.starPoints}</Text>
            </View>
          )}
        </View>

        <Text style={styles.displayName}>{displayName}</Text>
        {bio ? <Text style={styles.bio} numberOfLines={2}>{bio}</Text> : null}

        {/* Leaderboard rozeti */}
        {profile.leaderboardRank && profile.leaderboardRank <= 10 && (
          <View style={styles.rankPill}>
            <Text style={styles.rankPillText}>{rankEmoji(profile.leaderboardRank)} Sıralama #{profile.leaderboardRank}</Text>
          </View>
        )}

        {/* Aksiyon butonları */}
        {!isSelf && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.followBtn,
                profile.isFollowing && styles.followingBtn,
                profile.followStatus === 'pending' && styles.pendingBtn,
              ]}
              onPress={profile.followStatus === 'pending' ? null : toggleFollow}
              disabled={followLoading || profile.followStatus === 'pending'}
              activeOpacity={0.85}
            >
              {followLoading
                ? <ActivityIndicator color={profile.isFollowing ? GREEN : '#fff'} size="small" />
                : <>
                    <Ionicons
                      name={
                        profile.isFollowing ? 'checkmark'
                        : profile.followStatus === 'pending' ? 'time-outline'
                        : 'person-add-outline'
                      }
                      size={15}
                      color={profile.isFollowing || profile.followStatus === 'pending' ? GREEN : '#fff'}
                    />
                    <Text style={[
                      styles.followBtnText,
                      (profile.isFollowing || profile.followStatus === 'pending') && styles.followingBtnText,
                    ]}>
                      {profile.isFollowing ? 'Takip Ediliyor'
                        : profile.followStatus === 'pending' ? 'İstek Gönderildi'
                        : 'Takip Et'}
                    </Text>
                  </>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.messageBtn}
              onPress={() => navigation.navigate('Messages', {
                screen: 'Chat',
                params: {
                  userId,
                  displayName,
                  avatarUrl: profile.profile?.avatarUrl,
                  starPoints: profile.starPoints,
                },
              })}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-outline" size={16} color={GREEN} />
              <Text style={styles.messageBtnText}>Mesaj</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── GİZLİ PROFİL EKRANI ── */}
      {profile.isPublic === false && !profile.isFollowing && !isSelf ? (
        <View style={styles.lockedWrap}>
          <View style={styles.lockedIconWrap}>
            <Ionicons name="lock-closed" size={32} color={GREEN} />
          </View>
          <Text style={styles.lockedTitle}>Bu hesap gizlidir</Text>
          <Text style={styles.lockedDesc}>
            Paylaşımları ve istatistikleri görmek için {displayName} kişisini takip et.
          </Text>
          <TouchableOpacity
            style={styles.lockedFollowBtn}
            onPress={toggleFollow}
            disabled={followLoading}
            activeOpacity={0.85}
          >
            {followLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.lockedFollowBtnText}>Takip Et</Text>
            }
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* ── TAB BAR ── */}
          <View style={styles.tabBar}>
            {[
              { key: 'posts',  label: 'Paylaşımlar', icon: 'grid-outline' },
              { key: 'groups', label: 'Ortak Gruplar', icon: 'people-outline' },
              { key: 'stats',  label: 'İstatistikler', icon: 'bar-chart-outline' },
            ].map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
                onPress={() => setTab(t.key)}
                activeOpacity={0.7}
              >
                <Ionicons name={t.icon} size={18} color={tab === t.key ? GREEN : '#9CA3AF'} />
                <Text style={[styles.tabBtnText, tab === t.key && styles.tabBtnTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── TAB İÇERİĞİ ── */}
          <View style={styles.tabContent}>
            {tab === 'posts' && renderPosts()}
            {tab === 'groups' && renderGroups()}
            {tab === 'stats' && renderStats()}
          </View>
        </>
      )}

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAF8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  errorText: { color: '#6B7280', fontSize: 15 },

  // ── Header ──
  header: {
    backgroundColor: GREEN,
    paddingTop: 20, paddingBottom: 28,
    alignItems: 'center',
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#fff' },
  avatarFallback: { backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 36, fontWeight: '700', color: '#fff' },
  starChip: {
    position: 'absolute', bottom: -6, right: -6,
    backgroundColor: GOLD_L,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#fff',
  },
  starChipText: { fontSize: 10, fontWeight: '700', color: '#92400E' },
  displayName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  bio: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, textAlign: 'center', paddingHorizontal: 32 },
  rankPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 20, marginTop: 8,
  },
  rankPillText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  followBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 22, paddingVertical: 9,
    borderRadius: 20, minWidth: 140, justifyContent: 'center',
  },
  followBtnText: { fontSize: 14, fontWeight: '700', color: GREEN },
  followingBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1.5, borderColor: '#fff' },
  followingBtnText: { color: '#fff' },
  pendingBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)' },
  messageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 20,
  },
  messageBtnText: { fontSize: 14, fontWeight: '700', color: GREEN },

  // ── Gizli Profil ──
  lockedWrap: {
    alignItems: 'center', padding: 48,
    backgroundColor: '#fff', margin: 16, borderRadius: 20,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  lockedIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: GREEN_XL,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  lockedTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
  lockedDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  lockedFollowBtn: {
    backgroundColor: GREEN,
    paddingHorizontal: 40, paddingVertical: 12,
    borderRadius: 20,
  },
  lockedFollowBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // ── Tab Bar ──
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 14,
    borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 3 },
  tabBtnActive: { borderBottomWidth: 2.5, borderBottomColor: GREEN },
  tabBtnText: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  tabBtnTextActive: { color: GREEN, fontWeight: '700' },
  tabContent: { marginTop: 12 },

  // ── Post Grid ──
  postGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 3,
    paddingHorizontal: 3,
  },
  postCell: { width: '33%', aspectRatio: 1, position: 'relative' },
  postImg: { width: '100%', height: '100%' },
  postImgPlaceholder: {
    flex: 1, backgroundColor: GREEN_XL,
    justifyContent: 'center', alignItems: 'center', padding: 6,
  },
  postImgPlaceholderText: { fontSize: 9, color: GREEN, textAlign: 'center' },
  postOverlay: {
    position: 'absolute', bottom: 4, right: 6,
    flexDirection: 'row', alignItems: 'center', gap: 3,
  },
  postOverlayText: { fontSize: 11, color: '#fff', fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 3 },

  // ── Ortak Gruplar ──
  groupRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 8,
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  groupAvatar: { width: 48, height: 48, borderRadius: 14 },
  groupInfo: { flex: 1, marginLeft: 12 },
  groupName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  groupMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 3 },

  // ── İstatistikler ──
  statsSection: { paddingHorizontal: 16 },
  streakCard: {
    backgroundColor: ORANGE,
    borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  streakCardLeft: {},
  streakCardTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  streakCardSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  streakBadge: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  streakBadgeNum: { fontSize: 24, fontWeight: '800', color: '#fff' },
  streakBadgeLabel: { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  statBoxRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statBox: {
    flex: 1, backgroundColor: '#fff',
    borderRadius: 16, padding: 14,
    alignItems: 'center', gap: 4,
    borderColor: '#F3F4F6', borderWidth: 1,
  },
  statBoxIcon: { fontSize: 22 },
  statBoxValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
  statBoxLabel: { fontSize: 11, color: '#9CA3AF' },
  followStatRow: {
    backgroundColor: '#fff', borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  followStatItem: { flex: 1, alignItems: 'center' },
  followStatNum: { fontSize: 20, fontWeight: '800', color: '#111827' },
  followStatLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 3 },
  followStatDivider: { width: 1, height: 36, backgroundColor: '#F3F4F6' },

  // ── Empty ──
  emptyWrap: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
