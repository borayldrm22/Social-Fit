import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  Animated,
  PanResponder,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { useApi } from '../../api/client';

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const MEAL_META = {
  breakfast: { label: 'Kahvaltı', icon: 'sunny-outline', color: '#f59e0b' },
  lunch: { label: 'Öğle Yemeği', icon: 'restaurant-outline', color: '#2d6a4f' },
  dinner: { label: 'Akşam Yemeği', icon: 'moon-outline', color: '#6366f1' },
  snack: { label: 'Atıştırmalık', icon: 'cafe-outline', color: '#ec4899' },
};

const SCREEN_W = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -80;

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function displayDate(dateStr) {
  const today = fmtDate(new Date());
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (dateStr === today) return 'Bugün';
  if (dateStr === fmtDate(y)) return 'Dün';
  const parts = dateStr.split('-');
  return `${parseInt(parts[2], 10)} ${MONTHS_TR[parseInt(parts[1], 10) - 1]}`;
}

function getCalorieColor(consumed, goal) {
  if (!goal) return '#2d6a4f';
  if (consumed > goal) return '#e63946';
  if (goal - consumed <= 100) return '#f59e0b';
  return '#2d6a4f';
}

// ── Circular progress ──────────────────────────────────────────────

function CalorieRing({ consumed, goal }) {
  const size = 160;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const ratio = goal ? Math.min(consumed / goal, 1.15) : 0;
  const dashOffset = circumference * (1 - Math.min(ratio, 1));
  const color = getCalorieColor(consumed, goal);

  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="#e5e7eb" strokeWidth={stroke} fill="none"
        />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={[styles.ringConsumed, { color }]}>{consumed}</Text>
        {goal != null ? (
          <Text style={styles.ringGoal}>/ {goal} kal</Text>
        ) : (
          <Text style={styles.ringGoal}>kal</Text>
        )}
      </View>
    </View>
  );
}

// ── Weekly mini chart ──────────────────────────────────────────────

