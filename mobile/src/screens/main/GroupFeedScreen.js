import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, Alert, RefreshControl, ScrollView,
} from 'react-native';
import { useApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DisplayNameWithStars from '../../components/DisplayNameWithStars';
import { API_BASE } from '../../config';

const GREEN = '#2D6A4F';
const GREEN_XL = '#D8F3DC';
const ORANGE = '#F4845F';

function resolveUri(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

function getInitial(name) {
  return (name || '?').charAt(0).toUpperCase();
}

function MemberRow({ member, isAdmin, isSelf, onKick }) {
  return (
    <View style={styles.memberRow}>
      {member.avatarUrl ? (
        <Image source={{ uri: resolveUri(member.avatarUrl) }} style={styles.memberAvatar} />
      ) : (
        <View style={[styles.memberAvatar, styles.memberAvatarFallback]}>
          <Text style={styles.memberAvatarInitial}>{getInitial(member.displayName)}</Text>
        </View>
      )}
      <View style={styles.memberInfo}>
        <Text style={styles.memberName} numberOfLines={1}>{member.displayName}</Text>
        {member.role === 'admin' && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>👑 Admin</Text>
          </View>
        )}
      </View>
      {isAdmin && !isSelf && member.role !== 'admin' && (
        <TouchableOpacity onPress={() => onKick(member)} style={styles.kickBtn}>
          <Ionicons name="person-remove-outline" size={18} color={ORANGE} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function GroupFeedScreen({ route, navigation }) {
  const { groupId, groupName } = route.params || {};
  const api = useApi();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState('posts'); // 'posts' | 'members'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingReqs, setPendingReqs] = useState([]);

  const load = useCallback(async () => {
    if (!groupId) return;
    try {
      const [groupData, postsData] = await Promise.all([
        api.get(`/api/groups/${groupId}`),
        api.get(`/api/groups/${groupId}/posts`),
      ]);
      setGroup(groupData);
      setPosts(Array.isArray(postsData) ? postsData : []);
      if (groupData?.myRole === 'admin') {
        const reqs = await api.get(`/api/groups/${groupId}/requests`).catch(() => []);
        setPendingReqs(Array.isArray(reqs) ? reqs : []);
      } else {
        setPendingReqs([]);
      }
    } catch (e) {
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId, api]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const isAdmin = group?.myRole === 'admin';

  const kickMember = (member) => {
    Alert.alert(
      'Üyeyi Çıkar',
      `${member.displayName} kişisini gruptan çıkarmak istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkar', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/groups/${groupId}/members/${member.userId}`);
              setGroup((prev) => ({
                ...prev,
                memberCount: (prev.memberCount || 1) - 1,
                members: prev.members.filter((m) => m.userId !== member.userId),
              }));
            } catch (e) {
              Alert.alert('Hata', e.message || 'Üye çıkarılamadı.');
            }
          },
        },
      ]
    );
  };

  const respondReq = async (userId, action) => {
    try {
      await api.post(`/api/groups/${groupId}/requests/${userId}/${action}`);
      setPendingReqs((prev) => prev.filter((r) => r.userId !== userId));
      load();
    } catch (e) {
      Alert.alert('Hata', e.message || 'İşlem başarısız.');
    }
  };

  // Header — grup fotoğrafı, ad, üye sayısı, admin butonları
  const renderHeader = () => (
    <View style={styles.groupHeader}>
      {group?.imageUrl ? (
        <Image source={{ uri: resolveUri(group.imageUrl) }} style={styles.groupCover} />
      ) : (
        <View style={[styles.groupCover, styles.groupCoverFallback]}>
          <Text style={styles.groupCoverEmoji}>💪</Text>
        </View>
      )}
      {/* Geri butonu — cover üzerinde */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
        <Ionicons name="chevron-back" size={22} color="#fff" />
      </TouchableOpacity>
      <View style={styles.groupMeta}>
        <Text style={styles.groupName}>{group?.name || groupName}</Text>
        {group?.description ? (
          <Text style={styles.groupDesc} numberOfLines={2}>{group.description}</Text>
        ) : null}
        <View style={styles.groupStats}>
          <Ionicons name="people-outline" size={14} color="#9CA3AF" />
          <Text style={styles.groupStatText}>{group?.memberCount ?? '—'} üye</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={styles.editGroupBtn}
            onPress={() => navigation.navigate('EditGroup', { groupId })}
            activeOpacity={0.85}
          >
            <Ionicons name="pencil-outline" size={14} color={GREEN} />
            <Text style={styles.editGroupBtnText}>Grubu Düzenle</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'posts' && styles.tabBtnActive]}
          onPress={() => setTab('posts')}
        >
          <Text style={[styles.tabBtnText, tab === 'posts' && styles.tabBtnTextActive]}>
            Gönderiler
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'members' && styles.tabBtnActive]}
          onPress={() => setTab('members')}
        >
          <Text style={[styles.tabBtnText, tab === 'members' && styles.tabBtnTextActive]}>
            Üyeler
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Post kartı
  const renderPost = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {item.user?.profile?.avatarUrl ? (
          <Image source={{ uri: resolveUri(item.user.profile.avatarUrl) }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>{getInitial(item.user?.profile?.displayName)}</Text>
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 10 }}>
          <DisplayNameWithStars
            displayName={item.user?.profile?.displayName}
            starPoints={item.user?.starPoints}
            nameStyle={styles.displayName}
          />
        </View>
      </View>
      {item.imageUrl && (
        <Image source={{ uri: resolveUri(item.imageUrl) }} style={styles.postImage} resizeMode="cover" />
      )}
      {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}
      <View style={styles.postActions}>
        <Ionicons name="heart-outline" size={20} color="#9CA3AF" />
        <Text style={styles.postActionText}>{item._count?.likes ?? 0}</Text>
        <Ionicons name="chatbubble-outline" size={18} color="#9CA3AF" style={{ marginLeft: 12 }} />
        <Text style={styles.postActionText}>{item._count?.comments ?? 0}</Text>
      </View>
    </View>
  );

  // Üye listesi içeriği
  const renderMembersContent = () => (
    <View>
      {isAdmin && pendingReqs.length > 0 && (
        <View style={styles.membersList}>
          <Text style={styles.pendingTitle}>Bekleyen İstekler ({pendingReqs.length})</Text>
          {pendingReqs.map((r) => (
            <View key={r.userId} style={styles.memberRow}>
              {r.avatarUrl ? (
                <Image source={{ uri: resolveUri(r.avatarUrl) }} style={styles.memberAvatar} />
              ) : (
                <View style={[styles.memberAvatar, styles.memberAvatarFallback]}>
                  <Text style={styles.memberAvatarInitial}>{getInitial(r.displayName)}</Text>
                </View>
              )}
              <View style={styles.memberInfo}><Text style={styles.memberName} numberOfLines={1}>{r.displayName}</Text></View>
              <TouchableOpacity style={styles.approveBtn} onPress={() => respondReq(r.userId, 'approve')}>
                <Text style={styles.approveBtnText}>Onayla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.kickBtn} onPress={() => respondReq(r.userId, 'reject')}>
                <Ionicons name="close" size={18} color={ORANGE} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <View style={styles.membersList}>
        {(group?.members || []).map((m) => (
          <MemberRow
            key={m.userId}
            member={m}
            isAdmin={isAdmin}
            isSelf={m.userId === user?.id}
            onKick={kickMember}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={tab === 'posts' ? posts : []}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          tab === 'posts' ? (
            loading
              ? <Text style={styles.empty}>Yükleniyor...</Text>
              : <Text style={styles.empty}>Bu grupta henüz paylaşım yok.</Text>
          ) : renderMembersContent()
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAF8' },

  // Grup Header
  groupHeader: { backgroundColor: '#fff', marginBottom: 8 },
  groupCover: { width: '100%', height: 160 },
  groupCoverFallback: {
    backgroundColor: GREEN_XL, justifyContent: 'center', alignItems: 'center',
  },
  groupCoverEmoji: { fontSize: 56 },
  groupMeta: { padding: 16, paddingBottom: 12 },
  groupName: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 },
  groupDesc: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 8 },
  groupStats: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  groupStatText: { fontSize: 13, color: '#9CA3AF' },
  editGroupBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: GREEN_XL,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20,
  },
  editGroupBtnText: { fontSize: 13, fontWeight: '700', color: GREEN },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: GREEN },
  tabBtnText: { fontSize: 14, color: '#9CA3AF', fontWeight: '500' },
  tabBtnTextActive: { color: GREEN, fontWeight: '700' },

  // Post Kart
  card: {
    backgroundColor: '#fff', marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: { backgroundColor: GREEN_XL, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 18, fontWeight: '700', color: GREEN },
  displayName: { fontWeight: '700', fontSize: 14, color: '#111827' },
  postImage: { width: '100%', height: 220 },
  caption: { fontSize: 14, color: '#374151', lineHeight: 21, padding: 12, paddingTop: 8 },
  postActions: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F9FAFB',
  },
  postActionText: { fontSize: 13, color: '#9CA3AF', marginLeft: 4 },

  // Üye Listesi
  membersList: { backgroundColor: '#fff', paddingHorizontal: 16 },
  memberRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  memberAvatar: { width: 44, height: 44, borderRadius: 22 },
  memberAvatarFallback: { backgroundColor: GREEN_XL, justifyContent: 'center', alignItems: 'center' },
  memberAvatarInitial: { fontSize: 18, fontWeight: '700', color: GREEN },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  adminBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8, marginTop: 3,
  },
  adminBadgeText: { fontSize: 11, color: '#D97706', fontWeight: '600' },
  kickBtn: { padding: 8 },
  pendingTitle: { fontSize: 13, fontWeight: '700', color: GREEN, paddingTop: 12, paddingBottom: 4 },
  approveBtn: { backgroundColor: GREEN, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, marginRight: 4 },
  approveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Geri butonu
  backBtn: {
    position: 'absolute', top: 48, left: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Misc
  empty: { textAlign: 'center', padding: 32, color: '#6B7280', fontSize: 15 },
});
