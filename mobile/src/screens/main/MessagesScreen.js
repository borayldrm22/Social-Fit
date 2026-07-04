// MessagesScreen.js — SocialFit redesign · Sohbet listesi
// Konum önerisi: src/screens/main/MessagesScreen.js
//
// Backend: GET /messages/conversations
//   -> [{ userId, profile:{displayName, avatarUrl}, lastMessage, lastAt,
//          unread, unreadCount, points, starPoints }]
//
// Navigasyon: Chat ekranına { userId, profile } ile geçer.

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../../api/client';
import { API_BASE } from '../../config';
import { colors, radius, font, shadow, avatarColor, getInitials } from '../../theme/socialFitTheme';

function avatarUri(profile) {
  const url = profile?.avatarUrl;
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

function timeAgoShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 1) return 'Dün';
  if (diffDays < 7) return ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][d.getDay()];
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
}

function formatStars(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n ?? 0}`;
}

function Avatar({ profile, size = 54 }) {
  const uri = avatarUri(profile);
  const name = profile?.displayName;
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size * 0.33 }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.33, backgroundColor: avatarColor(name), alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.white, fontFamily: font.displayBold, fontSize: size * 0.33 }}>{getInitials(name)}</Text>
    </View>
  );
}

export default function MessagesScreen({ navigation }) {
  const api = useApi();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    if (!loadedOnce.current) setLoading(true);
    try {
      const data = await api.get('/api/messages/conversations');
      setItems(Array.isArray(data) ? data : []);
      loadedOnce.current = true;
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const renderItem = ({ item }) => {
    const unread = (item.unreadCount ?? 0) > 0;
    const ticks = item.mine; // benim gönderdiğim son mesajsa tik göster
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Chat', { userId: item.userId, profile: item.profile })}
        style={[styles.row, unread && { backgroundColor: colors.mintSoft }]}
      >
        <Avatar profile={item.profile} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.rowTop}>
            <Text style={styles.name} numberOfLines={1}>{item.profile?.displayName}</Text>
            <View style={styles.starPill}>
              <Text style={styles.starText}>⭐{formatStars(item.starPoints)}</Text>
            </View>
            <View style={{ flex: 1 }} />
            <Text style={[styles.time, unread && { color: colors.primary, fontFamily: font.bodyBold }]}>
              {timeAgoShort(item.lastAt)}
            </Text>
          </View>
          <View style={styles.rowBottom}>
            {ticks ? (
              <Ionicons
                name="checkmark-done"
                size={16}
                color={item.read ? colors.primary : colors.faint}
                style={{ marginRight: 5 }}
              />
            ) : null}
            <Text
              style={[styles.preview, unread && { color: colors.ink, fontFamily: font.bodyBold }]}
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
            {unread ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unreadCount}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Başlık */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mesajlar</Text>
        <TouchableOpacity style={styles.composeBtn} activeOpacity={0.8} onPress={() => navigation.navigate('SearchUsers')}>
          <Ionicons name="create-outline" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Arama */}
      <TouchableOpacity style={styles.search} activeOpacity={0.7} onPress={() => navigation.navigate('SearchUsers')}>
        <Ionicons name="search" size={18} color={colors.faint} />
        <Text style={styles.searchText}>Sohbetlerde ara</Text>
      </TouchableOpacity>

      <FlatList
        data={items}
        keyExtractor={(it) => it.userId}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} />
          ) : (
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubbles-outline" size={42} color={colors.faint} />
              <Text style={styles.emptyText}>Henüz mesajın yok</Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontFamily: font.displayBold, fontSize: 24, color: colors.ink, letterSpacing: -0.3 },
  composeBtn: {
    width: 38, height: 38, borderRadius: 13, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', ...shadow.cta,
  },
  search: {
    marginHorizontal: 18, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: 15, paddingHorizontal: 14, paddingVertical: 12,
  },
  searchText: { fontSize: 14, color: colors.faint, fontFamily: font.body },

  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 18, paddingVertical: 12 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  name: { fontFamily: font.bodyBold, fontSize: 15, color: colors.ink, flexShrink: 1 },
  starPill: { backgroundColor: colors.amberTint, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  starText: { fontFamily: font.displayBold, fontSize: 10, color: colors.amberDark },
  time: { fontSize: 11, color: colors.faint, fontFamily: font.body },
  preview: { flex: 1, fontSize: 13, color: colors.muted, fontFamily: font.body },
  badge: {
    backgroundColor: colors.primary, minWidth: 20, height: 20, borderRadius: 10,
    paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontFamily: font.displayBold, fontSize: 11 },
  sep: { height: 1, backgroundColor: colors.divider, marginLeft: 85 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyText: { fontSize: 14, color: colors.muted, fontFamily: font.body, textAlign: 'center' },
});
