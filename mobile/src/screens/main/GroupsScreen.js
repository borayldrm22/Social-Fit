// GroupsScreen.js — SocialFit redesign · Gruplar / Topluluk
// Konum: src/screens/main/GroupsScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
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
    last: g.latestPost?.caption || `${g._count?.members ?? 0} üye`,
    time: '',
    unread: 0,
  };
}

function resolveUri(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

// Grup ikonu: fotoğraf varsa göster, yoksa isimden türeyen emoji
function ChannelIcon({ uri, emoji, tint }) {
  if (uri) return <Image source={{ uri }} style={styles.chIcon} />;
  return (
    <View style={[styles.chIcon, { backgroundColor: tint }]}>
      <Text style={{ fontSize: 25 }}>{emoji}</Text>
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 28, paddingTop: insets.top }}>
      <View style={styles.header}>
        <Text style={styles.title}>Topluluk</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => comingSoon('Grup arama')}><Ionicons name="search" size={19} color="#3C4A42" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtnGreen} activeOpacity={0.85} onPress={() => navigation.navigate('CreateGroup')}>
            <Ionicons name="add" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.mapBanner} activeOpacity={0.9} onPress={() => navigation.navigate('GroupMap')}>
        <View style={styles.mapBannerIcon}><Ionicons name="map" size={20} color={colors.white} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.mapBannerTitle}>Haritada Keşfet</Text>
          <Text style={styles.mapBannerSub}>Yakınındaki grupları haritada gör</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.85)" />
      </TouchableOpacity>

      <View style={styles.rowHead}>
        <Text style={styles.sectionTitle}>Kanallarım</Text>
        <TouchableOpacity onPress={() => navigation.navigate('GroupDiscover')}><Text style={styles.sectionLink}>Keşfet</Text></TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : channels.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 40 }}>👥</Text>
          <Text style={styles.emptyTitle}>Henüz bir gruba katılmadın</Text>
          <Text style={styles.emptyText}>Sana uygun toplulukları keşfet ve katıl.</Text>
          <TouchableOpacity style={styles.emptyCta} activeOpacity={0.85} onPress={() => navigation.navigate('GroupDiscover')}>
            <Ionicons name="compass-outline" size={18} color={colors.white} />
            <Text style={styles.emptyCtaText}>Grupları Keşfet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ marginHorizontal: 12 }}>
          {channels.map((c, i) => (
            <TouchableOpacity key={c.id} activeOpacity={0.7} style={[styles.channel, i < channels.length - 1 && styles.channelBorder]}
              onPress={() => navigation.navigate('GroupFeed', { groupId: c.id, groupName: c.name })}>
              <ChannelIcon uri={resolveUri(c.imageUrl)} emoji={c.emoji} tint={c.tint} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.chName}>{c.name}</Text>
                  <Text style={styles.chTime}>{c.time}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
                  <Text style={styles.chLast} numberOfLines={1}>{c.last}</Text>
                  {c.unread > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{c.unread}</Text></View> : null}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: font.displayBold, fontSize: 22, color: colors.ink, letterSpacing: -0.3 },
  iconBtn: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  iconBtnGreen: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 18, marginBottom: 10 },
  sectionTitle: { fontFamily: font.bodyBold, fontSize: 16, color: colors.ink },
  sectionLink: { fontSize: 13, color: colors.primary, fontFamily: font.bodyBold },
  channel: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12, paddingHorizontal: 8 },
  channelBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  chIcon: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  chName: { fontFamily: font.bodyBold, fontSize: 15, color: colors.ink },
  chTime: { fontSize: 11, color: colors.faint, fontFamily: font.body },
  chLast: { flex: 1, fontSize: 13, color: '#7A887F', fontFamily: font.body, marginRight: 8 },
  badge: { backgroundColor: colors.primary, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: colors.white, fontFamily: font.displayBold, fontSize: 11 },
  empty: { alignItems: 'center', marginTop: 40, paddingHorizontal: 32, gap: 8 },
  emptyTitle: { fontFamily: font.displayBold, fontSize: 17, color: colors.ink, marginTop: 6 },
  emptyText: { fontSize: 14, color: colors.muted, fontFamily: font.body, textAlign: 'center' },
  emptyCta: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 18, paddingHorizontal: 20, paddingVertical: 12, marginTop: 14, ...shadow.cta },
  emptyCtaText: { color: colors.white, fontFamily: font.bodyBold, fontSize: 15 },
  mapBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 18, marginBottom: 16, backgroundColor: colors.primary, borderRadius: 18, padding: 14, ...shadow.cta },
  mapBannerIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  mapBannerTitle: { fontFamily: font.bodyBold, fontSize: 15, color: colors.white },
  mapBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontFamily: font.body, marginTop: 2 },
});

