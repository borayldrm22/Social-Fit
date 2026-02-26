import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useApi } from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE } from '../../config';

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

  const renderItem = ({ item }) => (
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
          <Text style={styles.displayName}>{item.user?.profile?.displayName || 'Kullanıcı'}</Text>
          <Text style={styles.metaLine}>
            {postTypeLabel(item.type)} · {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
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
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        ListEmptyComponent={loading ? <Text style={styles.empty}>Yükleniyor...</Text> : <Text style={styles.empty}>Henüz paylaşım yok. İlk paylaşımı siz yapın!</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreatePost')}>
        <Ionicons name="add" size={28} color="#fff" />
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
  empty: { textAlign: 'center', padding: 24, color: '#6b7280' },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#2d6a4f', justifyContent: 'center', alignItems: 'center' },
});
