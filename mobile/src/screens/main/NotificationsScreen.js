import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator, Alert,
} from 'react-native';
import { useApi } from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE } from '../../config';

const GREEN = '#2D6A4F';
const GREEN_XL = '#D8F3DC';

function resolveUri(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

function formatTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - date) / 60000);
  if (diff < 1) return 'az önce';
  if (diff < 60) return `${diff}dk önce`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}sa önce`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}g önce`;
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function NotifIcon({ type }) {
  if (type === 'like') return <View style={[styles.notifIcon, { backgroundColor: '#FEE2E2' }]}><Text style={{ fontSize: 16 }}>❤️</Text></View>;
  if (type === 'follow_request') return <View style={[styles.notifIcon, { backgroundColor: GREEN_XL }]}><Ionicons name="person-add" size={18} color={GREEN} /></View>;
  if (type === 'follow_accepted') return <View style={[styles.notifIcon, { backgroundColor: GREEN_XL }]}><Ionicons name="checkmark-circle" size={18} color={GREEN} /></View>;
  if (type === 'group_join_request') return <View style={[styles.notifIcon, { backgroundColor: GREEN_XL }]}><Ionicons name="people" size={18} color={GREEN} /></View>;
  if (type === 'group_join_accepted') return <View style={[styles.notifIcon, { backgroundColor: GREEN_XL }]}><Ionicons name="checkmark-done" size={18} color={GREEN} /></View>;
  return <View style={[styles.notifIcon, { backgroundColor: '#F3F4F6' }]}><Ionicons name="notifications" size={18} color="#6B7280" /></View>;
}

function notifMessage(type, name) {
  if (type === 'like') return `${name} gönderini beğendi`;
  if (type === 'follow_request') return `${name} seni takip etmek istiyor`;
  if (type === 'follow_accepted') return `${name} takip isteğini kabul etti`;
  if (type === 'group_join_request') return `${name} grubuna katılmak istiyor`;
  if (type === 'group_join_accepted') return `${name} grup katılma isteğini onayladı`;
  return '';
}

export default function NotificationsScreen({ navigation }) {
  const api = useApi();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const load = useCallback(async () => {
    try {
      const data = await api.get('/api/notifications');
      setNotifications(data.notifications || []);
      // Hepsini okundu yap
      await api.post('/api/notifications/read-all').catch(() => {});
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const accept = async (fromUserId) => {
    setActionLoading((p) => ({ ...p, [fromUserId]: true }));
    try {
      await api.post(`/api/notifications/follow-requests/${fromUserId}/accept`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.fromUserId === fromUserId && n.type === 'follow_request'
            ? { ...n, resolved: true }
            : n
        )
      );
    } catch (e) {
      Alert.alert('Hata', e.message);
    } finally {
      setActionLoading((p) => ({ ...p, [fromUserId]: false }));
    }
  };

  const reject = async (fromUserId) => {
    setActionLoading((p) => ({ ...p, [fromUserId]: true }));
    try {
      await api.post(`/api/notifications/follow-requests/${fromUserId}/reject`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.fromUserId === fromUserId && n.type === 'follow_request'
            ? { ...n, resolved: true }
            : n
        )
      );
    } catch (e) {
      Alert.alert('Hata', e.message);
    } finally {
      setActionLoading((p) => ({ ...p, [fromUserId]: false }));
    }
  };

  // Grup katılma isteği — onayla / reddet (item.postId = groupId)
  const respondGroup = async (item, action) => {
    setActionLoading((p) => ({ ...p, [item.fromUserId]: true }));
    try {
      await api.post(`/api/groups/${item.postId}/requests/${item.fromUserId}/${action}`);
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, resolved: true } : n)));
    } catch (e) {
      Alert.alert('Hata', e.message || 'İşlem başarısız');
    } finally {
      setActionLoading((p) => ({ ...p, [item.fromUserId]: false }));
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={GREEN} size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : { paddingBottom: 32 }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="notifications-off-outline" size={52} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Bildirim yok</Text>
            <Text style={styles.emptyDesc}>Gönderin beğenilince veya takip isteği gelince burada göreceksin.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const name = item.fromDisplayName || 'Biri';
          const avatarUri = resolveUri(item.fromAvatarUrl);
          const isUnread = !item.read;
          const isLoading = !!actionLoading[item.fromUserId];

          return (
            <TouchableOpacity
              style={[styles.item, isUnread && styles.itemUnread]}
              activeOpacity={0.8}
              onPress={() => {
                if (item.fromUserId) {
                  navigation.navigate('UserProfile', { userId: item.fromUserId });
                }
              }}
            >
              {/* Avatar */}
              <View style={styles.avatarWrap}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.notifIconWrap}>
                  <NotifIcon type={item.type} />
                </View>
              </View>

              {/* İçerik */}
              <View style={styles.content}>
                <Text style={styles.message}>
                  <Text style={styles.boldName}>{name}</Text>
                  {' '}{notifMessage(item.type, '').replace(name + ' ', '')}
                </Text>
                <Text style={styles.time}>{formatTime(item.createdAt)}</Text>

                {/* İstek aksiyon butonları (takip / grup katılma) */}
                {(item.type === 'follow_request' || item.type === 'group_join_request') && !item.resolved && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => (item.type === 'group_join_request' ? respondGroup(item, 'approve') : accept(item.fromUserId))}
                      disabled={isLoading}
                    >
                      {isLoading
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={styles.acceptBtnText}>{item.type === 'group_join_request' ? 'Onayla' : 'Kabul Et'}</Text>
                      }
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => (item.type === 'group_join_request' ? respondGroup(item, 'reject') : reject(item.fromUserId))}
                      disabled={isLoading}
                    >
                      <Text style={styles.rejectBtnText}>Reddet</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {(item.type === 'follow_request' || item.type === 'group_join_request') && item.resolved && (
                  <Text style={styles.resolvedText}>İşlem tamamlandı</Text>
                )}
              </View>

              {isUnread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAF8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', padding: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },

  item: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  itemUnread: { backgroundColor: '#F0FDF4' },

  avatarWrap: { position: 'relative', marginRight: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarFallback: { backgroundColor: GREEN_XL, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 20, fontWeight: '700', color: GREEN },
  notifIconWrap: { position: 'absolute', bottom: -4, right: -4 },
  notifIcon: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#fff' },

  content: { flex: 1 },
  message: { fontSize: 14, color: '#374151', lineHeight: 20 },
  boldName: { fontWeight: '700', color: '#111827' },
  time: { fontSize: 12, color: '#9CA3AF', marginTop: 3 },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  acceptBtn: {
    backgroundColor: GREEN, paddingHorizontal: 20, paddingVertical: 7,
    borderRadius: 20, minWidth: 90, alignItems: 'center',
  },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  rejectBtn: {
    backgroundColor: '#F3F4F6', paddingHorizontal: 20, paddingVertical: 7,
    borderRadius: 20, minWidth: 90, alignItems: 'center',
  },
  rejectBtnText: { color: '#374151', fontWeight: '600', fontSize: 13 },
  resolvedText: { fontSize: 12, color: '#9CA3AF', marginTop: 8, fontStyle: 'italic' },

  unreadDot: {
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: GREEN, marginLeft: 8, marginTop: 6,
  },
});
