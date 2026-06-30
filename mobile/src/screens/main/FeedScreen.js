// FeedScreen.js — SocialFit redesign · Ana akış
// Konum: src/screens/main/FeedScreen.js
// Backend: GET /posts (varsa). Erişilemezse MOCK ile render olur.
import React, { useState, useCallback } from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Share, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../../api/client';
import { API_BASE } from '../../config';
import { colors, font, shadow } from '../../theme/socialFitTheme';
import { Avatar, StarPill, Placeholder } from '../../components/sf/ui';
import { comingSoon } from '../../utils/comingSoon';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
  const days = Math.floor(diff / 86400);
  if (days < 7) return `${days} gün önce`;
  return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
}

function parseMeta(metadata) {
  if (!metadata) return {};
  if (typeof metadata === 'object') return metadata;
  try { return JSON.parse(metadata); } catch (e) { return {}; }
}

// Backend post (/api/posts/feed) -> kart şekli
function mapPost(p) {
  const meta = parseMeta(p.metadata);
  const isMeal = p.type === 'meal';
  let kind = isMeal ? '🥗 Öğün' : '💪 Antrenman';
  if (!isMeal && meta.activity) kind += ` · ${meta.activity}`;
  const imageUrl = p.imageUrl
    ? (p.imageUrl.startsWith('http') ? p.imageUrl : `${API_BASE}${p.imageUrl}`)
    : null;
  return {
    id: p.id,
    userId: p.user?.id,
    profile: p.user?.profile || { displayName: 'Kullanıcı' },
    starPoints: p.user?.starPoints ?? 0,
    when: timeAgo(p.createdAt),
    kind,
    kcal: meta.calories ?? meta.kcal ?? null,
    text: p.caption || '',
    likes: p._count?.likes ?? 0,
    comments: p._count?.comments ?? 0,
    liked: !!p.liked,
    hasImage: !!imageUrl,
    imageUrl,
  };
}

