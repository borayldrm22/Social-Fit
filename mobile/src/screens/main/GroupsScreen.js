// GroupsScreen.js — SocialFit redesign · Gruplar / Topluluk
// Konum: src/screens/main/GroupsScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../../api/client';
import { API_BASE } from '../../config';
import { colors, font, shadow } from '../../theme/socialFitTheme';
import { comingSoon } from '../../utils/comingSoon';

// Backend grubuna sabit emoji/renk atamak için (isimden deterministik)
const EMOJIS = ['🧓', '🥦', '🏃', '🍬', '👶', '💪', '🧘', '🥗', '🚴', '⚽'];
const TINTS = ['#FCEAD6', colors.mint, '#FDEBE3', '#FBE9C8', '#E7EEF7', '#E4F3EA', '#FFEDE6', '#FEF3DC'];
function pickByName(name = '', arr) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

// Backend grup (/api/groups) -> kanal şekli
function mapGroup(g) {
  return {
    id: g.id,
    name: g.name,
    imageUrl: g.imageUrl || null,
    emoji: pickByName(g.name, EMOJIS),
    tint: pickByName(g.name, TINTS),
    memberCount: g._count?.members ?? 0,
  };
}

function resolveUri(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

// Grup kapağı: fotoğraf varsa göster, yoksa isimden türeyen emoji
function ChannelCover({ uri, emoji, tint }) {
  if (uri) return <Image source={{ uri }} style={styles.groupCover} />;
  return (
    <View style={[styles.groupCover, { backgroundColor: tint }]}>
      <Text style={styles.coverEmoji}>{emoji}</Text>
    </View>
  );
}

export default function GroupsScreen({ navigation }) {
  const api = useApi();
  const insets = useSafeAreaInsets();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    api.get('/api/groups')
      .then((d) => { if (!cancelled) setChannels(Array.isArray(d) ? d.map(mapGroup) : []); })
      .catch(() => { if (!cancelled) setChannels([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [api]);
  useFocusEffect(useCallback(() => load(), [load]));

  const renderHeader = useCallback(
    () => (
      <>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.title}>Topluluk</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => comingSoon('Grup arama')}>
              <Ionicons name="search" size={19} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtnGreen} activeOpacity={0.85} onPress={() => navigation.navigate('CreateGroup')}>
              <Ionicons name="add" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.mapBanner} activeOpacity={0.9} onPress={() => navigation.navigate('GroupMap')}>
          <View style={styles.mapBannerIcon}><Ionicons name="map" size={20} color={colors.white} /></View>
          <View style={styles.mapBannerText}>
            <Text style={styles.mapBannerTitle}>Haritada Keşfet</Text>
            <Text style={styles.mapBannerSub}>Yakınındaki grupları haritada gör</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={styles.mapBannerChevron.color} />
        </TouchableOpacity>

        <View style={styles.rowHead}>
          <Text style={styles.sectionTitle}>Kanallarım</Text>
          <TouchableOpacity onPress={() => navigation.navigate('GroupDiscover')}>
            <Text style={styles.sectionLink}>Keşfet</Text>
          </TouchableOpacity>
        </View>
      </>
    ),
    [insets.top, navigation]
  );

  const renderEmpty = useCallback(() => {
    if (loading) return <ActivityIndicator color={colors.primary} size="large" style={styles.loading} />;
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>👥</Text>
        <Text style={styles.emptyTitle}>Henüz bir gruba katılmadın</Text>
        <Text style={styles.emptyText}>Sana uygun toplulukları keşfet ve katıl.</Text>
        <TouchableOpacity style={styles.emptyCta} activeOpacity={0.85} onPress={() => navigation.navigate('GroupDiscover')}>
          <Ionicons name="compass-outline" size={18} color={colors.white} />
          <Text style={styles.emptyCtaText}>Grupları Keşfet</Text>
        </TouchableOpacity>
      </View>
    );
  }, [loading, navigation]);

  const renderGroupCard = useCallback(
    ({ item }) => (
      <TouchableOpacity
        activeOpacity={0.78}
        style={styles.groupCard}
        onPress={() => navigation.navigate('GroupFeed', { groupId: item.id, groupName: item.name })}
      >
        <ChannelCover uri={resolveUri(item.imageUrl)} emoji={item.emoji} tint={item.tint} />
        <View style={styles.groupInfo}>
          <Text style={styles.groupName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.groupMeta} numberOfLines={1}>{item.memberCount} uye</Text>
        </View>
      </TouchableOpacity>
    ),
    [navigation]
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={channels}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={renderGroupCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        columnWrapperStyle={styles.columnWrap}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 28 },
  header: { paddingHorizontal: 18, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: font.displayBold, fontSize: 22, color: colors.ink, letterSpacing: -0.3 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  iconBtnGreen: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 18, marginBottom: 10 },
  sectionTitle: { fontFamily: font.bodyBold, fontSize: 16, color: colors.ink },
  sectionLink: { fontSize: 13, color: colors.primary, fontFamily: font.bodyBold },
  mapBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 18, marginBottom: 16, backgroundColor: colors.primary, borderRadius: 18, padding: 14, ...shadow.cta },
  mapBannerIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  mapBannerText: { flex: 1 },
  mapBannerChevron: { color: 'rgba(255,255,255,0.85)' },
  mapBannerTitle: { fontFamily: font.bodyBold, fontSize: 15, color: colors.white },
  mapBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontFamily: font.body, marginTop: 2 },
  columnWrap: { paddingHorizontal: 14, gap: 10 },
  groupCard: { flex: 1, marginBottom: 12, borderRadius: 18, backgroundColor: colors.surface, overflow: 'hidden', ...shadow.card },
  groupCover: { width: '100%', aspectRatio: 1.5, borderBottomWidth: 1, borderBottomColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  coverEmoji: { fontSize: 34 },
  groupInfo: { paddingHorizontal: 12, paddingVertical: 10 },
  groupName: { fontFamily: font.bodyBold, fontSize: 14, color: colors.ink, lineHeight: 19, minHeight: 38 },
  groupMeta: { fontFamily: font.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  loading: { marginTop: 40 },
  empty: { alignItems: 'center', marginTop: 40, paddingHorizontal: 32, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontFamily: font.displayBold, fontSize: 17, color: colors.ink, marginTop: 6 },
  emptyText: { fontSize: 14, color: colors.muted, fontFamily: font.body, textAlign: 'center' },
  emptyCta: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 18, paddingHorizontal: 20, paddingVertical: 12, marginTop: 14, ...shadow.cta },
  emptyCtaText: { color: colors.white, fontFamily: font.bodyBold, fontSize: 15 },
});