function WeeklyChart({ data, todayStr }) {
  const chartW = SCREEN_W - 64;
  const barW = (chartW - 6 * 8) / 7;
  const maxH = 60;
  const maxGoal = data.reduce((m, d) => Math.max(m, d.goalCalories || 2000), 2000);

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Haftalık Özet</Text>
      <View style={styles.chartRow}>
        {data.map((day, i) => {
          const ratio = day.goalCalories
            ? Math.min(day.totalCalories / day.goalCalories, 1)
            : Math.min(day.totalCalories / maxGoal, 1);
          const h = Math.max(ratio * maxH, 3);
          const isToday = day.date === todayStr;
          const dayLabel = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'][new Date(day.date + 'T00:00:00').getDay() === 0 ? 6 : new Date(day.date + 'T00:00:00').getDay() - 1];

          return (
            <View key={day.date} style={styles.chartCol}>
              <Svg width={barW} height={maxH}>
                <Rect
                  x={0} y={maxH - h} width={barW} height={h}
                  rx={4} fill={isToday ? '#2d6a4f' : '#d1d5db'}
                />
              </Svg>
              <Text style={[styles.chartDayLabel, isToday && styles.chartDayLabelToday]}>{dayLabel}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Swipeable row ──────────────────────────────────────────────────

function SwipeableEntry({ entry, onDelete }) {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) translateX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < SWIPE_THRESHOLD) {
          Animated.timing(translateX, { toValue: -100, duration: 150, useNativeDriver: true }).start();
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const resetSwipe = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
  };

  return (
    <View style={styles.swipeContainer}>
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => { resetSwipe(); onDelete(entry.id); }}
        activeOpacity={0.8}
      >
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.deleteText}>Sil</Text>
      </TouchableOpacity>
      <Animated.View style={[styles.entryRow, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
        {entry.imageUrl ? (
          <Image source={{ uri: entry.imageUrl }} style={styles.entryThumb} />
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.entryName}>{entry.foodName}</Text>
          <Text style={styles.entryMacro}>
            {entry.protein != null ? `P: ${entry.protein}g` : ''}
            {entry.carbs != null ? `  K: ${entry.carbs}g` : ''}
            {entry.fat != null ? `  Y: ${entry.fat}g` : ''}
          </Text>
        </View>
        <Text style={styles.entryCal}>{entry.calories}<Text style={styles.entryCalUnit}> kal</Text></Text>
      </Animated.View>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────

export default function FoodLogScreen({ navigation }) {
  const api = useApi();
  const [selectedDate, setSelectedDate] = useState(fmtDate(new Date()));
  const [logData, setLogData] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [day, week] = await Promise.all([
        api.get(`/api/foodlog?date=${selectedDate}`),
        api.get('/api/foodlog/weekly-summary'),
      ]);
      setLogData(day);
      setWeeklyData(week);
    } catch (e) {
      Alert.alert('Hata', e.message || 'Veriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  const changeDate = (offset) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    if (d > new Date()) return;
    setSelectedDate(fmtDate(d));
  };

  const handleDelete = (id) => {
    Alert.alert('Sil', 'Bu kaydı silmek istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/foodlog/${id}`);
            fetchAll();
          } catch (e) {
            Alert.alert('Hata', e.message);
          }
        },
      },
    ]);
  };

  const meals = logData?.meals ?? { breakfast: [], lunch: [], dinner: [], snack: [] };
  const totalCalories = logData?.totalCalories ?? 0;
  const goalCalories = logData?.goalCalories ?? null;

  const totalProtein = Object.values(meals).flat().reduce((s, e) => s + (e.protein ?? 0), 0);
  const totalCarbs = Object.values(meals).flat().reduce((s, e) => s + (e.carbs ?? 0), 0);
  const totalFat = Object.values(meals).flat().reduce((s, e) => s + (e.fat ?? 0), 0);

  const isToday = selectedDate === fmtDate(new Date());

  return (
    <View style={styles.container}>
      {/* ── Date selector ── */}
      <View style={styles.dateRow}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateArrow}>
          <Ionicons name="chevron-back" size={24} color="#2d6a4f" />
        </TouchableOpacity>
        <View style={styles.dateLabelWrap}>
          <Ionicons name="calendar-outline" size={16} color="#6b7280" style={{ marginRight: 6 }} />
          <Text style={styles.dateText}>{displayDate(selectedDate)}</Text>
        </View>
        <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateArrow}>
          <Ionicons name="chevron-forward" size={24} color={isToday ? '#d1d5db' : '#2d6a4f'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAll} tintColor="#2d6a4f" />}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Calorie ring ── */}
        <View style={styles.summaryCard}>
          <CalorieRing consumed={totalCalories} goal={goalCalories} />
          <View style={styles.macroRow}>
            <View style={styles.macroCol}>
              <Text style={styles.macroValue}>{Math.round(totalProtein)}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={[styles.macroDivider]} />
            <View style={styles.macroCol}>
              <Text style={styles.macroValue}>{Math.round(totalCarbs)}g</Text>
              <Text style={styles.macroLabel}>Karb</Text>
            </View>
            <View style={[styles.macroDivider]} />
            <View style={styles.macroCol}>
              <Text style={styles.macroValue}>{Math.round(totalFat)}g</Text>
              <Text style={styles.macroLabel}>Yağ</Text>
            </View>
          </View>
        </View>

        {/* ── Weekly chart ── */}
        {weeklyData.length > 0 && (
          <WeeklyChart data={weeklyData} todayStr={selectedDate} />
        )}

        {/* ── Share button ── */}
        {totalCalories > 0 && (
          <TouchableOpacity
            style={styles.shareBtn}
            activeOpacity={0.8}
            onPress={() => {
              const bCal = (meals.breakfast || []).reduce((s, e) => s + e.calories, 0);
              const lCal = (meals.lunch || []).reduce((s, e) => s + e.calories, 0);
              const dCal = (meals.dinner || []).reduce((s, e) => s + e.calories, 0);
              const caption =
                `Bugün toplam ${totalCalories} kalori aldım 🥗\n` +
                `Kahvaltı: ${bCal} kal | Öğle: ${lCal} kal | Akşam: ${dCal} kal\n` +
                (goalCalories ? `Hedefim: ${goalCalories} kal ` : '') +
                '#SosyalFit #SağlıklıBeslenme';
              navigation.getParent()?.navigate('Create', {
                screen: 'CreatePost',
                params: { fromFoodLog: true, prefillType: 'meal', prefillCaption: caption },
              });
            }}
          >
            <Ionicons name="share-social-outline" size={18} color="#2d6a4f" />
            <Text style={styles.shareBtnText}>Günlüğü Paylaş</Text>
          </TouchableOpacity>
        )}

        {/* ── Meal sections ── */}
        {Object.entries(MEAL_META).map(([key, meta]) => {
          const items = meals[key] || [];
          const sectionCal = items.reduce((s, e) => s + e.calories, 0);

          return (
            <View key={key} style={styles.mealSection}>
              <View style={styles.mealHeader}>
                <View style={[styles.mealIconCircle, { backgroundColor: meta.color + '18' }]}>
                  <Ionicons name={meta.icon} size={20} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealTitle}>{meta.label}</Text>
                  <Text style={styles.mealCal}>{sectionCal} kal</Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('AddFood', { date: selectedDate, mealType: key })}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="add-circle" size={28} color="#2d6a4f" />
                </TouchableOpacity>
              </View>

              {items.map((entry) => (
                <SwipeableEntry key={entry.id} entry={entry} onDelete={handleDelete} />
              ))}

              {items.length === 0 && (
                <TouchableOpacity
                  style={styles.emptyMeal}
                  onPress={() => navigation.navigate('AddFood', { date: selectedDate, mealType: key })}
                >
                  <Ionicons name="add" size={16} color="#9ca3af" />
                  <Text style={styles.emptyMealText}>Yemek ekle</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AddFood', { date: selectedDate, mealType: 'lunch' })}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },

  // Date row
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  dateArrow: { padding: 8 },
  dateLabelWrap: { flexDirection: 'row', alignItems: 'center' },
  dateText: { fontSize: 17, fontWeight: '600', color: '#111827' },

  // Calorie ring
  summaryCard: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 12, paddingVertical: 16, paddingHorizontal: 20, borderRadius: 16 },
  ringCenter: { position: 'absolute', top: 8, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  ringConsumed: { fontSize: 32, fontWeight: '700' },
  ringGoal: { fontSize: 13, color: '#6b7280', marginTop: 2 },

  // Macros
  macroRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  macroCol: { alignItems: 'center', paddingHorizontal: 20 },
  macroValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  macroLabel: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  macroDivider: { width: 1, height: 28, backgroundColor: '#e5e7eb' },

  // Weekly chart
  chartCard: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 12, padding: 16, borderRadius: 16 },
  chartTitle: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  chartCol: { alignItems: 'center' },
  chartDayLabel: { fontSize: 11, color: '#9ca3af', marginTop: 6 },
  chartDayLabelToday: { color: '#2d6a4f', fontWeight: '700' },

  // Share button
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 12, marginTop: 12, paddingVertical: 12, borderRadius: 12, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  shareBtnText: { fontSize: 14, fontWeight: '600', color: '#2d6a4f', marginLeft: 8 },

  // Meal sections
  mealSection: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 12, borderRadius: 16, overflow: 'hidden' },
  mealHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  mealIconCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  mealTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  mealCal: { fontSize: 12, color: '#6b7280', marginTop: 1 },

  // Swipeable entry
  swipeContainer: { overflow: 'hidden' },
  deleteAction: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 100, backgroundColor: '#e63946', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 4 },
  deleteText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  entryRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  entryThumb: { width: 36, height: 36, borderRadius: 8, marginRight: 10, backgroundColor: '#f3f4f6' },
  entryName: { fontSize: 14, color: '#374151', fontWeight: '500' },
  entryMacro: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  entryCal: { fontSize: 15, fontWeight: '700', color: '#111827', marginLeft: 8 },
  entryCalUnit: { fontSize: 11, fontWeight: '400', color: '#9ca3af' },

  // Empty meal
  emptyMeal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  emptyMealText: { color: '#9ca3af', fontSize: 13, marginLeft: 6 },

  // FAB
  fab: {
    position: 'absolute', right: 20, bottom: 28,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#2d6a4f',
    justifyContent: 'center', alignItems: 'center',
    elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.28, shadowRadius: 6,
  },
});
