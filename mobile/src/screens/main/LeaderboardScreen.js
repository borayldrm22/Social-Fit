// LeaderboardScreen.js — SocialFit redesign · Liderlik tablosu
// Konum: src/screens/main/LeaderboardScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config';
import { colors, font, shadow, avatarColor, getInitials } from '../../theme/socialFitTheme';
import StarGuideCard from '../../components/sf/StarGuideCard';

const PERIODS = [['week', 'Haftalık'], ['month', 'Aylık'], ['all', 'Tüm Zamanlar']];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

const PODIUM_STYLE = {
  1: { h: 92, podium: ['#FBC14E', colors.amber], ring: colors.amber, crown: true, size: 70 },
  2: { h: 64, podium: ['#D7DEE6', '#C2CBD6'], ring: '#C7D7C9', size: 56 },
  3: { h: 50, podium: ['#E0A06A', '#CD7F32'], ring: '#E8C9A0', size: 56 },
};

function resolveUri(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}
function isReal(userId) {
  return userId && !String(userId).startsWith('example');
}

function Avatar({ name, uri, color, size = 56, ring, radius }) {
  const br = radius != null ? radius : size / 2;
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: br, borderWidth: ring ? 3 : 0, borderColor: ring || 'transparent' }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: br, backgroundColor: color, alignItems: 'center', justifyContent: 'center', borderWidth: ring ? 3 : 0, borderColor: ring || 'transparent' }}>
      <Text style={{ color: colors.white, fontFamily: font.displayBold, fontSize: size * 0.32 }}>{getInitials(name)}</Text>
    </View>
  );
}

