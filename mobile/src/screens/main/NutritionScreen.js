// NutritionScreen.js — SocialFit · Beslenme / günlük yemek takibi (gerçek FoodLog verisi)
// Konum: src/screens/main/NutritionScreen.js
// Backend: GET /api/foodlog?date=YYYY-MM-DD -> { totalCalories, goalCalories, remaining, meals }
import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../../api/client';
import { colors, font, shadow } from '../../theme/socialFitTheme';
import { ProgressBar } from '../../components/sf/ui';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MEAL_META = [
  { key: 'breakfast', label: 'Kahvaltı', icon: 'sunny-outline' },
  { key: 'lunch', label: 'Öğle', icon: 'restaurant-outline' },
  { key: 'dinner', label: 'Akşam', icon: 'moon-outline' },
  { key: 'snack', label: 'Atıştırma', icon: 'cafe-outline' },
];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function todayLabel() {
  const d = new Date();
  return `Bugün · ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const EMPTY = { totalCalories: 0, goalCalories: null, remaining: null, meals: { breakfast: [], lunch: [], dinner: [], snack: [] } };

function extractServingFromNote(note) {
  if (!note) return null;
  const text = String(note);
  const markerMatch = text.match(/\[serving:\s*([0-9]+(?:[.,][0-9]+)?)\s*\]/i);
  if (markerMatch) {
    const parsedMarker = Number(markerMatch[1].replace(',', '.'));
    if (Number.isFinite(parsedMarker)) return parsedMarker;
  }
  const match = text.match(/Adet:\s*([0-9]+(?:[.,][0-9]+)?)x/i);
  if (!match) return null;
  const parsed = Number(match[1].replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function CalorieRing({ eaten, goal }) {
  return (
    <View style={styles.ring}>
      <View style={[styles.ringFill, { borderColor: colors.primary }]} />
      <View style={styles.ringInner}>
        <Text style={styles.ringNum} selectable>{eaten.toLocaleString('tr-TR')}</Text>
        <Text style={styles.ringSub}>/ {goal.toLocaleString('tr-TR')} kcal</Text>
      </View>
    </View>
  );
}

export default function NutritionScreen({ navigation }) {
  const api = useApi();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const d = await api.get(`/api/foodlog?date=${todayStr()}`);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setData(d && d.meals ? d : EMPTY);
      loadedOnce.current = true;
    } catch (e) {
      setData(EMPTY);
      setError('Beslenme verileri su an yuklenemiyor. Lutfen tekrar dene.');
    } finally {
      setLoading(false);
    }
  }, [api]);
  useFocusEffect(useCallback(() => { if (!loadedOnce.current) setLoading(true); load(); }, [load]));

  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const remove = (id) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Sil', 'Bu öğünü silmek istiyor musun?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/api/foodlog/${id}`);
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          load();
        } catch (e) { Alert.alert('Hata', 'Silinemedi.'); }
      } },
    ]);
  };

  const meals = data.meals || EMPTY.meals;
  const allItems = [...meals.breakfast, ...meals.lunch, ...meals.dinner, ...meals.snack];
  const consumed = data.totalCalories || 0;
  const goal = data.goalCalories || 2000;
  const remaining = Math.max(0, goal - consumed);
  const sum = (k) => allItems.reduce((a, it) => a + (it[k] || 0), 0);
  const macros = [
    { label: 'Protein', cur: Math.round(sum('protein')), goal: Math.round((goal * 0.30) / 4), color: colors.primary },
    { label: 'Karbonhidrat', cur: Math.round(sum('carbs')), goal: Math.round((goal * 0.40) / 4), color: colors.amber },
    { label: 'Yağ', cur: Math.round(sum('fat')), goal: Math.round((goal * 0.30) / 9), color: colors.coral },
  ];

  const addTo = (mealType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('AddFood', { mealType, date: todayStr() });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 96, paddingTop: insets.top }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Beslenme</Text>
            <Text style={styles.sub}>{todayLabel()}</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('FoodLog')}>
            <Ionicons name="calendar-outline" size={19} color={colors.text} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 50 }} />
        ) : (
          <>
            {/* Özet kart */}
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
                <CalorieRing eaten={consumed} goal={goal} />
                <View style={{ flex: 1, gap: 10 }}>
                  <View style={[styles.pill, { backgroundColor: colors.mint }]}>
                    <Ionicons name="flame" size={18} color={colors.primary} />
                    <View><Text style={[styles.pillNum, { color: colors.primary }]}>{remaining}</Text><Text style={[styles.pillLbl, { color: colors.primaryDark }]}>kalori kaldı</Text></View>
                  </View>
                  <View style={[styles.pill, { backgroundColor: colors.amberTint }]}>
                    <Ionicons name="restaurant" size={18} color={colors.amberDark} />
                    <View><Text style={[styles.pillNum, { color: colors.amberDark }]}>{allItems.length}</Text><Text style={[styles.pillLbl, { color: colors.amberDark }]}>öğün girişi</Text></View>
                  </View>
                </View>
              </View>
              <View style={{ marginTop: 16, gap: 12 }}>
                {macros.map((m) => (
                  <View key={m.label}>
                    <View style={styles.macroTop}>
                      <Text style={styles.macroLbl}>{m.label}</Text>
                      <Text style={styles.macroVal}>{m.cur} / {m.goal}g</Text>
                    </View>
                    <ProgressBar value={m.goal ? m.cur / m.goal : 0} color={m.color} />
                  </View>
                ))}
              </View>
            </View>

            {/* Günlük öğün defteri */}
            {MEAL_META.map((mt) => {
              const items = meals[mt.key] || [];
              const kcal = items.reduce((a, it) => a + (it.calories || 0), 0);
              return (
                <View key={mt.key} style={styles.mealSection}>
                  <View style={styles.mealHead}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <Ionicons name={mt.icon} size={18} color={colors.primary} />
                      <Text style={styles.mealTitle}>{mt.label}</Text>
                      {kcal > 0 ? <Text style={styles.mealKcalSum}>{kcal} kcal</Text> : null}
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => addTo(mt.key)} hitSlop={8} activeOpacity={0.8}>
                      <Ionicons name="add" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                  {items.length === 0 ? (
                    <Text style={styles.mealEmpty}>Henüz eklenmedi, + ile ilk yemegi ekleyebilirsin.</Text>
                  ) : items.map((it) => {
                    const serving = extractServingFromNote(it.note);
                    return (
                      <View key={it.id} style={styles.foodRow}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.foodName} numberOfLines={1}>{it.foodName}</Text>
                          <Text style={styles.foodMacro}>P {Math.round(it.protein || 0)} · K {Math.round(it.carbs || 0)} · Y {Math.round(it.fat || 0)}</Text>
                          {serving ? <Text style={styles.foodServing}>Adet: {serving}x</Text> : null}
                        </View>
                        <Text style={styles.foodKcal} selectable>{it.calories}</Text>
                        <TouchableOpacity onPress={() => remove(it.id)} hitSlop={8} style={{ marginLeft: 12 }}>
                          <Ionicons name="trash-outline" size={18} color={colors.faint} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              );
            })}

            {/* Tarifler kartı */}
            {error ? (
              <View style={styles.errorCard}>
                <Ionicons name="cloud-offline-outline" size={18} color={colors.coralDark} />
                <Text style={styles.errorText} selectable>{error}</Text>
              </View>
            ) : null}
            {!loading && allItems.length === 0 ? (
              <View style={styles.emptyHintCard}>
                <Ionicons name="nutrition-outline" size={18} color={colors.primary} />
                <Text style={styles.emptyHintText}>Aramadan yemek secip adet ayarlayarak hizlica gunluk kayit olusturabilirsin.</Text>
              </View>
            ) : null}
            <TouchableOpacity style={styles.tarifCard} activeOpacity={0.9} onPress={() => navigation.navigate('Recipes')}>
              <View style={styles.tarifIcon}><Ionicons name="restaurant" size={20} color={colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tarifTitle}>Tarifler</Text>
                <Text style={styles.tarifSub}>Sağlıklı & pratik tarifleri keşfet</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.faint} />
            </TouchableOpacity>

            {/* Sağlık hesaplayıcıları kartı */}
            <TouchableOpacity style={styles.tarifCard} activeOpacity={0.9} onPress={() => navigation.navigate('Tools')}>
              <View style={[styles.tarifIcon, { backgroundColor: colors.amberTint }]}><Ionicons name="calculator" size={20} color={colors.amberDark} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tarifTitle}>Sağlık Hesaplayıcıları</Text>
                <Text style={styles.tarifSub}>BMI, kalori, makro ve su ihtiyacın</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.faint} />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: font.displayBold, fontSize: 22, color: colors.ink, letterSpacing: -0.3 },
  sub: { fontSize: 13, color: colors.faint, fontFamily: font.body, marginTop: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  card: { marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 24, ...shadow.card, padding: 18 },
  ring: { width: 128, height: 128, borderRadius: 64, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint },
  ringFill: { ...StyleSheet.absoluteFillObject, borderRadius: 64, borderWidth: 12, borderColor: colors.primary, borderRightColor: 'transparent', transform: [{ rotate: '45deg' }] },
  ringInner: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  ringNum: { fontFamily: font.displayBold, fontSize: 27, color: colors.ink, fontVariant: ['tabular-nums'] },
  ringSub: { fontSize: 11, color: colors.faint, fontFamily: font.bodyBold, marginTop: 2 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  pillNum: { fontFamily: font.displayBold, fontSize: 18, fontVariant: ['tabular-nums'] },
  pillLbl: { fontSize: 10, fontFamily: font.bodyBold },
  macroTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  macroLbl: { fontFamily: font.bodyBold, fontSize: 12, color: colors.ink },
  macroVal: { fontSize: 12, color: colors.faint, fontFamily: font.bodyBold, fontVariant: ['tabular-nums'] },
  mealSection: { marginHorizontal: 16, marginTop: 14, backgroundColor: colors.surface, borderRadius: 18, ...shadow.soft, paddingHorizontal: 14, paddingVertical: 12 },
  mealHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mealTitle: { fontFamily: font.bodyBold, fontSize: 15, color: colors.ink },
  mealKcalSum: { fontSize: 12, color: colors.faint, fontFamily: font.bodyBold, marginLeft: 4 },
  addBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  mealEmpty: { fontSize: 13, color: colors.faint, fontFamily: font.body, marginTop: 8 },
  foodRow: { flexDirection: 'row', alignItems: 'center', marginTop: 11, paddingTop: 11, borderTopWidth: 1, borderTopColor: colors.divider },
  foodName: { fontFamily: font.bodyBold, fontSize: 14, color: colors.ink },
  foodMacro: { fontSize: 11, color: colors.faint, fontFamily: font.body, marginTop: 2 },
  foodServing: { fontSize: 11, color: colors.primary, fontFamily: font.bodyBold, marginTop: 2 },
  foodKcal: { fontFamily: font.displayBold, fontSize: 15, color: colors.ink, fontVariant: ['tabular-nums'] },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 14, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.coralTint },
  errorText: { flex: 1, fontSize: 12, color: colors.coralDark, fontFamily: font.bodyBold },
  emptyHintCard: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 14, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.mint },
  emptyHintText: { flex: 1, fontSize: 12, color: colors.primaryDark, fontFamily: font.bodyBold },
  tarifCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 14, backgroundColor: colors.surface, borderRadius: 18, ...shadow.soft, padding: 14 },
  tarifIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  tarifTitle: { fontFamily: font.bodyBold, fontSize: 15, color: colors.ink },
  tarifSub: { fontSize: 12, color: colors.faint, fontFamily: font.body, marginTop: 2 },
});
