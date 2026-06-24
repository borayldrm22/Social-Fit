import React, { useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, RefreshControl, TextInput } from 'react-native';
import { useApi } from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE } from '../../config';
import DisplayNameWithStars from '../../components/DisplayNameWithStars';
import { useAuth } from '../../context/AuthContext';

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
  if (type === 'meal') return '🥗 Öğün';
  if (type === 'workout') return '💪 Antrenman';
  if (type === 'text') return '📝 Yazı';
  return '📌 Paylaşım';
}

const FOODLOG_PATTERN = /toplam (\d+) kalori aldım/;

function extractFoodLogCalories(caption) {
  if (!caption) return null;
  const m = caption.match(FOODLOG_PATTERN);
  return m ? parseInt(m[1], 10) : null;
}

const TABS = [
  { key: 'friends', label: 'Arkadaşlar', endpoint: '/api/posts/feed' },
  { key: 'discover', label: 'Keşfet',    endpoint: '/api/posts/discover' },
];

export default function FeedScreen({ navigation }) {
  const api = useApi();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef(null);
  const [posts, setPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failedImageIds, setFailedImageIds] = useState(() => new Set());
  // userId → true/false (takip ediliyor mu)
  const [followMap, setFollowMap] = useState({});
  const followingRef = useRef({});

  const load = useCallback(async (refresh = false, tabIndex = activeTab) => {
    const base = TABS[tabIndex].endpoint;
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      const url = refresh || !nextCursor ? base : `${base}${base.includes('?') ? '&' : '?'}cursor=${nextCursor}`;
      const data = await api.get(url);
      const list = data.posts || [];
      setPosts(refresh ? list : (prev) => [...prev, ...list]);
      setNextCursor(data.nextCursor || null);
      if (refresh) setFailedImageIds(new Set());

      // Post listesinden unique kullanıcıları çıkar, isFollowing bilgisini al
      if (refresh) {
        const uniqueUserIds = [...new Set(list.map((p) => p.user?.id).filter(Boolean))];
        const newMap = {};
        await Promise.all(
          uniqueUserIds.map(async (uid) => {
            if (uid === user?.id) return;
            try {
              const profile = await api.get(`/api/users/${uid}`);
              newMap[uid] = profile.isFollowing ?? false;
            } catch (_) {}
          })
        );
        followingRef.current = newMap;
        setFollowMap({ ...newMap });
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, nextCursor, activeTab, user]);

  useFocusEffect(
    useCallback(() => {
      load(true, activeTab);
    }, [activeTab])
  );

  const switchTab = useCallback((idx) => {
    if (idx === activeTab) return;
    setActiveTab(idx);
    setPosts([]);
    setNextCursor(null);
    // load tetiklenecek useFocusEffect → activeTab değişince de çalışır
    // Ama useFocusEffect sadece focus'ta tetikleniyor, direkt çağıralım:
    load(true, idx);
  }, [activeTab, load]);

  const handleSearch = useCallback((q) => {
    setSearchQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!q.trim()) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const data = await api.get(`/api/users/search?q=${encodeURIComponent(q.trim())}`);
        setSearchResults(Array.isArray(data) ? data : []);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 350);
  }, [api]);

  const toggleFollow = async (targetUserId) => {
    const isFollowing = followingRef.current[targetUserId] ?? false;
    // Optimistik güncelle
    followingRef.current[targetUserId] = !isFollowing;
    setFollowMap((prev) => ({ ...prev, [targetUserId]: !isFollowing }));
    try {
      if (isFollowing) {
        await api.delete(`/api/users/${targetUserId}/follow`);
      } else {
        await api.post(`/api/users/${targetUserId}/follow`);
      }
    } catch (e) {
      // Geri al
      followingRef.current[targetUserId] = isFollowing;
      setFollowMap((prev) => ({ ...prev, [targetUserId]: isFollowing }));
    }
  };

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

  const renderFeedTabs = () => (
    <View>
      {/* Arkadaş Arama Barı */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Arkadaş ara..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Arama Sonuçları */}
      {searchQuery.length > 0 && (
        <View style={styles.searchResultsWrap}>
          {searching && (
            <Text style={styles.searchHint}>Aranıyor...</Text>
          )}
          {!searching && searchResults.length === 0 && (
            <Text style={styles.searchHint}>Kullanıcı bulunamadı.</Text>
          )}
          {searchResults.map((u) => (
            <TouchableOpacity
              key={u.id}
              style={styles.searchResultRow}
              activeOpacity={0.8}
              onPress={() => {
                setSearchQuery(''); setSearchResults([]);
                navigation.navigate('UserProfile', { userId: u.id });
              }}
            >
              {u.profile?.avatarUrl ? (
                <Image source={{ uri: u.profile.avatarUrl }} style={styles.searchAvatar} />
              ) : (
                <View style={[styles.searchAvatar, styles.searchAvatarFallback]}>
                  <Text style={styles.searchAvatarInitial}>
                    {(u.profile?.displayName || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.searchResultInfo}>
                <Text style={styles.searchResultName}>{u.profile?.displayName || 'Kullanıcı'}</Text>
                {u.starPoints > 0 && (
                  <Text style={styles.searchResultStar}>⭐ {u.starPoints} puan</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Tab Bar */}
      <View style={styles.feedTabs}>
        {TABS.map((t, i) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.feedTab, i === activeTab && styles.feedTabActive]}
            onPress={() => switchTab(i)}
            activeOpacity={0.7}
          >
            <Text style={[styles.feedTabText, i === activeTab && styles.feedTabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderItem = ({ item }) => {
    const flCal = foodLogCal(item);
    const typeLabel = postTypeLabel(item.type);
    const isExample = item.id?.startsWith('example-');
    const isSelf = item.user?.id === user?.id;

    return (
      <View style={styles.card}>
        {/* Kart Başlığı */}
        <View style={styles.cardHeader}>
          {/* Avatar — tıklanınca profil */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => !isExample && item.user?.id && navigation.navigate('UserProfile', { userId: item.user.id })}
          >
            {item.user?.profile?.avatarUrl ? (
              <Image source={{ uri: item.user.profile.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarEmoji}>🧑</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.cardHeaderText}>
            <View style={styles.nameRow}>
              <DisplayNameWithStars
                displayName={item.user?.profile?.displayName}
                starPoints={item.user?.starPoints}
                nameStyle={styles.displayName}
              />
            </View>
            <View style={styles.chipRow}>
              {item.user?.starPoints != null && (
                <View style={styles.pointsChip}>
                  <Text style={styles.pointsChipText}>⭐ {item.user.starPoints} puan</Text>
                </View>
              )}
              <View style={styles.typeChip}>
                <Text style={styles.typeChipText}>{typeLabel}</Text>
              </View>
              {flCal != null && (
                <View style={styles.calChip}>
                  <Text style={styles.calChipText}>{flCal} kal</Text>
                </View>
              )}
            </View>
          </View>

          {/* Takip Et butonu — sağ üst köşe, zaten takip ediyorsa gösterme */}
          {!isExample && !isSelf && item.user?.id && followMap[item.user.id] === false && (
            <TouchableOpacity
              style={styles.followBtn}
              activeOpacity={0.8}
              onPress={() => toggleFollow(item.user.id)}
            >
              <Text style={styles.followBtnText}>Takip Et</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Görsel ya da Yazı Bloğu */}
        {item.type === 'text' ? (
          item.caption ? (
            <View style={styles.textPostBlock}>
              <Text style={styles.textPostContent}>{item.caption}</Text>
            </View>
          ) : null
        ) : postImageUri(item) && !failedImageIds.has(item.id) ? (
          <View style={styles.imageWrap}>
            <Image
              source={{ uri: postImageUri(item) }}
              style={styles.postImage}
              resizeMode="cover"
              onError={() => setFailedImageIds((s) => new Set(s).add(item.id))}
            />
            {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}
          </View>
        ) : (
          item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null
        )}

        <Text style={styles.timeText}>{formatRelativeTime(item.createdAt)}</Text>

        {/* Aksiyon Bar */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => !item.id.startsWith('example-') && like(item.id, item.liked)}
            style={styles.actionBtn}
          >
            <Ionicons name={item.liked ? 'heart' : 'heart-outline'} size={22} color={item.liked ? '#EF4444' : '#6b7280'} />
            <Text style={[styles.actionText, item.liked && styles.actionTextLiked]}>
              {item._count?.likes ?? 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => !item.id.startsWith('example-') && navigation.navigate('Comments', { postId: item.id })}
            style={styles.actionBtn}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#6b7280" />
            <Text style={styles.actionText}>{item._count?.comments ?? 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="share-outline" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderFeedTabs()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true, activeTab)} tintColor="#2d6a4f" />}
        onEndReached={() => nextCursor && load(false, activeTab)}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          loading
            ? <Text style={styles.empty}>Yükleniyor...</Text>
            : <Text style={styles.empty}>Henüz paylaşım yok. İlk paylaşımı siz yapın! 🌱</Text>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAF8' },
  listContent: { paddingTop: 8, paddingBottom: 100 },

  // ── Arama Barı ────────────────────────────────────────────
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    borderRadius: 14, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: '#111827' },
  searchResultsWrap: {
    backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 4,
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchHint: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: 14 },
  searchResultRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  searchAvatar: { width: 40, height: 40, borderRadius: 20 },
  searchAvatarFallback: { backgroundColor: '#D8F3DC', justifyContent: 'center', alignItems: 'center' },
  searchAvatarInitial: { fontSize: 17, fontWeight: '700', color: '#2D6A4F' },
  searchResultInfo: { flex: 1, marginLeft: 12 },
  searchResultName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  searchResultStar: { fontSize: 12, color: '#D97706', marginTop: 2 },

  // ── Feed Tabs ─────────────────────────────────────────────
  feedTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  feedTab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  feedTabActive: { borderBottomWidth: 2, borderBottomColor: '#2D6A4F' },
  feedTabText: { fontSize: 14, color: '#9CA3AF', fontWeight: '500' },
  feedTabTextActive: { color: '#2D6A4F', fontWeight: '700' },

  // ── Post Kartı ────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, paddingBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { backgroundColor: '#D8F3DC', justifyContent: 'center', alignItems: 'center' },
  avatarEmoji: { fontSize: 22 },
  cardHeaderText: { flex: 1, marginLeft: 10 },
  nameRow: { marginBottom: 4 },
  displayName: { fontWeight: '700', fontSize: 15, color: '#111827' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pointsChip: {
    backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20,
  },
  pointsChipText: { fontSize: 11, color: '#D97706', fontWeight: '600' },
  typeChip: {
    backgroundColor: '#D8F3DC', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20,
  },
  typeChipText: { fontSize: 11, color: '#2D6A4F', fontWeight: '600' },
  calChip: {
    backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20,
  },
  calChipText: { fontSize: 11, color: '#DC2626', fontWeight: '600' },
  timeText: { fontSize: 12, color: '#9CA3AF', paddingHorizontal: 14, paddingBottom: 10, marginTop: 2 },
  followBtn: {
    backgroundColor: '#D8F3DC',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, marginLeft: 8,
  },
  followBtnText: { fontSize: 12, fontWeight: '700', color: '#2D6A4F' },

  // ── Görsel ───────────────────────────────────────────────
  imageWrap: { position: 'relative' },
  postImage: { width: '100%', height: 260, backgroundColor: '#eee' },

  // ── Yazı Gönderi Bloğu ────────────────────────────────────
  textPostBlock: {
    marginHorizontal: 14, marginTop: 4, marginBottom: 2,
    backgroundColor: '#F7FAF8',
    borderLeftWidth: 3, borderLeftColor: '#2D6A4F',
    borderRadius: 10, padding: 14,
  },
  textPostContent: {
    fontSize: 16, color: '#1F2937', lineHeight: 24,
    fontWeight: '500',
  },

  // ── Caption ───────────────────────────────────────────────
  caption: { fontSize: 14, color: '#374151', lineHeight: 22, paddingHorizontal: 14, paddingTop: 10 },

  // ── Aksiyon Bar ───────────────────────────────────────────
  actions: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#F9FAFB',
    marginTop: 4,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  actionText: { marginLeft: 5, color: '#6B7280', fontSize: 14 },
  actionTextLiked: { color: '#EF4444' },
  // ── Misc ──────────────────────────────────────────────────
  empty: { textAlign: 'center', padding: 32, color: '#6B7280', fontSize: 15 },
});
