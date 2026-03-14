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
import { useOnboarding } from '../../context/OnboardingContext';
import { useApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE } from '../../config';
const TOTAL_STEPS = 4;
const CURRENT_STEP = 4;

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

export default function OnboardingStep4({ navigation }) {
  const { goal, age, weightKg, heightCm, dailyCalorieGoal, onComplete } = useOnboarding();
  const api = useApi();
  const { refreshUser } = useAuth();
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
    return () => { cancelled = true; };
  }, []);

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
      const body = {
        goal,
        age,
        weightKg,
        heightCm,
        dailyCalorieGoal,
        onboardingCompleted: true,
      };
      if (weightKg != null || heightCm != null) body.kvkkConsent = true;
      await api.patch('/api/users/me/onboarding', body);
      await refreshUser();
      onComplete?.();
    } catch (e) {
      Alert.alert(
        'Kaydedilemedi',
        'Veriler kaydedilemedi, lütfen tekrar deneyin.',
        [{ text: 'Tamam' }],
      );
    } finally {
      setSubmitting(false);
    }
  }, [api, goal, age, weightKg, heightCm, dailyCalorieGoal, refreshUser, onComplete]);

  const handleStart = () => completeOnboarding();
  const handleSkip = () => completeOnboarding();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2d6a4f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(CURRENT_STEP / TOTAL_STEPS) * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            Adım {CURRENT_STEP} / {TOTAL_STEPS}
          </Text>
        </View>
      </View>

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
                <Text style={styles.userName} numberOfLines={1}>{u.displayName || 'Kullanıcı'}</Text>
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
                <View style={[styles.groupImage, styles.groupImagePlaceholder, { backgroundColor: GROUP_PLACEHOLDER_COLORS[idx % GROUP_PLACEHOLDER_COLORS.length] }]}>
                  <Ionicons name="people" size={24} color="#fff" />
                </View>
              )}
              <View style={styles.groupBody}>
                <Text style={styles.groupName} numberOfLines={1}>{g.name}</Text>
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
          onPress={handleStart}
          disabled={!canFinish || submitting}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>
            {submitting ? 'Kaydediliyor...' : 'Başlayalım!'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipLink} onPress={handleSkip} disabled={submitting} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.skipText}>Atla</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressWrap: {},
  progressTrack: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2d6a4f',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
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
    borderColor: '#2d6a4f',
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
    backgroundColor: '#2d6a4f',
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
    backgroundColor: '#2d6a4f',
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
    backgroundColor: '#2d6a4f',
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
    backgroundColor: '#2d6a4f',
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