export default function LeaderboardScreen({ navigation }) {
  const api = useApi();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState('month');
  const [scope, setScope] = useState('global');
  const [data, setData] = useState({ top: [], rest: [], me: null });
  const [loading, setLoading] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/leaderboard?period=${period}&scope=${scope}`);
      const list = Array.isArray(res?.leaderboard) ? res.leaderboard : [];
      const toRow = (e) => ({ rank: e.rank, userId: e.userId, name: e.displayName || 'Kullanıcı', avatarUrl: e.avatarUrl, pts: e.totalPoints ?? 0, streak: e.currentStreak ?? 0 });
      const byRank = Object.fromEntries(list.map((e) => [e.rank, toRow(e)]));
      const top = [byRank[2], byRank[1], byRank[3]].filter(Boolean);
      const rest = list.filter((e) => e.rank >= 4).map(toRow);
      const me = res.myRank ? { rank: res.myRank, name: user?.profile?.displayName || 'Sen', avatarUrl: user?.profile?.avatarUrl, pts: res.myPoints ?? 0 } : null;
      setData({ top, rest, me });
    } catch (e) {
      setData({ top: [], rest: [], me: null });
    } finally {
      setLoading(false);
    }
  }, [api, period, scope, user]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openUser = (userId) => {
    if (!isReal(userId)) return;
    navigation.getParent()?.navigate('Feed', { screen: 'UserProfile', params: { userId } });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 28, paddingTop: insets.top }}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <Text style={styles.title}>Liderlik</Text>
        </View>
        <View style={styles.monthPill}><Text style={styles.monthText}>{MONTHS[new Date().getMonth()]}</Text></View>
      </View>

      <View style={styles.scopeRow}>
        {[['global', 'Genel', 'earth'], ['friends', 'Arkadaşlar', 'people']].map(([k, label, icon]) => (
          <TouchableOpacity key={k} style={[styles.scopePill, scope === k && styles.scopePillActive]} onPress={() => setScope(k)} activeOpacity={0.85}>
            <Ionicons name={icon} size={15} color={scope === k ? colors.white : colors.muted} />
            <Text style={[styles.scopeText, { color: scope === k ? colors.white : colors.muted }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.segment}>
        {PERIODS.map(([k, label]) => (
          <TouchableOpacity key={k} style={[styles.segItem, period === k && styles.segActive]} onPress={() => setPeriod(k)}>
            <Text style={[styles.segText, { color: period === k ? colors.ink : '#8A988E' }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 50 }} />
      ) : data.top.length === 0 && data.rest.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="trophy-outline" size={40} color={colors.faint} />
          <Text style={styles.emptyText}>{scope === 'friends' ? 'Arkadaşların henüz sıralamada değil' : 'Henüz sıralama verisi yok'}</Text>
        </View>
      ) : (
        <>
          {/* Podyum */}
          <View style={styles.podium}>
            {data.top.map((t) => {
              const ps = PODIUM_STYLE[t.rank] || PODIUM_STYLE[3];
              return (
                <TouchableOpacity key={t.rank} style={{ flex: 1, alignItems: 'center' }} activeOpacity={isReal(t.userId) ? 0.7 : 1} onPress={() => openUser(t.userId)}>
                  {ps.crown ? <Ionicons name="trophy" size={26} color={colors.amber} style={{ marginBottom: 2 }} /> : null}
                  <Avatar name={t.name} uri={resolveUri(t.avatarUrl)} color={avatarColor(t.name)} size={ps.size} ring={ps.ring} />
                  <Text style={[styles.pName, ps.crown && { fontSize: 14 }]} numberOfLines={1}>{t.name}</Text>
                  <Text style={[styles.pPts, ps.crown && { color: colors.amberDark, fontSize: 17 }]}>{t.pts.toLocaleString('tr-TR')}</Text>
                  <LinearGradient colors={ps.podium} style={[styles.bar, { height: ps.h }]}>
                    <Text style={styles.barNum}>{t.rank}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Ödül */}
          <View style={styles.prize}>
            <Ionicons name="gift-outline" size={22} color={colors.amberDark} />
            <Text style={styles.prizeText}>Ay sonunda <Text style={{ fontFamily: font.bodyBold, color: colors.ink }}>ilk 3'e promosyon ödülleri</Text> — sıralamada yüksel!</Text>
          </View>

          {/* Puan kuralları */}
          <TouchableOpacity style={styles.rulesNote} activeOpacity={0.7} onPress={() => setGuideOpen(true)}>
            <Text style={styles.rulesText}>Günlük paylaşım <Text style={styles.rulesStrong}>+20</Text>  ·  7 gün seri <Text style={styles.rulesStrong}>+50</Text></Text>
            <View style={styles.rulesCta}>
              <Text style={styles.rulesCtaText}>Yıldız nasıl kazanılır?</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </View>
          </TouchableOpacity>

          {/* Liste */}
          <View style={{ marginHorizontal: 12, marginTop: 14, gap: 8 }}>
            {data.rest.map((r) => (
              <TouchableOpacity key={r.rank} style={styles.row} activeOpacity={isReal(r.userId) ? 0.7 : 1} onPress={() => openUser(r.userId)}>
                <Text style={styles.rank}>{r.rank}</Text>
                <Avatar name={r.name} uri={resolveUri(r.avatarUrl)} color={avatarColor(r.name)} size={40} radius={14} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName} numberOfLines={1}>{r.name}</Text>
                  {r.streak > 0 ? (
                    <View style={styles.rowStreakWrap}>
                      <Ionicons name="flame" size={12} color={colors.coral} />
                      <Text style={styles.rowStreak}>{r.streak} gün</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.rowPts}>{r.pts.toLocaleString('tr-TR')}</Text>
              </TouchableOpacity>
            ))}
            {data.me ? (
              <View style={[styles.row, styles.meRow]}>
                <Text style={[styles.rank, { color: '#A9E0C2' }]}>{data.me.rank}</Text>
                <Avatar name={data.me.name} uri={resolveUri(data.me.avatarUrl)} color={avatarColor(data.me.name)} size={40} radius={14} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowName, { color: colors.white }]} numberOfLines={1}>{data.me.name} <Text style={{ color: '#A9E0C2' }}>(Sen)</Text></Text>
                </View>
                <Text style={[styles.rowPts, { color: colors.white }]}>{data.me.pts.toLocaleString('tr-TR')}</Text>
              </View>
            ) : null}
          </View>
        </>
      )}

      <Modal visible={guideOpen} transparent animationType="fade" onRequestClose={() => setGuideOpen(false)}>
        <Pressable style={styles.modalScrim} onPress={() => setGuideOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <StarGuideCard />
            <TouchableOpacity style={styles.modalClose} onPress={() => setGuideOpen(false)} activeOpacity={0.8}>
              <Text style={styles.modalCloseText}>Anladım</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: font.displayBold, fontSize: 22, color: colors.ink, letterSpacing: -0.3 },
  monthPill: { backgroundColor: colors.mint, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 13 },
  monthText: { fontSize: 13, color: colors.primary, fontFamily: font.bodyBold },
  segment: { marginHorizontal: 16, backgroundColor: '#E9EFE9', borderRadius: 14, padding: 4, flexDirection: 'row' },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 11 },
  segActive: { backgroundColor: colors.surface, ...shadow.soft },
  segText: { fontFamily: font.bodyBold, fontSize: 13 },
  scopeRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginTop: 12, marginBottom: 4 },
  scopePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#E9EFE9' },
  scopePillActive: { backgroundColor: colors.primary },
  scopeText: { fontFamily: font.bodyBold, fontSize: 13 },
  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginHorizontal: 16, marginTop: 18 },
  pName: { fontFamily: font.bodyBold, fontSize: 13, color: colors.ink, marginTop: 7 },
  pPts: { fontFamily: font.displayBold, fontSize: 15, color: colors.muted },
  bar: { width: '100%', borderTopLeftRadius: 14, borderTopRightRadius: 14, marginTop: 8, alignItems: 'center', paddingTop: 10 },
  barNum: { fontFamily: font.displayBold, fontSize: 24, color: colors.white },
  prize: { flexDirection: 'row', alignItems: 'center', gap: 11, marginHorizontal: 16, marginTop: 14, backgroundColor: colors.amberTint, borderWidth: 1, borderColor: '#FBE6BC', borderRadius: 16, padding: 12 },
  prizeText: { flex: 1, fontSize: 12, color: '#9A7420', fontFamily: font.body, lineHeight: 18 },
  rulesNote: { marginHorizontal: 16, marginTop: 8, backgroundColor: colors.mintSoft, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rulesText: { fontSize: 11, color: colors.muted, fontFamily: font.body, flexShrink: 1 },
  rulesStrong: { fontFamily: font.bodyBold, color: colors.primary },
  rulesCta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  rulesCtaText: { fontSize: 11.5, color: colors.primary, fontFamily: font.bodyBold },
  modalScrim: { flex: 1, backgroundColor: 'rgba(17,35,27,0.5)', justifyContent: 'center', paddingHorizontal: 22 },
  modalCard: { },
  modalClose: { marginTop: 14, backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 13, alignItems: 'center', ...shadow.cta },
  modalCloseText: { fontFamily: font.bodyBold, fontSize: 15, color: colors.white },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, ...shadow.soft, paddingVertical: 10, paddingHorizontal: 10 },
  rank: { fontFamily: font.displayBold, fontSize: 15, color: colors.faint, width: 20, textAlign: 'center' },
  rowName: { fontFamily: font.bodyBold, fontSize: 14, color: colors.ink },
  rowStreakWrap: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  rowStreak: { fontSize: 11, color: colors.coralDark, fontFamily: font.bodyBold },
  rowPts: { fontFamily: font.displayBold, fontSize: 15, color: colors.muted },
  meRow: { backgroundColor: colors.primary, ...shadow.cta },
  empty: { alignItems: 'center', marginTop: 50, gap: 10 },
  emptyText: { fontSize: 14, color: colors.muted, fontFamily: font.body },
});
