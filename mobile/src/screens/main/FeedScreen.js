// FeedScreen.js — SocialFit redesign · Ana akış
// Konum: src/screens/main/FeedScreen.js
// Backend: GET /posts (varsa). Erişilemezse MOCK ile render olur.
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Share, ActivityIndicator, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
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
  const KIND_LABELS = { meal: '🥗 Öğün', workout: '💪 Antrenman', text: '💭 Düşünce', general: '📣 Genel' };
  let kind = KIND_LABELS[p.type] || KIND_LABELS.meal;
  if (p.type === 'workout' && meta.activity) kind += ` · ${meta.activity}`;
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
    saved: !!p.saved,
    hasImage: !!imageUrl,
    imageUrl,
  };
}

const VIDEO_RE = /\.(mp4|mov|m4v|webm)(\?|$)/i;

// 4:5 (0.8) portre ile 1.91:1 manzara arası — aşırı uzun/geniş medyayı sınırla
function clampRatio(r) {
  return Math.min(1.91, Math.max(0.8, r));
}

// Feed medyası — görsel doğal en-boy oranıyla (sabit 208 crop yerine), video ise expo-av oynatıcı.
// onOpenImage: fotoğrafa dokununca tam ekran görüntüleyici (video native kontrollü, sarılmaz).
function FeedMedia({ uri, kcal, onOpenImage }) {
  const isVideo = VIDEO_RE.test(uri || '');
  const [ratio, setRatio] = useState(isVideo ? 1 : 1.25); // w/h; yüklenene kadar makul varsayılan

  useEffect(() => {
    if (!uri || isVideo) return;
    let active = true;
    Image.getSize(uri, (w, h) => { if (active && w && h) setRatio(clampRatio(w / h)); }, () => {});
    return () => { active = false; };
  }, [uri, isVideo]);

  const kcalTag = kcal ? (
    <View style={styles.kcalTag}><Text style={styles.kcalText}>{kcal} kcal</Text></View>
  ) : null;

  if (isVideo) {
    return (
      <View style={[styles.mediaBox, { aspectRatio: ratio, backgroundColor: '#000' }]}>
        <Video
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          isLooping
          onReadyForDisplay={(e) => {
            const ns = e?.naturalSize;
            if (ns?.width && ns?.height) setRatio(clampRatio(ns.width / ns.height));
          }}
        />
        {kcalTag}
      </View>
    );
  }
  return (
    <TouchableOpacity
      style={[styles.mediaBox, { aspectRatio: ratio }]}
      activeOpacity={0.92}
      onPress={() => onOpenImage?.(uri)}
    >
      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      {kcalTag}
    </TouchableOpacity>
  );
}

function PostCard({ item, onLike, onComment, onShare, onOpenProfile, onMenu, onBookmark, onOpenMedia }) {
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
          <FeedMedia uri={item.imageUrl} kcal={item.kcal} onOpenImage={onOpenMedia} />
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
          <Ionicons name={item.saved ? 'bookmark' : 'bookmark-outline'} size={20} color={item.saved ? colors.primary : '#6B7280'} />
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
  const [viewerUri, setViewerUri] = useState(null); // tam ekran foto görüntüleyici
  const [notifUnread, setNotifUnread] = useState(0);
  const loadedOnce = useRef(false);

  // Görüntülenme sayacı — her post oturumda 1 kez, göründüğünde raporlanır
  const seenViewsRef = useRef(new Set());
  const apiRef = useRef(api);
  apiRef.current = api;
  const onViewRef = useRef(({ viewableItems }) => {
    viewableItems.forEach((v) => {
      const id = v.item?.id;
      if (id && !seenViewsRef.current.has(id)) {
        seenViewsRef.current.add(id);
        apiRef.current.post(`/api/posts/${id}/view`).catch(() => {});
      }
    });
  });
  const viewConfigRef = useRef({ itemVisiblePercentThreshold: 60 });

  const load = useCallback(async () => {
    const endpoint = tab === 'discover' ? '/api/posts/discover' : '/api/posts/feed';
    if (!loadedOnce.current) setLoading(true);
    // Zil noktası: gerçek okunmamış bildirim sayısı (bloklamadan)
    api.get('/api/notifications/unread-count')
      .then((r) => setNotifUnread(Number(r?.count) || 0))
      .catch(() => {});
    try {
      const d = await api.get(endpoint);
      const list = Array.isArray(d?.posts) ? d.posts : (Array.isArray(d) ? d : []);
      setPosts(list.map(mapPost));
      loadedOnce.current = true;
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

  const toggleBookmark = useCallback((post) => {
    const saved = !post.saved;
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, saved } : p)));
    const req = saved ? api.post(`/api/posts/${post.id}/save`) : api.delete(`/api/posts/${post.id}/save`);
    req.catch(() => {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, saved: !saved } : p)));
    });
  }, [api]);

  const openComments = useCallback((post) => navigation.navigate('Comments', { postId: post.id }), [navigation]);
  const openProfile = useCallback((post) => { if (post.userId) navigation.navigate('UserProfile', { userId: post.userId }); }, [navigation]);
  const sharePost = useCallback((post) => { Share.share({ message: `${post.text || 'Social Fit paylaşımı'}\n\n— Social Fit 🌿` }).catch(() => {}); }, []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.lbBtn} activeOpacity={0.85} onPress={() => navigation.navigate('Leaderboard')}>
          <Ionicons name="trophy" size={17} color={colors.amberDark} />
          <Text style={styles.lbText}>Liderlik</Text>
          <Ionicons name="chevron-forward" size={15} color={colors.amberDark} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <TouchableOpacity style={styles.bell} onPress={() => navigation.navigate('Notifications')}><Ionicons name="notifications-outline" size={18} color="#3C4A42" />{notifUnread > 0 ? <View style={styles.bellDot} /> : null}</TouchableOpacity>
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
            onBookmark={toggleBookmark}
            onOpenMedia={setViewerUri}
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
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      />

      {/* Tam ekran foto görüntüleyici */}
      <Modal visible={!!viewerUri} transparent animationType="fade" onRequestClose={() => setViewerUri(null)}>
        <Pressable style={styles.viewerBackdrop} onPress={() => setViewerUri(null)}>
          {viewerUri ? (
            <Image source={{ uri: viewerUri }} style={styles.viewerImg} resizeMode="contain" />
          ) : null}
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerUri(null)} hitSlop={12}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topbar: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lbBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.amberTint, borderWidth: 1, borderColor: '#FBE6BC', borderRadius: 999, paddingLeft: 12, paddingRight: 9, paddingVertical: 8 },
  lbText: { fontFamily: font.bodyBold, fontSize: 15, color: colors.amberDark, letterSpacing: -0.2 },
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
  mediaBox: { marginHorizontal: 14, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.divider },
  viewerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', alignItems: 'center', justifyContent: 'center' },
  viewerImg: { width: '100%', height: '86%' },
  viewerClose: { position: 'absolute', top: 54, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  kcalTag: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(17,35,27,0.78)', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 12 },
  kcalText: { fontFamily: font.displayBold, fontSize: 12, color: colors.white },
  body: { fontSize: 14, color: colors.text, lineHeight: 21, paddingHorizontal: 16, paddingTop: 11 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingHorizontal: 16, paddingVertical: 13 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontFamily: font.displayBold, fontSize: 14, color: colors.text },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyText: { fontSize: 14, color: colors.muted, fontFamily: font.body, textAlign: 'center' },
});
