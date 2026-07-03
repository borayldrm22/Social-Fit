// ProfileScreen.js — SocialFit redesign · Profil + Streak + Rozetler (gerçek veri)
// Konum: src/screens/main/ProfileScreen.js
import React, { useState, useCallback } from 'react';
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
  const [postList, setPostList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setError('');
    try {
      const [me, stats, cal, posts] = await Promise.all([
        api.get('/api/users/me').catch(() => null),
        api.get(`/api/users/${user.id}`).catch(() => null),
        api.get('/api/users/me/calendar').catch(() => null),
        api.get(`/api/users/${user.id}/posts`).catch(() => []),
      ]);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setP((s) => ({
        ...s,
        displayName: me?.profile?.displayName ?? s.displayName,
        avatarUrl: me?.profile?.avatarUrl ?? s.avatarUrl,
        goalNote: me?.profile?.goalNote ?? '',
        stars: me?.starPoints ?? stats?.starPoints ?? 0,
        streak: stats?.currentStreak ?? 0,
        posts: stats?.postCount ?? 0,
        followers: stats?.followerCount ?? 0,
        following: stats?.followingCount ?? 0,
        rank: stats?.leaderboardRank ?? null,
      }));
      setWeek(buildWeek(cal?.days));
      const list = Array.isArray(posts) ? posts : (Array.isArray(posts?.posts) ? posts.posts : []);
      setPostList(list);
    } catch (e) {
      setError('Profil verileri şu an yüklenemiyor. Lütfen tekrar dene.');
    } finally {
      setLoading(false);
    }
  }, [api, user]);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const shareProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Share.share({ message: `${p.displayName || 'Profilim'} · Social Fit'te beni takip et! 🌿` }).catch(() => {});
  };

  const goEditProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('EditProfile');
  };

  const badges = [
    { emoji: '🔥', label: '7 Gün', on: p.streak >= 7 },
    { emoji: '⚡', label: '14 Gün', on: p.streak >= 14 },
    { emoji: '💎', label: '30 Gün', on: p.streak >= 30 },
    { emoji: '📸', label: '10 Post', on: p.posts >= 10 },
    { emoji: '🤝', label: 'Sosyal', on: p.followers >= 5 },
  ];
  const earned = badges.filter((b) => b.on).length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 28 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.primary} />}
    >
      <LinearGradient colors={['#1B8659', colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.cover, { paddingTop: insets.top + 8 }]}>
        <View style={styles.coverTop}>
          <Text style={styles.coverTitle}>Profil</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity hitSlop={8} onPress={shareProfile}><Ionicons name="share-social-outline" size={20} color={colors.white} /></TouchableOpacity>
            <TouchableOpacity hitSlop={8} onPress={goEditProfile}><Ionicons name="create-outline" size={20} color={colors.white} /></TouchableOpacity>
          </View>
        </View>
        <View style={{ alignItems: 'center', marginTop: 12 }}>
          <Avatar profile={p} size={88} style={{ borderRadius: 30, borderWidth: 4, borderColor: 'rgba(255,255,255,0.85)' }} />
          <Text style={styles.dn}>{p.displayName || 'Kullanıcı'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <View style={styles.starPill}><Text style={styles.starPillText} selectable>⭐ {p.stars.toLocaleString('tr-TR')}</Text></View>
            {p.rank ? <View style={styles.rankPill}><Text style={styles.rankPillText} selectable>🏆 #{p.rank}</Text></View> : null}
          </View>
          {p.goalNote ? <Text style={styles.bio}>{p.goalNote}</Text> : null}
        </View>
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

      {/* İstatistik */}
      <View style={styles.statsCard}>
        {[[p.posts, 'Paylaşım'], [p.followers, 'Takipçi'], [p.following, 'Takip']].map(([n, l], i) => (
          <View key={i} style={[styles.stat, i < 2 && { borderRightWidth: 1, borderRightColor: colors.divider }]}>
            <Text style={styles.statNum} selectable>{n}</Text>
            <Text style={styles.statLbl}>{l}</Text>
          </View>
        ))}
      </View>

      {/* Profili düzenle */}
      <TouchableOpacity style={styles.editBtn} activeOpacity={0.85} onPress={goEditProfile}>
        <Ionicons name="create-outline" size={18} color={colors.primary} />
        <Text style={styles.editText}>Profili Düzenle</Text>
      </TouchableOpacity>

      {/* Rozetler */}
      <View style={{ marginHorizontal: 16, marginTop: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
          <Text style={styles.sectionTitle}>Rozetler</Text>
          <Text style={styles.sectionLink}>{earned} / {badges.length} kazanıldı</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {badges.map((b, i) => (
            <View key={i} style={[styles.badge, !b.on && { backgroundColor: colors.divider }]}>
              <Text style={{ fontSize: 26, opacity: b.on ? 1 : 0.4 }}>{b.emoji}</Text>
              <Text style={[styles.badgeLbl, { color: b.on ? colors.muted : colors.faint }]}>{b.label}</Text>
            </View>
          ))}
        </View>
      </View>

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
                    <Ionicons name="heart" size={11} color="#fff" />
                    <Text style={styles.cellLikes}>{post._count?.likes ?? 0}</Text>
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
  coverTitle: { fontFamily: font.bodyBold, fontSize: 17, color: colors.white },
  dn: { fontFamily: font.displayBold, fontSize: 21, color: colors.white, marginTop: 11 },
  starPill: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 11 },
  starPillText: { fontFamily: font.bodyBold, fontSize: 12, color: '#FFE9A8', fontVariant: ['tabular-nums'] },
  rankPill: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 11 },
  rankPillText: { fontFamily: font.bodyBold, fontSize: 12, color: colors.white, fontVariant: ['tabular-nums'] },
  bio: { fontSize: 13, color: '#C7E6D5', marginTop: 8, fontFamily: font.body, textAlign: 'center', paddingHorizontal: 24 },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 14, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.coralTint },
  errorText: { flex: 1, fontSize: 12, color: colors.coralDark, fontFamily: font.bodyBold },
  streakCard: { marginHorizontal: 16, marginTop: -18, backgroundColor: colors.surface, borderRadius: 24, ...shadow.card, padding: 16 },
  streakNum: { fontFamily: font.displayBold, fontSize: 40, color: colors.ink, fontVariant: ['tabular-nums'] },
  streakLbl: { fontFamily: font.bodyBold, fontSize: 15, color: colors.muted },
  streakSub: { fontSize: 12, color: colors.faint, marginTop: 3, fontFamily: font.body },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  dayBox: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  dayLbl: { fontSize: 11, color: colors.muted, fontFamily: font.bodyBold },
  statsCard: { flexDirection: 'row', marginHorizontal: 16, marginTop: 14, backgroundColor: colors.surface, borderRadius: 20, ...shadow.soft, paddingVertical: 14 },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontFamily: font.displayBold, fontSize: 20, color: colors.ink, fontVariant: ['tabular-nums'] },
  statLbl: { fontSize: 11, color: colors.faint, fontFamily: font.bodyBold, marginTop: 2 },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, backgroundColor: colors.mint, borderRadius: 16, paddingVertical: 13 },
  editText: { color: colors.primary, fontFamily: font.bodyBold, fontSize: 15 },
  sectionTitle: { fontFamily: font.bodyBold, fontSize: 16, color: colors.ink },
  sectionLink: { fontSize: 12, color: colors.primary, fontFamily: font.bodyBold },
  badge: { flex: 1, backgroundColor: colors.surface, borderRadius: 18, paddingVertical: 12, alignItems: 'center', ...shadow.soft },
  badgeLbl: { fontSize: 10, fontFamily: font.bodyBold, marginTop: 4 },
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
