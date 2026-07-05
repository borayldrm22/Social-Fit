// FollowListScreen.js — Takipçi / Takip edilen listesi
// route.params: { userId, type: 'followers' | 'following' }
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../../api/client';
import { Avatar } from '../../components/sf/ui';
import { colors, font } from '../../theme/socialFitTheme';

export default function FollowListScreen({ route, navigation }) {
  const { userId, type = 'followers' } = route.params || {};
  const api = useApi();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const data = await api.get(`/api/users/${userId}/${type}`);
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [api, userId, type]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.screen}>
      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ paddingVertical: 6, flexGrow: 1 }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 50 }} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={40} color={colors.faint} />
              <Text style={styles.emptyText}>
                {type === 'followers' ? 'Henüz takipçi yok' : 'Henüz kimse takip edilmiyor'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
          >
            <Avatar profile={item.profile} name={item.profile?.displayName} size={46} round />
            <Text style={styles.name} numberOfLines={1}>{item.profile?.displayName || 'Kullanıcı'}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.faint} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 18, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.divider },
  name: { flex: 1, fontFamily: font.bodyBold, fontSize: 15, color: colors.ink },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: colors.muted, fontFamily: font.body },
});
