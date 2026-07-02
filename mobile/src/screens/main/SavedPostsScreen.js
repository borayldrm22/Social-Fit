import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE } from '../../config';
import { useApi } from '../../api/client';
import { Avatar, Placeholder, StarPill } from '../../components/sf/ui';
import { colors, font, shadow } from '../../theme/socialFitTheme';

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
  try { return JSON.parse(metadata); } catch (_) { return {}; }
}

function mapPost(p) {
  const meta = parseMeta(p.metadata);
  const isMeal = p.type === 'meal';
  let kind = isMeal ? 'Öğün' : 'Antrenman';
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
    saved: !!p.saved,
    hasImage: !!imageUrl,
    imageUrl,
  };
}

function SavedPostCard({ item, onLike, onComment, onOpenProfile, onShare, onUnsave }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <TouchableOpacity style={styles.headInfo} activeOpacity={0.7} onPress={() => onOpenProfile(item)}>
          <Avatar profile={item.profile} size={44} />
          <View style={styles.authorBlock}>
            <View style={styles.authorLine}>
              <Text style={styles.name}>{item.profile.displayName}</Text>
              <StarPill value={item.starPoints} />
            </View>
            <Text style={styles.meta}>{item.when} · {item.kind}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity hitSlop={8} onPress={() => onUnsave(item)}>
          <Ionicons name="bookmark" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {item.hasImage ? (
        item.imageUrl ? (
          <View style={styles.imageWrap}>
            <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
            {item.kcal ? (
              <View style={styles.kcalTag}><Text style={styles.kcalText}>{item.kcal} kcal</Text></View>
            ) : null}
          </View>
        ) : (
          <Placeholder height={190} radius={18} label="öğün fotoğrafı" style={styles.imageWrap}>
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
          <Ionicons name="chatbubble-outline" size={19} color={colors.faint} />
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} activeOpacity={0.7} onPress={() => onShare(item)}>
          <Ionicons name="paper-plane-outline" size={19} color={colors.faint} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SavedPostsScreen({ navigation }) {
  const api = useApi();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.get('/api/posts/saved');
      const list = Array.isArray(data?.posts) ? data.posts : [];
      setPosts(list.map(mapPost));
    } catch (e) {
      setError('Kaydedilenler yüklenemedi, tekrar dene.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      setError(null);
      api.get('/api/posts/saved')
        .then((data) => {
          if (!cancelled) {
            const list = Array.isArray(data?.posts) ? data.posts : [];
            setPosts(list.map(mapPost));
          }
        })
        .catch(() => { if (!cancelled) setError('Kaydedilenler yüklenemedi, tekrar dene.'); })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [api])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const toggleLike = useCallback((post) => {
    const liked = !post.liked;
    setPosts((prev) => prev.map((p) => (p.id === post.id
      ? { ...p, liked, likes: Math.max(0, p.likes + (liked ? 1 : -1)) }
      : p)));
    const req = liked ? api.post(`/api/posts/${post.id}/like`) : api.delete(`/api/posts/${post.id}/like`);
    req.catch(() => {
      setPosts((prev) => prev.map((p) => (p.id === post.id
        ? { ...p, liked: !liked, likes: Math.max(0, p.likes + (liked ? -1 : 1)) }
        : p)));
    });
  }, [api]);

  const unsave = useCallback((post) => {
    const previous = posts;
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    api.delete(`/api/posts/${post.id}/save`).catch(() => setPosts(previous));
  }, [api, posts]);

  const openComments = useCallback((post) => navigation.navigate('Comments', { postId: post.id }), [navigation]);
  const openProfile = useCallback((post) => { if (post.userId) navigation.navigate('UserProfile', { userId: post.userId }); }, [navigation]);
  const sharePost = useCallback((post) => { Share.share({ message: `${post.text || 'Social Fit paylaşımı'}\n\n— Social Fit` }).catch(() => {}); }, []);

  return (
    <View style={styles.screen}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SavedPostCard
            item={item}
            onLike={toggleLike}
            onComment={openComments}
            onOpenProfile={openProfile}
            onShare={sharePost}
            onUnsave={unsave}
          />
        )}
        ListHeaderComponent={
          <View style={styles.hero}>
            <View style={styles.heroIcon}><Ionicons name="bookmark" size={24} color={colors.primary} /></View>
            <Text style={styles.title}>Kaydettiklerim</Text>
            <Text style={styles.subtitle}>Sonra dönmek istediğin paylaşımlar burada toplanır.</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} size="large" style={styles.centerState} />
          ) : (
            <View style={styles.emptyWrap}>
              <Ionicons name={error ? 'cloud-offline-outline' : 'bookmark-outline'} size={42} color={colors.faint} />
              <Text style={styles.emptyTitle}>{error ? 'Bir şey ters gitti' : 'Henüz kayıt yok'}</Text>
              <Text style={styles.emptyText}>{error || 'Akıştaki bookmark ikonuna dokunarak gönderileri buraya ekleyebilirsin.'}</Text>
              {error ? (
                <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.8}>
                  <Text style={styles.retryText}>Tekrar dene</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )
        }
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingTop: 14, paddingBottom: 28, flexGrow: 1 },
  hero: { marginHorizontal: 16, marginBottom: 14, backgroundColor: colors.surface, borderRadius: 24, padding: 18, ...shadow.card },
  heroIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontFamily: font.displayBold, fontSize: 24, color: colors.ink, letterSpacing: -0.4 },
  subtitle: { fontFamily: font.body, fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 19 },
  card: { marginHorizontal: 16, marginBottom: 14, backgroundColor: colors.surface, borderRadius: 24, ...shadow.card, paddingBottom: 4, overflow: 'hidden' },
  cardHead: { padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  headInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  authorBlock: { flex: 1 },
  authorLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontFamily: font.bodyBold, fontSize: 15, color: colors.ink },
  meta: { fontSize: 12, color: colors.faint, marginTop: 3, fontFamily: font.body },
  imageWrap: { marginHorizontal: 14, borderRadius: 18, overflow: 'hidden' },
  image: { width: '100%', height: 190 },
  kcalTag: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(17,35,27,0.78)', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 12 },
  kcalText: { fontFamily: font.displayBold, fontSize: 12, color: colors.white },
  body: { fontSize: 14, color: colors.text, lineHeight: 21, paddingHorizontal: 16, paddingTop: 11 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingHorizontal: 16, paddingVertical: 13 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontFamily: font.displayBold, fontSize: 14, color: colors.text },
  centerState: { marginTop: 60 },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 34, paddingTop: 42 },
  emptyTitle: { fontFamily: font.displayBold, fontSize: 18, color: colors.ink },
  emptyText: { fontFamily: font.body, fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19 },
  retryBtn: { marginTop: 8, backgroundColor: colors.primary, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10 },
  retryText: { fontFamily: font.bodyBold, fontSize: 13, color: colors.white },
});
