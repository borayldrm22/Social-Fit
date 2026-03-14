import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useApi } from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE } from '../../config';
import DisplayNameWithStars from '../../components/DisplayNameWithStars';

// Backend image URLs may use localhost; use API_BASE so images load on device too
function postImageUri(item) {
  const url = item.imageUrl ?? item.image_url;
  if (!url) return null;
  if (url.includes('/uploads/')) {
    const path = url.replace(/^https?:\/\/[^/]+/, '');
    return `${API_BASE}${path}`;
  }
  return url;
}

function formatRelativeTime(createdAt) {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'az önce';
  if (diffMins < 60) return `${diffMins} dakika önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays < 7) return `${diffDays} gün önce`;
  return date.toLocaleDateString('tr-TR');
}

function postTypeLabel(type) {
  return type === 'meal' ? 'Yemek' : type === 'workout' ? 'Antrenman' : type || 'Paylaşım';
}

const FOODLOG_PATTERN = /toplam (\d+) kalori aldım/;

function extractFoodLogCalories(caption) {
  if (!caption) return null;
  const m = caption.match(FOODLOG_PATTERN);
  return m ? parseInt(m[1], 10) : null;
}

// Local assets for example posts (meals + workout)
const EXAMPLE_IMAGES = {
  smoothie: require('../../../assets/smoothie-bowl.png'),
  chickenRice: require('../../../assets/chicken-rice-bowl.png'),
  runner: require('../../../assets/runner.png'),
};

// Example posts shown when feed is empty (e.g. not logged in as admin or API unreachable)
const EXAMPLE_POSTS = [
  {
    id: 'example-0',
    type: 'meal',
    caption: 'Tavuklu pilav kase – taze sebzelerle dengeli öğle yemeği. 🍚🥗',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    imageUrl: null,
    imageLocal: 'chickenRice',
    liked: false,
    user: { profile: { displayName: 'Nilsu Şahin', avatarUrl: null } },
    _count: { likes: 18, comments: 3 },
  },
  {
    id: 'example-1',
    type: 'meal',
    caption: 'Bugün öğle yemeğim: Tavuklu salata ve taze sıkılmış portakal suyu. 🥗🍊',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    imageUrl: null,
    imageLocal: 'smoothie',
    liked: false,
    user: { profile: { displayName: 'Nilsu Şahin', avatarUrl: null } },
    _count: { likes: 23, comments: 5 },
  },
  {
    id: 'example-2',
    type: 'workout',
    caption: 'Sabah koşusu tamamlandı! 5 km, 25 dakika. #Koşu 🏃‍♂️☁️',
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    imageUrl: null,
    imageLocal: 'runner',
    liked: false,
    user: { profile: { displayName: 'Elif Demir', avatarUrl: null } },
    _count: { likes: 40, comments: 12 },
  },
];

export default function FeedScreen({ navigation }) {
  const api = useApi();
  const [posts, setPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failedImageIds, setFailedImageIds] = useState(() => new Set());

  const load = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      const data = await api.get(refresh ? '/api/posts/feed' : `/api/posts/feed?cursor=${nextCursor || ''}`);
      const list = data.posts || [];
      setPosts(refresh ? list : (prev) => [...prev, ...list]);
      setNextCursor(data.nextCursor || null);
      if (refresh) setFailedImageIds(new Set());
      // If feed is empty after refresh, show example posts so the feed is never blank
      if (refresh && list.length === 0) setPosts(EXAMPLE_POSTS);
    } catch (e) {
      console.warn(e);
      if (refresh) setPosts(EXAMPLE_POSTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, nextCursor]);

  useFocusEffect(
    useCallback(() => {
      load(true);
    }, [])
  );

  const like = async (postId, liked) => {
    try {
      if (liked) await api.delete(`/api/posts/${postId}/like`);
      else await api.post(`/api/posts/${postId}/like`);
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, liked: !liked, _count: { ...p._count, likes: p._count.likes + (liked ? -1 : 1) } } : p)));
    } catch (e) {}
  };

  const foodLogCal = useCallback((item) => {
    if (item.type !== 'meal') return null;
    return extractFoodLogCalories(item.caption);
  }, []);

  const renderQuickActions = () => (
    <View style={styles.quickStrip}>
      <TouchableOpacity
        style={styles.quickPill}
        activeOpacity={0.75}
        onPress={() => navigation.getParent()?.navigate('More', { screen: 'FoodLog' })}
      >
        <Ionicons name="nutrition-outline" size={15} color="#2d6a4f" />
        <Text style={styles.quickPillText}>Yemek Ekle</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.quickPill}
        activeOpacity={0.75}
        onPress={() => navigation.getParent()?.navigate('Create', {
          screen: 'CreatePost',
          params: { prefillType: 'workout' },
        })}
      >
        <Ionicons name="barbell-outline" size={15} color="#2d6a4f" />
        <Text style={styles.quickPillText}>Antrenman Ekle</Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }) => {
    const flCal = foodLogCal(item);
    return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {item.user?.profile?.avatarUrl ? (
          <Image source={{ uri: item.user.profile.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={20} color="#9ca3af" />
          </View>
        )}
        <View style={styles.cardHeaderText}>
          <DisplayNameWithStars
            displayName={item.user?.profile?.displayName}
            starPoints={item.user?.starPoints}
            nameStyle={styles.displayName}
          />
          <Text style={styles.metaLine}>
            {postTypeLabel(item.type)} · {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
        {flCal != null && (
          <View style={styles.calBadge}>
            <Text style={styles.calBadgeText}>🥗 {flCal} kal</Text>
          </View>
        )}
      </View>
      {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}
      {item.imageLocal && EXAMPLE_IMAGES[item.imageLocal] ? (
        <Image source={EXAMPLE_IMAGES[item.imageLocal]} style={styles.postImage} resizeMode="cover" />
      ) : postImageUri(item) && !failedImageIds.has(item.id) ? (
        <Image
          source={{ uri: postImageUri(item) }}
          style={styles.postImage}
          resizeMode="cover"
          onError={() => setFailedImageIds((s) => new Set(s).add(item.id))}
        />
      ) : (
        <View style={styles.postImagePlaceholder}>
          <Ionicons name="image-outline" size={40} color="#9ca3af" />
        </View>
      )}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => !item.id.startsWith('example-') && like(item.id, item.liked)}
          style={styles.actionBtn}
        >
          <Ionicons name={item.liked ? 'heart' : 'heart-outline'} size={22} color={item.liked ? '#e63946' : '#6b7280'} />
          <Text style={styles.actionText}>{item._count?.likes ?? 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => !item.id.startsWith('example-') && navigation.navigate('Comments', { postId: item.id })}
          style={styles.actionBtn}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#6b7280" />
          <Text style={styles.actionText}>{item._count?.comments ?? 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );};

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderQuickActions}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        ListEmptyComponent={loading ? <Text style={styles.empty}>Yükleniyor...</Text> : <Text style={styles.empty}>Henüz paylaşım yok. İlk paylaşımı siz yapın!</Text>}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.getParent()?.navigate('More', { screen: 'Coaches' })}
        activeOpacity={0.9}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
        <Text style={styles.fabLabel}>Diyetisyenimle Görüş</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  card: { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 12, padding: 16, borderRadius: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  cardHeaderText: { marginLeft: 12, flex: 1 },
  displayName: { fontWeight: '600', fontSize: 16, color: '#111827' },
  metaLine: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  caption: { fontSize: 14, color: '#374151', marginBottom: 8 },
  postImage: { width: '100%', height: 240, borderRadius: 8, backgroundColor: '#eee' },
  postImagePlaceholder: { width: '100%', height: 200, borderRadius: 8, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  actionText: { marginLeft: 6, color: '#6b7280', fontSize: 14 },
  quickStrip: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6, gap: 8 },
  quickPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb' },
  quickPillText: { fontSize: 13, fontWeight: '500', color: '#374151', marginLeft: 6 },
  calBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0' },
  calBadgeText: { fontSize: 11, fontWeight: '600', color: '#2d6a4f' },
  empty: { textAlign: 'center', padding: 24, color: '#6b7280' },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 88,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d6a4f',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabLabel: { color: '#fff', fontWeight: '600', fontSize: 13, marginLeft: 8 },
});
