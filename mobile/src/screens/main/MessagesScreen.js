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
import { formatRelativeTimeShort } from '../../utils/formatRelativeTime';
import DisplayNameWithStars from '../../components/DisplayNameWithStars';

const HEADER_GREEN = '#4a7c59';
const PLACEHOLDER_BG = '#e8b4bc';

/** Example conversation shown when there are no real conversations (matches design) */
const EXAMPLE_CONVERSATION = {
  userId: '_example',
  profile: { displayName: 'Alex Johnson', avatarUrl: null },
  lastMessage: 'Hey, are we still on for the run?',
  lastAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  unreadCount: 4,
  points: 14,
  starPoints: 12,
};

function AvatarCircle({ profile, size = 48 }) {
  const uri = profile?.avatarUrl;
  const name = profile?.displayName || '?';
  const initial = name.charAt(0).toUpperCase();
  if (uri) {
    return <Image source={{ uri }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />;
  }
  return (
    <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarInitial, { fontSize: size * 0.45 }]}>{initial}</Text>
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

  const listData = useMemo(() => {
    if (filtered.length > 0) return filtered;
    if ((searchQuery || '').trim()) return [];
    return [EXAMPLE_CONVERSATION];
  }, [filtered, searchQuery]);

  const profile = user?.profile || {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AvatarCircle profile={profile} size={40} />
        <Text style={styles.headerTitle}>Mesajlar</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('SearchUsers')} style={styles.headerIcon}>
            <Ionicons name="person-add-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Mesajlarda ara"
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <FlatList
        data={listData}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={listData.length === 0 ? styles.listEmpty : undefined}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {searchQuery.trim() ? 'Arama sonucu yok.' : 'Henüz sohbet yok. Arkadaşlarınızla mesajlaşın.'}
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            activeOpacity={0.7}
            onPress={() => {
              if (item.userId === '_example') return;
              navigation.navigate('Chat', {
                userId: item.userId,
                displayName: item.profile?.displayName || 'Kullanıcı',
                avatarUrl: item.profile?.avatarUrl,
                starPoints: item.starPoints,
              });
            }}
          >
            <AvatarCircle profile={item.profile} size={52} />
            <View style={styles.itemCenter}>
              <View style={styles.itemTopRow}>
                <DisplayNameWithStars
                  displayName={item.profile?.displayName}
                  starPoints={item.starPoints}
                  nameStyle={styles.name}
                />
                <Text style={styles.time}>{formatRelativeTimeShort(item.lastAt)}</Text>
              </View>
              <View style={styles.itemBottomRow}>
                {item.unreadCount > 0 ? (
                  <Text style={styles.unread} numberOfLines={1}>
                    +{item.unreadCount} Yeni Mesaj
                  </Text>
                ) : (
                  <Text style={styles.preview} numberOfLines={1}>
                    {item.lastMessage || '—'}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.leafBlock}>
              <Text style={styles.pointsText}>{item.points != null && item.points > 0 ? item.points : '–'}</Text>
              <Ionicons name="leaf" size={18} color="#2d6a4f" />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: HEADER_GREEN,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { padding: 4 },
  avatar: { backgroundColor: '#e5e7eb' },
  avatarPlaceholder: {
    backgroundColor: PLACEHOLDER_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { color: '#fff', fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16 },
  listEmpty: { flexGrow: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 1,
  },
  itemCenter: { flex: 1, marginLeft: 12, minWidth: 0 },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  name: { fontWeight: '700', fontSize: 16, color: '#111827', flex: 1 },
  time: { fontSize: 12, color: '#9ca3af', marginLeft: 8 },
  itemBottomRow: { flexDirection: 'row', alignItems: 'center' },
  preview: { fontSize: 14, color: '#6b7280', flex: 1 },
  unread: { fontSize: 14, color: '#2d6a4f', fontWeight: '600', flex: 1 },
  leafBlock: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  pointsText: { fontSize: 14, color: '#374151', marginRight: 4 },
  empty: { textAlign: 'center', padding: 24, color: '#6b7280', fontSize: 15 },
});
