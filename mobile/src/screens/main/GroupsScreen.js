import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Image,
} from 'react-native';
import { useApi } from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE } from '../../config';

const GREEN = '#2D6A4F';
const GREEN_XL = '#D8F3DC';
const ORANGE = '#F4845F';
const ORANGE_L = '#FDDDD5';

const GROUP_EMOJIS = ['💪','🥗','🏃','🧘','🔥','🏋️','🚴','🥊'];
const GROUP_COLORS = ['#D8F3DC','#DBEAFE','#FEF3C7','#FDDDD5','#EDE9FE','#FCE7F3'];

function groupImageUri(group) {
  const url = group?.imageUrl;
  if (!url) return null;
  if (url.includes('/uploads/')) {
    const path = url.replace(/^https?:\/\/[^/]+/, '');
    return `${API_BASE}${path}`;
  }
  return url;
}

function matchesSearch(item, q) {
  if (!q || !q.trim()) return true;
  const lower = q.trim().toLowerCase();
  const name = (item.name || '').toLowerCase();
  const desc = (item.description || '').toLowerCase();
  return name.includes(lower) || desc.includes(lower);
}

export default function GroupsScreen({ navigation }) {
  const api = useApi();
  const [myGroups, setMyGroups] = useState([]);
  const [discover, setDiscover] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [mine, disc] = await Promise.all([api.get('/api/groups'), api.get('/api/groups/discover')]);
      setMyGroups(Array.isArray(mine) ? mine : []);
      setDiscover(Array.isArray(disc) ? disc : []);
    } catch (e) {
      setMyGroups([]);
      setDiscover([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const joinGroup = useCallback(
    async (groupId) => {
      try {
        await api.post(`/api/groups/${groupId}/join`);
        load();
      } catch (e) {}
    },
    [api, load]
  );

  const filteredMyGroups = useMemo(
    () => myGroups.filter((g) => matchesSearch(g, searchQuery)),
    [myGroups, searchQuery]
  );
  const filteredDiscover = useMemo(
    () => discover.filter((g) => matchesSearch(g, searchQuery)),
    [discover, searchQuery]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Gruplar</Text>
          <Text style={styles.headerSub}>Topluluğunla birlikte büyü 🌱</Text>
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateGroup')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.createBtnText}>Yeni Grup</Text>
        </TouchableOpacity>
      </View>

      {/* Arama */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Grup ara..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={GREEN} />}
      >
        {/* Kanallarım */}
        {filteredMyGroups.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Kanallarım</Text>
              <Text style={styles.sectionCount}>{filteredMyGroups.length} grup</Text>
            </View>
            {filteredMyGroups.map((item, idx) => {
              const emoji = GROUP_EMOJIS[idx % GROUP_EMOJIS.length];
              const bgColor = GROUP_COLORS[idx % GROUP_COLORS.length];
              const memberCount = item._count?.members ?? item.memberCount ?? 0;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.myGroupCard}
                  onPress={() => navigation.navigate('GroupFeed', { groupId: item.id, groupName: item.name })}
                  activeOpacity={0.8}
                >
                  {groupImageUri(item) ? (
                    <Image source={{ uri: groupImageUri(item) }} style={styles.groupAvatar} />
                  ) : (
                    <View style={[styles.groupAvatar, styles.groupAvatarEmoji, { backgroundColor: bgColor }]}>
                      <Text style={styles.groupEmoji}>{emoji}</Text>
                    </View>
                  )}
                  <View style={styles.groupBody}>
                    <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.groupMeta}>
                      <Ionicons name="people-outline" size={13} color="#9CA3AF" />
                      <Text style={styles.groupMetaText}>{memberCount} üye</Text>
                    </View>
                    <Text style={styles.groupPreview} numberOfLines={1}>
                      {item.latestPost?.caption || item.description || 'Son paylaşımları gör →'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* Öne Çıkan Kanallar */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Öne Çıkan Kanallar</Text>
          <Text style={styles.sectionCount}>{filteredDiscover.length} kanal</Text>
        </View>
        {filteredDiscover.length === 0 ? (
          <Text style={styles.emptySection}>Öne çıkan kanal bulunamadı.</Text>
        ) : (
          filteredDiscover.map((item, idx) => {
            const emoji = GROUP_EMOJIS[(idx + 2) % GROUP_EMOJIS.length];
            const bgColor = GROUP_COLORS[(idx + 1) % GROUP_COLORS.length];
            const memberCount = item._count?.members ?? item.memberCount ?? 0;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.discoverCard}
                onPress={() => joinGroup(item.id)}
                activeOpacity={0.8}
              >
                {groupImageUri(item) ? (
                  <Image source={{ uri: groupImageUri(item) }} style={styles.groupAvatar} />
                ) : (
                  <View style={[styles.groupAvatar, styles.groupAvatarEmoji, { backgroundColor: bgColor }]}>
                    <Text style={styles.groupEmoji}>{emoji}</Text>
                  </View>
                )}
                <View style={styles.groupBody}>
                  <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.groupMeta}>
                    <Ionicons name="people-outline" size={13} color="#9CA3AF" />
                    <Text style={styles.groupMetaText}>{memberCount} üye</Text>
                  </View>
                  <Text style={styles.groupSubtitle} numberOfLines={2}>
                    {item.description || 'Gruba katılarak topluluğun bir parçası ol!'}
                  </Text>
                </View>
                <View style={styles.joinBtn}>
                  <Text style={styles.joinBtnText}>Katıl</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {filteredMyGroups.length === 0 && filteredDiscover.length === 0 && (
          <Text style={styles.emptySection}>Hiç grup bulunamadı.</Text>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAF8' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: GREEN,
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 20,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, gap: 6,
  },
  createBtnText: { fontSize: 14, color: '#fff', fontWeight: '600' },

  // Arama
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    borderRadius: 14, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#111827' },

  // Liste
  scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sectionCount: { fontSize: 13, color: '#9CA3AF' },
  emptySection: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingVertical: 20 },

  // Benim Gruplarım
  myGroupCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },

  // Keşfet Kartı
  discoverCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
  },

  // Ortak
  groupAvatar: { width: 56, height: 56, borderRadius: 16 },
  groupAvatarEmoji: { justifyContent: 'center', alignItems: 'center' },
  groupEmoji: { fontSize: 26 },
  groupBody: { flex: 1, marginLeft: 12 },
  groupName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  groupMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  groupMetaText: { fontSize: 12, color: '#9CA3AF' },
  groupPreview: { fontSize: 13, color: '#6B7280' },
  groupSubtitle: { fontSize: 13, color: '#6B7280', lineHeight: 18 },

  joinBtn: {
    backgroundColor: GREEN_XL, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
  },
  joinBtnText: { fontSize: 13, color: GREEN, fontWeight: '700' },
});
