// ProfileScreen.js — SocialFit redesign · Profil + Streak + Rozetler (gerçek veri)
// Konum: src/screens/main/ProfileScreen.js
import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Image, Share, LayoutAnimation, Platform, UIManager, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config';
import { colors, font, shadow } from '../../theme/socialFitTheme';
import { Avatar } from '../../components/sf/ui';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WEEK_LABELS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

function resolveUri(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

// /me/calendar.days ({ '5':[...] }) -> bu haftanın 7 günü (Pt..Pz) aktif mi
function buildWeek(days) {
  const now = new Date();
  const dow = now.getDay(); // 0 Paz .. 6 Cmt
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset + i);
    const isToday = d.toDateString() === now.toDateString();
    const sameMonth = d.getMonth() === now.getMonth();
    const active = sameMonth && days && Array.isArray(days[d.getDate()]) && days[d.getDate()].length > 0;
    out.push({ d: isToday ? 'Bugün' : WEEK_LABELS[i], done: active && !isToday, today: isToday, todayActive: isToday && active });
  }
  return out;
}

export default function ProfileScreen({ navigation }) {
  const api = useApi();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [p, setP] = useState({
    displayName: user?.profile?.displayName || '',
    avatarUrl: user?.profile?.avatarUrl || null,
    goalNote: '',
    stars: 0, streak: 0, posts: 0, followers: 0, following: 0, rank: null,
  });
  const [week, setWeek] = useState(buildWeek(null));
  const [badgeList, setBadgeList] = useState([]);
  const [postList, setPostList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setError('');
    try {
      const [me, stats, cal, posts, streak] = await Promise.all([
        api.get('/api/users/me').catch(() => null),
        api.get(`/api/users/${user.id}`).catch(() => null),
        api.get('/api/users/me/calendar').catch(() => null),
        api.get(`/api/users/${user.id}/posts`).catch(() => []),
        api.get('/api/streaks/me').catch(() => null),
      ]);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const currentStreak = streak?.currentStreak ?? stats?.currentStreak ?? 0;
      setP((s) => ({
        ...s,
        displayName: me?.profile?.displayName ?? s.displayName,
        avatarUrl: me?.profile?.avatarUrl ?? s.avatarUrl,
        goalNote: me?.profile?.goalNote ?? '',
        stars: me?.starPoints ?? stats?.starPoints ?? 0,
        streak: currentStreak,
        posts: stats?.postCount ?? 0,
        followers: stats?.followerCount ?? 0,
        following: stats?.followingCount ?? 0,
        rank: stats?.leaderboardRank ?? null,
      }));
      setWeek(buildWeek(cal?.days));
      const catalog = Array.isArray(streak?.allBadges) ? streak.allBadges : [];
      setBadgeList(catalog.map((b) => ({
        key: b.key,
        label: b.name,
        iconUrl: b.iconUrl,
        daysRequired: b.daysRequired,
        earned: !!b.earned,
        progress: Math.min(currentStreak, b.daysRequired),
      })));
      const list = Array.isArray(posts) ? posts : (Array.isArray(posts?.posts) ? posts.posts : []);
      setPostList(list);
      loadedOnce.current = true;
    } catch (e) {
      setError('Profil verileri şu an yüklenemiyor. Lütfen tekrar dene.');
    } finally {
      setLoading(false);
    }
  }, [api, user]);
  useFocusEffect(useCallback(() => { if (!loadedOnce.current) setLoading(true); load(); }, [load]));

  const shareProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Share.share({ message: `${p.displayName || 'Profilim'} · Social Fit'te beni takip et! 🌿` }).catch(() => {});
  };

  const goEditProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('EditProfile');
  };

  const goSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Settings');
  };

  const earned = badgeList.filter((b) => b.earned).length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 28 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.primary} />}
    >
      <LinearGradient colors={['#1B8659', colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.cover, { paddingTop: insets.top + 8 }]}>
        <View style={styles.coverTop}>
          <View />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <TouchableOpacity hitSlop={8} onPress={shareProfile}><Ionicons name="share-social-outline" size={21} color={colors.white} /></TouchableOpacity>
            <TouchableOpacity hitSlop={8} onPress={goSettings}><Ionicons name="settings-outline" size={21} color={colors.white} /></TouchableOpacity>
          </View>
        </View>

        {/* Avatar sol + istatistikler sağ */}
        <View style={styles.headRow}>
          <Avatar profile={p} size={80} style={{ borderRadius: 26, borderWidth: 3, borderColor: 'rgba(255,255,255,0.85)' }} />
          <View style={styles.statsInline}>
            {[[p.posts, 'Paylaşım', null], [p.followers, 'Takipçi', 'followers'], [p.following, 'Takip', 'following']].map(([n, l, listType], i) => (
              <TouchableOpacity
                key={i}
                style={styles.statInline}
                activeOpacity={listType ? 0.7 : 1}
                disabled={!listType}
                onPress={() => navigation.navigate('FollowList', { userId: user?.id, type: listType })}
              >
                <Text style={styles.statInlineNum} selectable>{n}</Text>
                <Text style={styles.statInlineLbl}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.dn}>{p.displayName || 'Kullanıcı'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <View style={styles.starPill}><Text style={styles.starPillText} selectable>⭐ {p.stars.toLocaleString('tr-TR')}</Text></View>
          {p.rank ? <View style={styles.rankPill}><Text style={styles.rankPillText} selectable>🏆 #{p.rank}</Text></View> : null}
        </View>

        {/* Biyografi — dokununca düzenle */}
        <TouchableOpacity activeOpacity={0.7} onPress={goEditProfile}>
          {p.goalNote ? (
            <Text style={styles.bio}>{p.goalNote}</Text>
          ) : (
            <Text style={styles.bioEmpty}>+ Biyografi ekle</Text>
          )}
        </TouchableOpacity>

        {/* Küçük profili düzenle butonu */}
        <TouchableOpacity style={styles.editBtnSmall} activeOpacity={0.85} onPress={goEditProfile}>
          <Ionicons name="create-outline" size={14} color={colors.white} />
          <Text style={styles.editTextSmall}>Profili Düzenle</Text>
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 50 }} />
      ) : (
        <>
        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="cloud-offline-outline" size={18} color={colors.coralDark} />
            <Text style={styles.errorText} selectable>{error}</Text>
          </View>
        ) : null}

        {/* Streak kartı */}
        <View style={styles.streakCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Text style={{ fontSize: 46 }}>🔥</Text>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7 }}>
              <Text style={styles.streakNum} selectable>{p.streak}</Text>
              <Text style={styles.streakLbl}>gün seri</Text>
            </View>
            <Text style={styles.streakSub}>Her gün paylaş, seriyi koru · 00:00'da sıfırlanır</Text>
          </View>
        </View>
        <View style={styles.weekRow}>
          {week.map((w, i) => (
            <View key={i} style={{ alignItems: 'center', gap: 5 }}>
              <View style={[styles.dayBox,
                w.done && { backgroundColor: colors.primary },
                w.today && { backgroundColor: colors.coralTint, borderWidth: 2, borderColor: colors.coral },
                !w.done && !w.today && { backgroundColor: colors.divider, borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed' }]}>
                {w.done ? <Ionicons name="checkmark" size={18} color={colors.white} /> : w.today ? <Text style={{ fontSize: 15 }}>{w.todayActive ? '✅' : '🔥'}</Text> : null}
              </View>
              <Text style={[styles.dayLbl, w.today && { color: colors.coralDark, fontFamily: font.bodyBold }]}>{w.d}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Rozetler */}
      {badgeList.length > 0 ? (
        <View style={{ marginTop: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11, marginHorizontal: 16 }}>
            <Text style={styles.sectionTitle}>Rozetler</Text>
            <Text style={styles.sectionLink}>{earned} / {badgeList.length} kazanıldı</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
          >
            {badgeList.map((b) => (
              <View key={b.key} style={[styles.badge, !b.earned && styles.badgeLocked]}>
                {b.iconUrl ? (
                  <Image
                    source={{ uri: resolveUri(b.iconUrl) }}
                    style={[styles.badgeImg, !b.earned && { opacity: 0.35 }]}
                  />
                ) : (
                  <View style={[styles.badgeImg, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 26, opacity: b.earned ? 1 : 0.4 }}>🏅</Text>
                  </View>
                )}
                <Text style={[styles.badgeLbl, { color: b.earned ? colors.ink : colors.faint }]} numberOfLines={1}>
                  {b.label}
                </Text>
                {b.earned ? (
                  <Text style={styles.badgeEarned}>Kazanıldı</Text>
                ) : (
                  <Text style={styles.badgeProgress}>{b.progress}/{b.daysRequired} gün</Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Paylaşımlarım */}
      <View style={{ marginHorizontal: 16, marginTop: 22 }}>
        <Text style={styles.sectionTitle}>Paylaşımlarım</Text>
        {postList.length === 0 ? (
          <View style={styles.postsEmpty}>
            <Ionicons name="camera-outline" size={36} color={colors.faint} />
            <Text style={styles.postsEmptyText}>Henüz paylaşımın yok</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {postList.map((post) => {
              const img = resolveUri(post.imageUrl);
              return (
                <View key={post.id} style={styles.cell}>
                  {img ? (
                    <Image source={{ uri: img }} style={styles.cellImg} />
                  ) : (
                    <View style={[styles.cellImg, styles.cellPlaceholder]}>
                      <Text style={styles.cellCaption} numberOfLines={3}>{post.caption || ''}</Text>
                    </View>
                  )}
                  <View style={styles.cellOverlay}>
                    <Ionicons name="eye" size={12} color="#fff" />
                    <Text style={styles.cellLikes}>{post.viewCount ?? 0}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  cover: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 30 },
  coverTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 18 },
  statsInline: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statInline: { alignItems: 'center' },
  statInlineNum: { fontFamily: font.displayBold, fontSize: 19, color: colors.white, fontVariant: ['tabular-nums'] },
  statInlineLbl: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontFamily: font.bodyBold, marginTop: 2 },
  dn: { fontFamily: font.displayBold, fontSize: 20, color: colors.white, marginTop: 14 },
  starPill: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 11 },
  starPillText: { fontFamily: font.bodyBold, fontSize: 12, color: '#FFE9A8', fontVariant: ['tabular-nums'] },
  rankPill: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 11 },
  rankPillText: { fontFamily: font.bodyBold, fontSize: 12, color: colors.white, fontVariant: ['tabular-nums'] },
  bio: { fontSize: 13.5, color: '#C7E6D5', marginTop: 10, fontFamily: font.body, lineHeight: 19 },
  bioEmpty: { fontSize: 13.5, color: 'rgba(255,255,255,0.6)', marginTop: 10, fontFamily: font.body },
  editBtnSmall: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', borderRadius: 11, paddingHorizontal: 14, paddingVertical: 7 },
  editTextSmall: { color: colors.white, fontFamily: font.bodyBold, fontSize: 13 },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 14, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.coralTint },
  errorText: { flex: 1, fontSize: 12, color: colors.coralDark, fontFamily: font.bodyBold },
  streakCard: { marginHorizontal: 16, marginTop: -18, backgroundColor: colors.surface, borderRadius: 24, ...shadow.card, padding: 16 },
  streakNum: { fontFamily: font.displayBold, fontSize: 40, color: colors.ink, fontVariant: ['tabular-nums'] },
  streakLbl: { fontFamily: font.bodyBold, fontSize: 15, color: colors.muted },
  streakSub: { fontSize: 12, color: colors.faint, marginTop: 3, fontFamily: font.body },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  dayBox: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  dayLbl: { fontSize: 11, color: colors.muted, fontFamily: font.bodyBold },
  sectionTitle: { fontFamily: font.bodyBold, fontSize: 16, color: colors.ink },
  sectionLink: { fontSize: 12, color: colors.primary, fontFamily: font.bodyBold },
  badge: { width: 96, backgroundColor: colors.surface, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', ...shadow.soft },
  badgeLocked: { backgroundColor: colors.divider },
  badgeImg: { width: 56, height: 56, borderRadius: 28, resizeMode: 'contain' },
  badgeLbl: { fontSize: 11, fontFamily: font.bodyBold, marginTop: 6, textAlign: 'center' },
  badgeEarned: { fontSize: 9, fontFamily: font.bodyBold, color: colors.primary, marginTop: 2 },
  badgeProgress: { fontSize: 9, fontFamily: font.body, color: colors.faint, marginTop: 2 },
  postsEmpty: { alignItems: 'center', gap: 10, paddingVertical: 30 },
  postsEmptyText: { fontSize: 14, color: colors.muted, fontFamily: font.body },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  cell: { width: '32%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.surface },
  cellImg: { width: '100%', height: '100%' },
  cellPlaceholder: { backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', padding: 8 },
  cellCaption: { fontSize: 11, color: colors.primary, fontFamily: font.body, textAlign: 'center' },
  cellOverlay: { position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(17,35,27,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  cellLikes: { color: '#fff', fontSize: 10, fontFamily: font.bodyBold },
});