function PostCard({ item, onLike, onComment, onShare, onOpenProfile, onMenu, onBookmark }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <TouchableOpacity style={styles.headInfo} activeOpacity={0.7} onPress={() => onOpenProfile(item)}>
          <Avatar profile={item.profile} size={44} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.name}>{item.profile.displayName}</Text>
              <StarPill value={item.starPoints} />
            </View>
            <Text style={styles.meta}>{item.when} · {item.kind}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity hitSlop={8} onPress={() => onMenu(item)}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#B6C2B9" />
        </TouchableOpacity>
      </View>

      {item.hasImage ? (
        item.imageUrl ? (
          <View style={{ marginHorizontal: 14, borderRadius: 18, overflow: 'hidden' }}>
            <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 208 }} resizeMode="cover" />
            {item.kcal ? (
              <View style={styles.kcalTag}><Text style={styles.kcalText}>{item.kcal} kcal</Text></View>
            ) : null}
          </View>
        ) : (
          <Placeholder height={208} radius={18} label="öğün fotoğrafı" style={{ marginHorizontal: 14 }}>
            {item.kcal ? (
              <View style={styles.kcalTag}><Text style={styles.kcalText}>{item.kcal} kcal</Text></View>
            ) : null}
          </Placeholder>
        )
      ) : null}

      {item.text ? <Text style={styles.body}>{item.text}</Text> : null}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.action} activeOpacity={0.7} onPress={() => onLike(item)}>
          <Ionicons name={item.liked ? 'heart' : 'heart-outline'} size={21} color={colors.like} />
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} activeOpacity={0.7} onPress={() => onComment(item)}>
          <Ionicons name="chatbubble-outline" size={19} color="#6B7280" />
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} activeOpacity={0.7} onPress={() => onShare(item)}>
          <Ionicons name="paper-plane-outline" size={19} color="#6B7280" />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity hitSlop={8} onPress={() => onBookmark(item)}>
          <Ionicons name="bookmark-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function FeedScreen({ navigation }) {
  const api = useApi();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('friends');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const endpoint = tab === 'discover' ? '/api/posts/discover' : '/api/posts/feed';
    setLoading(true);
    try {
      const d = await api.get(endpoint);
      const list = Array.isArray(d?.posts) ? d.posts : (Array.isArray(d) ? d : []);
      setPosts(list.map(mapPost));
    } catch (e) {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [api, tab]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const toggleLike = useCallback((post) => {
    const liked = !post.liked;
    setPosts((prev) => prev.map((p) => (p.id === post.id
      ? { ...p, liked, likes: Math.max(0, p.likes + (liked ? 1 : -1)) }
      : p)));
    const req = liked ? api.post(`/api/posts/${post.id}/like`) : api.delete(`/api/posts/${post.id}/like`);
    req.catch(() => {
      // başarısızsa geri al
      setPosts((prev) => prev.map((p) => (p.id === post.id
        ? { ...p, liked: !liked, likes: Math.max(0, p.likes + (liked ? -1 : 1)) }
        : p)));
    });
  }, [api]);

  const openComments = useCallback((post) => navigation.navigate('Comments', { postId: post.id }), [navigation]);
  const openProfile = useCallback((post) => { if (post.userId) navigation.navigate('UserProfile', { userId: post.userId }); }, [navigation]);
  const sharePost = useCallback((post) => { Share.share({ message: `${post.text || 'Social Fit paylaşımı'}\n\n— Social Fit 🌿` }).catch(() => {}); }, []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topbar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <View style={styles.logo}><Ionicons name="leaf" size={19} color={colors.white} /></View>
          <Text style={styles.brand}>Social<Text style={{ color: colors.primary }}>Fit</Text></Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <View style={styles.streakPill}><Text style={styles.streakText}>🔥 24</Text></View>
          <View style={styles.starTop}><Text style={styles.starTopText}>⭐ 1.2k</Text></View>
          <TouchableOpacity style={styles.bell} onPress={() => navigation.navigate('Notifications')}><Ionicons name="notifications-outline" size={18} color="#3C4A42" /><View style={styles.bellDot} /></TouchableOpacity>
          <TouchableOpacity style={styles.bell} onPress={() => navigation.getParent()?.navigate('More')}><Ionicons name="menu" size={22} color="#3C4A42" /></TouchableOpacity>
        </View>
      </View>

      <View style={styles.segment}>
        {[['friends', 'Arkadaşlar'], ['discover', 'Keşfet']].map(([k, label]) => (
          <TouchableOpacity key={k} style={[styles.segItem, tab === k && styles.segActive]} onPress={() => setTab(k)}>
            <Text style={[styles.segText, { color: tab === k ? colors.ink : '#8A988E' }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={posts}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <PostCard
            item={item}
            onLike={toggleLike}
            onComment={openComments}
            onShare={sharePost}
            onOpenProfile={openProfile}
            onMenu={() => comingSoon('Gönderi seçenekleri')}
            onBookmark={() => comingSoon('Kaydet')}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} />
          ) : (
            <View style={styles.emptyWrap}>
              <Ionicons name={tab === 'discover' ? 'compass-outline' : 'newspaper-outline'} size={42} color={colors.faint} />
              <Text style={styles.emptyText}>{tab === 'discover' ? 'Keşfedilecek paylaşım yok' : 'Akışında henüz paylaşım yok'}</Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 4, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topbar: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  brand: { fontFamily: font.displayBold, fontSize: 21, color: colors.ink, letterSpacing: -0.5 },
  streakPill: { backgroundColor: colors.coralTint, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 13 },
  streakText: { fontFamily: font.displayBold, fontSize: 14, color: colors.coralDark },
  starTop: { backgroundColor: colors.amberTint, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 13 },
  starTopText: { fontFamily: font.displayBold, fontSize: 14, color: colors.amberDark },
  bell: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  bellDot: { position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.coral, borderWidth: 1.5, borderColor: colors.surface },
  segment: { marginHorizontal: 18, marginBottom: 12, backgroundColor: '#E9EFE9', borderRadius: 15, padding: 4, flexDirection: 'row' },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 11 },
  segActive: { backgroundColor: colors.surface, ...shadow.soft },
  segText: { fontFamily: font.bodyBold, fontSize: 14 },
  card: { marginHorizontal: 16, marginBottom: 14, backgroundColor: colors.surface, borderRadius: 24, ...shadow.card, paddingBottom: 4, overflow: 'hidden' },
  cardHead: { padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  headInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  name: { fontFamily: font.bodyBold, fontSize: 15, color: colors.ink },
  meta: { fontSize: 12, color: colors.faint, marginTop: 3, fontFamily: font.body },
  kcalTag: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(17,35,27,0.78)', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 12 },
  kcalText: { fontFamily: font.displayBold, fontSize: 12, color: colors.white },
  body: { fontSize: 14, color: colors.text, lineHeight: 21, paddingHorizontal: 16, paddingTop: 11 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingHorizontal: 16, paddingVertical: 13 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontFamily: font.displayBold, fontSize: 14, color: colors.text },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyText: { fontSize: 14, color: colors.muted, fontFamily: font.body, textAlign: 'center' },
});
