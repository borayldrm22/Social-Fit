// RoutinesScreen.js — SocialFit · Rutinlerim (tam yönetim)
// Tüm aktif rutinleri gör, tamamla, sil, yeni ekle.
// Backend: GET /api/routines, PATCH /api/routines/:id/complete, DELETE /api/routines/:id
import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../../api/client';
import { colors, font, shadow } from '../../theme/socialFitTheme';
import { ProgressBar } from '../../components/sf/ui';
import RoutineRow from '../../components/sf/RoutineRow';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function RoutinesScreen({ navigation }) {
  const api = useApi();
  const insets = useSafeAreaInsets();
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await api.get('/api/routines');
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setRoutines(Array.isArray(data) ? data : []);
      loadedOnce.current = true;
    } catch (e) {
      setError('Rutinler şu an yüklenemiyor. Lütfen tekrar dene.');
    } finally {
      setLoading(false);
    }
  }, [api]);
  useFocusEffect(useCallback(() => { if (!loadedOnce.current) setLoading(true); load(); }, [load]));

  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const onChange = useCallback((id, done) => {
    setRoutines((rs) => rs.map((r) => (r.id === id ? { ...r, doneToday: done } : r)));
  }, []);

  const onDelete = useCallback((routine) => {
    Alert.alert('Rutini sil', `"${routine.title}" silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        const prev = routines;
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setRoutines((rs) => rs.filter((r) => r.id !== routine.id)); // optimistic çıkar
        try {
          await api.delete(`/api/routines/${routine.id}`);
        } catch (e) {
          setRoutines(prev); // geri al
          Alert.alert('Hata', 'Rutin silinemedi.');
        }
      } },
    ]);
  }, [api, routines]);

  const doneCount = routines.filter((r) => r.doneToday).length;
  const total = routines.length;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rutinlerim</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddRoutine')} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} />
        ) : (
          <>
            {total > 0 ? (
              <View style={styles.summaryCard}>
                <View style={styles.summaryTop}>
                  <Text style={styles.summaryLabel}>Bugün</Text>
                  <Text style={styles.summaryCount}>{doneCount}/{total} tamamlandı</Text>
                </View>
                <ProgressBar value={total ? doneCount / total : 0} height={9} />
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorCard}>
                <Ionicons name="cloud-offline-outline" size={18} color={colors.coralDark} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {!error && total === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>🌱</Text>
                <Text style={styles.emptyTitle}>Henüz rutinin yok</Text>
                <Text style={styles.emptySub}>Su içmek, kitap okumak, yürümek… küçük günlük hedefler ekle.</Text>
                <TouchableOpacity style={styles.emptyCta} onPress={() => navigation.navigate('AddRoutine')} activeOpacity={0.9}>
                  <Ionicons name="add" size={18} color={colors.white} />
                  <Text style={styles.emptyCtaText}>Rutin Ekle</Text>
                </TouchableOpacity>
              </View>
            ) : total > 0 ? (
              <View style={styles.listCard}>
                {routines.map((r, i) => (
                  <RoutineRow
                    key={r.id}
                    routine={r}
                    onChange={onChange}
                    onDelete={onDelete}
                    style={i < routines.length - 1 ? styles.rowBorder : null}
                  />
                ))}
              </View>
            ) : null}

            {total > 0 ? (
              <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddRoutine')} activeOpacity={0.9}>
                <Ionicons name="add" size={20} color={colors.primary} />
                <Text style={styles.addBtnText}>Rutin Ekle</Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  iconBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: font.displayBold, fontSize: 18, color: colors.ink },
  summaryCard: { marginHorizontal: 16, marginTop: 16, backgroundColor: colors.surface, borderRadius: 20, ...shadow.card, padding: 16 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontFamily: font.bodyBold, fontSize: 13, color: colors.faint },
  summaryCount: { fontFamily: font.displayBold, fontSize: 15, color: colors.primary },
  listCard: { marginHorizontal: 16, marginTop: 14, backgroundColor: colors.surface, borderRadius: 20, ...shadow.soft, paddingHorizontal: 16, paddingVertical: 6 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 14, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.coralTint },
  errorText: { flex: 1, fontSize: 12, color: colors.coralDark, fontFamily: font.bodyBold },
  emptyCard: { marginHorizontal: 16, marginTop: 24, alignItems: 'center', paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontFamily: font.displayBold, fontSize: 18, color: colors.ink, marginBottom: 6 },
  emptySub: { fontSize: 13.5, color: colors.faint, fontFamily: font.body, textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  emptyCta: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, ...shadow.cta },
  emptyCtaText: { fontFamily: font.bodyBold, fontSize: 15, color: colors.white },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginHorizontal: 16, marginTop: 16, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed' },
  addBtnText: { fontFamily: font.bodyBold, fontSize: 15, color: colors.primary },
});
