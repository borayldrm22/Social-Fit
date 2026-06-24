import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../api/client';
import { useFocusEffect } from '@react-navigation/native';

const GREEN      = '#2D6A4F';
const GREEN_DARK = '#1B4332';
const GREEN_XL   = '#D8F3DC';
const ORANGE     = '#F4845F';
const ORANGE_L   = '#FDDDD5';

const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
const MONTHS_TR = [
  'Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
  'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık',
];

// Returns emoji(s) representing the posts on that day
function dayEmoji(posts) {
  if (!posts || posts.length === 0) return null;
  const hasPhoto   = posts.some((p) => p.hasImage);
  const hasText    = posts.some((p) => p.type === 'text' && !p.hasImage);
  const hasWorkout = posts.some((p) => p.type === 'workout');
  const hasMeal    = posts.some((p) => p.type === 'meal' && !p.hasImage);

  const emojis = [];
  if (hasPhoto)   emojis.push('📷');
  if (hasText)    emojis.push('✍️');
  if (hasWorkout) emojis.push('💪');
  if (hasMeal)    emojis.push('🥗');
  return emojis.slice(0, 2).join('');
}

export default function ActivityCalendar() {
  const api = useApi();
  const now  = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [days,  setDays]  = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (y, m) => {
    setLoading(true);
    try {
      const pad = String(m).padStart(2, '0');
      const res = await api.get(`/api/users/me/calendar?month=${y}-${pad}`);
      setDays(res.days || {});
    } catch {
      setDays({});
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(useCallback(() => { load(year, month); }, [year, month]));

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    const today = new Date();
    if (year > today.getFullYear() || (year === today.getFullYear() && month >= today.getMonth() + 1)) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1);
  // Monday-based: Sunday=0 → shift to 6, Mon=1 → 0, ...
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  const todayDate = today.getDate();

  // Total cells to render (pad to complete rows)
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const day = i - startOffset + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  const activeDays = Object.keys(days).length;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color={GREEN} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.monthLabel}>{MONTHS_TR[month - 1]} {year}</Text>
          {activeDays > 0 && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>{activeDays} aktif gün</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={18} color={GREEN} />
        </TouchableOpacity>
      </View>

      {/* Weekday labels */}
      <View style={styles.weekRow}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={styles.weekLabel}>{d}</Text>
        ))}
      </View>

      {/* Grid */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={GREEN} />
        </View>
      ) : (
        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (!day) return <View key={`e-${i}`} style={styles.cell} />;

            const posts    = days[String(day)];
            const active   = !!posts && posts.length > 0;
            const isToday  = isCurrentMonth && day === todayDate;
            const emoji    = dayEmoji(posts);
            const count    = posts?.length ?? 0;

            return (
              <View
                key={day}
                style={[
                  styles.cell,
                  active   && styles.cellActive,
                  isToday  && styles.cellToday,
                ]}
              >
                {active ? (
                  <>
                    <Text style={styles.cellEmoji}>{emoji}</Text>
                    <Text style={[styles.cellDay, styles.cellDayActive]}>{day}</Text>
                    {count > 1 && (
                      <View style={styles.countDot}>
                        <Text style={styles.countDotText}>{count}</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={[styles.cellDay, isToday && styles.cellDayToday]}>{day}</Text>
                )}
                {isToday && !active && <View style={styles.todayDot} />}
              </View>
            );
          })}
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <LegendItem emoji="📷" label="Fotoğraf" />
        <LegendItem emoji="✍️" label="Yazı" />
        <LegendItem emoji="💪" label="Antrenman" />
        <LegendItem emoji="🥗" label="Öğün" />
      </View>
    </View>
  );
}

function LegendItem({ emoji, label }) {
  return (
    <View style={styles.legendItem}>
      <Text style={styles.legendEmoji}>{emoji}</Text>
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const CELL_SIZE = Math.floor((Math.min(380, 360) - 32 - 12) / 7);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  navBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: GREEN_XL,
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { alignItems: 'center', gap: 4 },
  monthLabel: { fontSize: 16, fontWeight: '800', color: '#111827' },
  activeBadge: {
    backgroundColor: GREEN_XL,
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20,
  },
  activeBadgeText: { fontSize: 11, fontWeight: '700', color: GREEN },

  // Weekday row
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekLabel: {
    flex: 1, textAlign: 'center',
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
  },

  // Loading
  loadingWrap: { height: 160, justifyContent: 'center', alignItems: 'center' },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 2,
  },
  cellActive: {
    backgroundColor: GREEN_XL,
    borderRadius: 10,
  },
  cellToday: {
    borderWidth: 2,
    borderColor: GREEN,
    borderRadius: 10,
  },
  cellDay: { fontSize: 13, color: '#374151', fontWeight: '500' },
  cellDayActive: { fontSize: 10, color: GREEN_DARK, fontWeight: '700', marginTop: 1 },
  cellDayToday: { color: GREEN, fontWeight: '800' },
  cellEmoji: { fontSize: 16, lineHeight: 18 },

  countDot: {
    position: 'absolute', top: 2, right: 3,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: ORANGE,
    justifyContent: 'center', alignItems: 'center',
  },
  countDotText: { fontSize: 8, color: '#fff', fontWeight: '800' },
  todayDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: GREEN,
    position: 'absolute', bottom: 3,
  },

  // Legend
  legend: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginTop: 14, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  legendItem: { alignItems: 'center', gap: 3 },
  legendEmoji: { fontSize: 16 },
  legendLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
});
