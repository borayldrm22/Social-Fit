import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
} from 'react-native';
import { useApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE } from '../../config';

const GREEN = '#2D6A4F';
const GREEN_XL = '#D8F3DC';
const PLACEHOLDER_COLORS = ['#52B788', '#3B82F6', '#F4845F', '#FBBF24', '#8B5CF6'];

function resolveUri(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

function formatTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'şimdi';
  if (diffMins < 60) return `${diffMins}dk`;
  if (diffHours < 24) return `${diffHours}sa`;
  if (diffDays < 7) return `${diffDays}g`;
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function getAvatarColor(name) {
  if (!name) return PLACEHOLDER_COLORS[0];
  return PLACEHOLDER_COLORS[name.charCodeAt(0) % PLACEHOLDER_COLORS.length];
}

function AvatarCircle({ profile, size = 48, showOnline = false }) {
  const uri = resolveUri(profile?.avatarUrl);
  const name = profile?.displayName || '?';
  const initial = name.charAt(0).toUpperCase();
  return (
    <View style={{ position: 'relative', width: size, height: size }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <View style={[
          styles.avatarPlaceholder,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: getAvatarColor(name) }
        ]}>
          <Text style={[styles.avatarInitial, { fontSize: size * 0.42 }]}>{initial}</Text>
        </View>
      )}
      {showOnline && (
        <View style={[styles.onlineDot, {
          width: size * 0.28, height: size * 0.28,
          borderRadius: size * 0.14, right: 0, bottom: 0,
        }]} />
      )}
    </View>
  );
}

export default function MessagesScreen({ navigation }) {
  const api = useApi();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api.get('/api/messages/conversations');
      setConversations(Array.isArray(data) ? data : []);
    } catch (e) {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        (c.profile?.displayName || '').toLowerCase().includes(q) ||
        (c.lastMessage || '').toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const profile = user?.profile || {};

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.getParent()?.navigate('Profile')}
          activeOpacity={0.85}
        >
          <AvatarCircle profile={profile} size={38} showOnline />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mesajlar</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('SearchUsers')}
          style={styles.headerIconBtn}
        >
          <Ionicons name="person-add-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Arama */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Mesajlarda ara..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={filtered.length === 0 ? styles.listEmpty : { paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        onRefresh={load}
        refreshing={loading}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="chatbubbles-outline" size={52} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Henüz mesaj yok</Text>
            <Text style={styles.emptyDesc}>
              Arkadaşlarınla mesajlaşmaya başlamak için sağ üstteki butona bas.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('Chat', {
                userId: item.userId,
                displayName: item.profile?.displayName || 'Kullanıcı',
                avatarUrl: item.profile?.avatarUrl,
                starPoints: item.starPoints,
              })
            }
          >
            <AvatarCircle profile={item.profile} size={52} />
            <View style={styles.itemCenter}>
              <View style={styles.itemTopRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.profile?.displayName || 'Kullanıcı'}
                </Text>
                <Text style={styles.time}>{formatTime(item.lastAt)}</Text>
              </View>
              <View style={styles.itemBottomRow}>
                <Text
                  style={item.unreadCount > 0 ? styles.unreadPreview : styles.preview}
                  numberOfLines={1}
                >
                  {item.lastMessage || '—'}
                </Text>
                {item.starPoints > 0 && (
                  <View style={styles.starChip}>
                    <Text style={styles.starChipText}>⭐ {item.starPoints}</Text>
                  </View>
                )}
              </View>
            </View>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAF8' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: GREEN,
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 18,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: '#fff', marginLeft: 12 },
  headerIconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Avatar
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontWeight: '700' },
  onlineDot: {
    position: 'absolute',
    backgroundColor: '#22C55E',
    borderWidth: 2, borderColor: GREEN,
  },

  // Arama
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 14, marginBottom: 8,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 2,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#111827' },

  // Boş ekran
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', padding: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },

  // Liste
  item: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 13, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  itemCenter: { flex: 1, marginLeft: 12, minWidth: 0 },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontWeight: '700', fontSize: 15, color: '#111827', flex: 1 },
  time: { fontSize: 12, color: '#9CA3AF', marginLeft: 8 },
  itemBottomRow: { flexDirection: 'row', alignItems: 'center' },
  preview: { fontSize: 13, color: '#6B7280', flex: 1 },
  unreadPreview: { fontSize: 13, color: '#111827', fontWeight: '600', flex: 1 },
  starChip: {
    backgroundColor: '#FEF3C7', paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 10, marginLeft: 6,
  },
  starChipText: { fontSize: 11, color: '#D97706', fontWeight: '600' },
  unreadBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 6, marginLeft: 8,
  },
  unreadBadgeText: { fontSize: 12, color: '#fff', fontWeight: '700' },
});
