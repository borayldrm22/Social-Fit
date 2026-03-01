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

const PANEL_RADIUS = 20;
const GREEN = '#2d6a4f';
const LIGHT_GREEN = '#d1fae5';
const DARK_BG = '#374151';

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
      <View style={styles.panel}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        >
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Ionicons name="leaf" size={24} color={GREEN} style={styles.brandIcon} />
              <Text style={styles.brandText}>Social Fit</Text>
            </View>
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={18} color={GREEN} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Grupları ara"
                placeholderTextColor="#6b7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Öne Çıkan Kanallar</Text>
          {filteredDiscover.length === 0 ? (
            <Text style={styles.emptySection}>Öne çıkan kanal yok.</Text>
          ) : (
            filteredDiscover.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.cardFeatured}
                onPress={() => joinGroup(item.id)}
                activeOpacity={0.8}
              >
                {groupImageUri(item) ? (
                  <Image source={{ uri: groupImageUri(item) }} style={styles.cardImage} />
                ) : (
                  <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                    <Ionicons name="people" size={28} color={GREEN} />
                  </View>
                )}
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.cardSubtitle} numberOfLines={2}>
                    {item.description || 'Grup açıklaması yok.'}
                  </Text>
                  <Text style={styles.joinChip}>Katıl</Text>
                </View>
              </TouchableOpacity>
            ))
          )}

          <Text style={styles.sectionTitle}>Kanallarım</Text>
          {filteredMyGroups.length === 0 ? (
            <Text style={styles.emptySection}>Henüz kanalınız yok. Yukarıdan bir kanala katılın.</Text>
          ) : (
            filteredMyGroups.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.cardMine}
                onPress={() => navigation.navigate('GroupFeed', { groupId: item.id, groupName: item.name })}
                activeOpacity={0.8}
              >
                {groupImageUri(item) ? (
                  <Image source={{ uri: groupImageUri(item) }} style={styles.cardImage} />
                ) : (
                  <View style={[styles.cardImage, styles.cardImagePlaceholderMine]}>
                    <Ionicons name="chatbubbles" size={24} color={GREEN} />
                  </View>
                )}
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.cardSubtitleMine} numberOfLines={2}>
                    {item.latestPost?.caption
                      ? `Yeni paylaşım: ${item.latestPost.caption}`
                      : item.description || 'Son paylaşımları gör'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}

          <View style={styles.bottomPad} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK_BG },
  panel: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: PANEL_RADIUS,
    borderTopRightRadius: PANEL_RADIUS,
    overflow: 'hidden',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandIcon: { marginRight: 8 },
  brandText: { fontSize: 18, fontWeight: '600', color: '#111827' },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_GREEN,
    borderRadius: 12,
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', paddingVertical: 0 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  emptySection: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  cardFeatured: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardMine: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_GREEN,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cardImage: { width: 56, height: 56, borderRadius: 28 },
  cardImagePlaceholder: { backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  cardImagePlaceholderMine: { backgroundColor: '#a7f3d0', justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cardSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  cardSubtitleMine: { fontSize: 13, color: '#374151', marginTop: 4 },
  joinChip: { fontSize: 12, fontWeight: '600', color: GREEN, marginLeft: 8 },
  bottomPad: { height: 16 },
});
