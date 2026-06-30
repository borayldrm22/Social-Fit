// GroupDiscoverScreen.js — Grupları keşfet + katıl
// Konum: src/screens/main/GroupDiscoverScreen.js
// Backend: GET /api/groups/discover (katılınmamış gruplar) + POST /api/groups/:id/join
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../../api/client';
import { API_BASE } from '../../config';
import { colors, font, radius, shadow } from '../../theme/socialFitTheme';

const EMOJIS = ['🧓', '🥦', '🏃', '🍬', '👶', '💪', '🧘', '🥗', '🚴', '⚽'];
const TINTS = ['#FCEAD6', colors.mint, '#FDEBE3', '#FBE9C8', '#E7EEF7', '#E4F3EA', '#FFEDE6', '#FEF3DC'];
function pickByName(name = '', arr) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}
function resolveUri(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

export default function GroupDiscoverScreen({ navigation }) {
  const api = useApi();
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    api.get('/api/groups/discover')
      .then((d) => { if (!cancelled) setGroups(Array.isArray(d) ? d : []); })
      .catch(() => { if (!cancelled) setGroups([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [api]);
  useFocusEffect(useCallback(() => load(), [load]));

  const join = async (g) => {
    setJoiningId(g.id);
    try {
      const res = await api.post(`/api/groups/${g.id}/join`);
      if (res.status === 'pending') {
        setGroups((prev) => prev.map((x) => (x.id === g.id ? { ...x, pending: true } : x)));
        Alert.alert('İstek gönderildi', 'Grup admini onayladığında katılacaksın.');
      } else {
        setGroups((prev) => prev.filter((x) => x.id !== g.id));
        Alert.alert('Katıldın 🎉', `"${g.name}" grubuna katıldın.`);
      }
    } catch (e) {
      Alert.alert('Hata', e.message || 'Gruba katılınamadı.');
    } finally {
      setJoiningId(null);
    }
  };

  const renderItem = ({ item }) => {
    const uri = resolveUri(item.imageUrl);
    const memberCount = item._count?.members ?? item.memberCount ?? 0;
    return (
      <View style={styles.row}>
        {uri ? (
          <Image source={{ uri }} style={styles.icon} />
        ) : (
          <View style={[styles.icon, { backgroundColor: pickByName(item.name, TINTS) }]}>
            <Text style={{ fontSize: 24 }}>{pickByName(item.name, EMOJIS)}</Text>
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {item.description?.trim() ? item.description : `${memberCount} üye`}
          </Text>
        </View>
        {item.pending ? (
          <View style={[styles.joinBtn, { backgroundColor: colors.bg }]}>
            <Text style={[styles.joinText, { color: colors.muted }]}>İstendi</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.joinBtn, joiningId === item.id && { opacity: 0.6 }]}
            onPress={() => join(item)}
            disabled={joiningId === item.id}
            activeOpacity={0.85}
          >
            {joiningId === item.id
              ? <ActivityIndicator color={colors.white} size="small" />
              : <Text style={styles.joinText}>{item.isPrivate ? 'İstek Gönder' : 'Katıl'}</Text>}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.headerSide}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>Grupları Keşfet</Text>
        <View style={styles.headerSide} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={40} color={colors.faint} />
              <Text style={styles.emptyText}>Katılabileceğin yeni grup yok</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerSide: { width: 24 },
  title: { fontFamily: font.displayBold, fontSize: 18, color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: colors.surface, borderRadius: 18, ...shadow.soft, padding: 12 },
  icon: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: font.bodyBold, fontSize: 15, color: colors.ink },
  meta: { fontSize: 13, color: colors.faint, fontFamily: font.body, marginTop: 2 },
  joinBtn: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 9, ...shadow.cta },
  joinText: { color: colors.white, fontFamily: font.bodyBold, fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: colors.muted, fontFamily: font.body },
});
