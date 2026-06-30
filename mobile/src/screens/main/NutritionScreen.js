// NutritionScreen.js — SocialFit · Beslenme / günlük yemek takibi (gerçek FoodLog verisi)
// Konum: src/screens/main/NutritionScreen.js
// Backend: GET /api/foodlog?date=YYYY-MM-DD -> { totalCalories, goalCalories, remaining, meals }
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../../api/client';
import { colors, font, shadow } from '../../theme/socialFitTheme';
import { ProgressBar } from '../../components/sf/ui';

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

function CalorieRing({ eaten, goal }) {
  return (
    <View style={styles.ring}>
      <View style={[styles.ringFill, { borderColor: colors.primary }]} />
      <View style={styles.ringInner}>
        <Text style={styles.ringNum}>{eaten.toLocaleString('tr-TR')}</Text>
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

  const load = useCallback(async () => {
    try {
      const d = await api.get(`/api/foodlog?date=${todayStr()}`);
      setData(d && d.meals ? d : EMPTY);
    } catch (e) {
      setData(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [api]);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const remove = (id) => {
    Alert.alert('Sil', 'Bu öğünü silmek istiyor musun?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        try { await api.delete(`/api/foodlog/${id}`); load(); } catch (e) { Alert.alert('Hata', 'Silinemedi.'); }
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

  const addTo = (mealType) => navigation.navigate('AddFood', { mealType, date: todayStr() });

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
            <Ionicons name="calendar-outline" size={19} color="#3C4A42" />
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
                    <View><Text style={[styles.pillNum, { color: colors.primary }]}>{remaining}</Text><Text style={[styles.pillLbl, { color: '#3E7A5E' }]}>kalori kaldı</Text></View>
                  </View>
                  <View style={[styles.pill, { backgroundColor: colors.amberTint }]}>
                    <Ionicons name="restaurant" size={18} color={colors.amberDark} />
                    <View><Text style={[styles.pillNum, { color: colors.amberDark }]}>{allItems.length}</Text><Text style={[styles.pillLbl, { color: '#A8801E' }]}>öğün girişi</Text></View>
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
                    <Text style={styles.mealEmpty}>Henüz eklenmedi</Text>
                  ) : items.map((it) => (
                    <View key={it.id} style={styles.foodRow}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.foodName} numberOfLines={1}>{it.foodName}</Text>
                        <Text style={styles.foodMacro}>P {Math.round(it.protein || 0)} · K {Math.round(it.carbs || 0)} · Y {Math.round(it.fat || 0)}</Text>
                      </View>
                      <Text style={styles.foodKcal}>{it.calories}</Text>
                      <TouchableOpacity onPress={() => remove(it.id)} hitSlop={8} style={{ marginLeft: 12 }}>
                        <Ionicons name="trash-outline" size={18} color={colors.faint} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              );
            })}

            {/* Tarifler kartı */}
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

      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => navigation.navigate('AddFood', { date: todayStr() })}>
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
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
  ring: { width: 128, height: 128, borderRadius: 64, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E7F0E9' },
  ringFill: { ...StyleSheet.absoluteFillObject, borderRadius: 64, borderWidth: 12, borderColor: colors.primary, borderRightColor: 'transparent', transform: [{ rotate: '45deg' }] },
  ringInner: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  ringNum: { fontFamily: font.displayBold, fontSize: 27, color: colors.ink },
  ringSub: { fontSize: 11, color: colors.faint, fontFamily: font.bodyBold, marginTop: 2 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  pillNum: { fontFamily: font.displayBold, fontSize: 18 },
  pillLbl: { fontSize: 10, fontFamily: font.bodyBold },
  macroTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  macroLbl: { fontFamily: font.bodyBold, fontSize: 12, color: colors.ink },
  macroVal: { fontSize: 12, color: colors.faint, fontFamily: font.bodyBold },
  mealSection: { marginHorizontal: 16, marginTop: 14, backgroundColor: colors.surface, borderRadius: 18, ...shadow.soft, paddingHorizontal: 14, paddingVertical: 12 },
  mealHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mealTitle: { fontFamily: font.bodyBold, fontSize: 15, color: colors.ink },
  mealKcalSum: { fontSize: 12, color: colors.faint, fontFamily: font.bodyBold, marginLeft: 4 },
  addBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  mealEmpty: { fontSize: 13, color: colors.faint, fontFamily: font.body, marginTop: 8 },
  foodRow: { flexDirection: 'row', alignItems: 'center', marginTop: 11, paddingTop: 11, borderTopWidth: 1, borderTopColor: colors.divider },
  foodName: { fontFamily: font.bodyBold, fontSize: 14, color: colors.ink },
  foodMacro: { fontSize: 11, color: colors.faint, fontFamily: font.body, marginTop: 2 },
  foodKcal: { fontFamily: font.displayBold, fontSize: 15, color: colors.ink },
  tarifCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 14, backgroundColor: colors.surface, borderRadius: 18, ...shadow.soft, padding: 14 },
  tarifIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  tarifTitle: { fontFamily: font.bodyBold, fontSize: 15, color: colors.ink },
  tarifSub: { fontSize: 12, color: colors.faint, fontFamily: font.body, marginTop: 2 },
  fab: { position: 'absolute', right: 18, bottom: 18, width: 56, height: 56, borderRadius: 19, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center', ...shadow.cta, shadowColor: colors.coral },
});
