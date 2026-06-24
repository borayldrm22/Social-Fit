import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { useApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE } from '../../config';
import OnboardingProgress from '../../components/onboarding/ProgressBar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { persistOnboardingComplete } from '../../onboarding/submitOnboarding';
import { useOnboardingExit } from '../../context/OnboardingExitContext';

const GROUP_PLACEHOLDER_COLORS = ['#2d6a4f', '#1e40af', '#7c3aed'];

function getInitials(displayName) {
  if (!displayName || !displayName.trim()) return '?';
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return displayName.trim().slice(0, 2).toUpperCase();
}

function groupImageUri(group) {
  const url = group?.imageUrl;
  if (!url) return null;
  if (url.includes('/uploads/')) {
    const path = url.replace(/^https?:\/\/[^/]+/, '');
    return `${API_BASE}${path}`;
  }
  return url;
}

export default function OnboardingSocialStep({ navigation }) {
  const api = useApi();
  const { refreshUser } = useAuth();
  const { dismissParentOnComplete } = useOnboardingExit();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [followedIds, setFollowedIds] = useState(new Set());
  const [joinedIds, setJoinedIds] = useState(new Set());

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [userRes, groupRes] = await Promise.all([
          api.get('/api/users/suggestions'),
          api.get('/api/groups/suggestions'),
        ]);
        if (cancelled) return;
        setUsers(Array.isArray(userRes) ? userRes : []);
        setGroups(Array.isArray(groupRes) ? groupRes : []);
      } catch (e) {
        if (cancelled) return;
        setUsers([]);
        setGroups([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const followUser = async (userId) => {
    if (followedIds.has(userId)) return;
    try {
      await api.post('/api/users/friends', { friendId: userId });
      setFollowedIds((prev) => new Set([...prev, userId]));
    } catch (e) {}
  };

  const joinGroup = async (groupId) => {
    if (joinedIds.has(groupId)) return;
    try {
      await api.post(`/api/groups/${groupId}/join`);
      setJoinedIds((prev) => new Set([...prev, groupId]));
    } catch (e) {}
  };

  const canFinish = followedIds.size >= 1 || joinedIds.size >= 1;

  const completeOnboarding = useCallback(async () => {
    setSubmitting(true);
    try {
      await persistOnboardingComplete(api);
      await refreshUser();
      if (dismissParentOnComplete) {
        try {
          const parent = navigation.getParent();
          if (parent?.canGoBack?.()) {
            parent.goBack();
          }
        } catch (_navErr) {
          /* ignore */
        }
      }
    } catch (e) {
      Alert.alert('Kaydedilemedi', 'Veriler kaydedilemedi, lütfen tekrar deneyin.', [{ text: 'Tamam' }]);
    } finally {
      setSubmitting(false);
    }
  }, [api, refreshUser, navigation, dismissParentOnComplete]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <OnboardingProgress step={13} total={13} onBack={() => navigation.goBack()} canGoBack />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Topluluğa katıl</Text>
        <Text style={styles.subtitle}>En az 1 kişiyi takip et veya bir gruba katıl</Text>

        <Text style={styles.sectionTitle}>Önerilen Kişiler</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          style={styles.horizontalScroll}
        >
          {users.map((u) => {
            const followed = followedIds.has(u.id);
            return (
              <TouchableOpacity
                key={u.id}
                style={[styles.userCard, followed && styles.userCardFollowed]}
                onPress={() => followUser(u.id)}
                activeOpacity={0.8}
                disabled={followed}
              >
                {u.avatarUrl ? (
                  <Image source={{ uri: u.avatarUrl }} style={styles.userAvatar} />
                ) : (
                  <View style={styles.userAvatarPlaceholder}>
                    <Text style={styles.userInitials}>{getInitials(u.displayName)}</Text>
                  </View>
                )}
                <Text style={styles.userName} numberOfLines={1}>
                  {u.displayName || 'Kullanıcı'}
                </Text>
                <View style={styles.starBadge}>
                  <Ionicons name="star" size={10} color="#f59e0b" />
                  <Text style={styles.starPoints}>{u.starPoints ?? 0}</Text>
                </View>
                {followed && (
                  <View style={styles.followedChip}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                    <Text style={styles.followedChipText}>Takip</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>Önerilen Gruplar</Text>
        {groups.slice(0, 3).map((g, idx) => {
          const joined = joinedIds.has(g.id);
          return (
            <View key={g.id} style={styles.groupCard}>
              {groupImageUri(g) ? (
                <Image source={{ uri: groupImageUri(g) }} style={styles.groupImage} />
              ) : (
                <View
                  style={[
                    styles.groupImage,
                    styles.groupImagePlaceholder,
                    { backgroundColor: GROUP_PLACEHOLDER_COLORS[idx % GROUP_PLACEHOLDER_COLORS.length] },
                  ]}
                >
                  <Ionicons name="people" size={24} color="#fff" />
                </View>
              )}
              <View style={styles.groupBody}>
                <Text style={styles.groupName} numberOfLines={1}>
                  {g.name}
                </Text>
                <Text style={styles.groupMeta}>{g.memberCount ?? 0} üye</Text>
              </View>
              <TouchableOpacity
                style={[styles.joinButton, joined && styles.joinButtonDone]}
                onPress={() => joinGroup(g.id)}
                disabled={joined}
                activeOpacity={0.8}
              >
                <Text style={[styles.joinButtonText, joined && styles.joinButtonTextDone]}>
                  {joined ? 'Katıldın' : 'Katıl'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.primaryButton, (!canFinish || submitting) && styles.primaryButtonDisabled]}
          onPress={completeOnboarding}
          disabled={!canFinish || submitting}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>{submitting ? 'Kaydediliyor...' : 'Başlayalım!'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipLink}
          onPress={completeOnboarding}
          disabled={submitting}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.skipText}>Atla</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 48 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: '#6b7280',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  horizontalScroll: { marginHorizontal: -24 },
  horizontalList: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  userCard: {
    width: 120,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    marginRight: 12,
  },
  userCardFollowed: {
    borderColor: '#22C55E',
    backgroundColor: '#f0fdf4',
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
  },
  userAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starPoints: {
    fontSize: 12,
    color: '#b45309',
    fontWeight: '600',
    marginLeft: 4,
  },
  followedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#22C55E',
  },
  followedChipText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  groupImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  groupImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupBody: {
    flex: 1,
    marginLeft: 12,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  groupMeta: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#22C55E',
  },
  joinButtonDone: {
    backgroundColor: '#d1fae5',
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  joinButtonTextDone: {
    color: '#166534',
  },
  primaryButton: {
    backgroundColor: '#22C55E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  skipLink: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
});
