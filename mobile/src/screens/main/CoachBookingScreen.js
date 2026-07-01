// CoachBookingScreen.js — SocialFit redesign · Diyetisyen randevusu
// Konum: src/screens/main/CoachBookingScreen.js
// Backend: GET /api/coaches/:id, GET /api/coaches/:id/slots, POST /api/bookings
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../api/client';
import { colors, font, shadow } from '../../theme/socialFitTheme';
import { Avatar, Placeholder } from '../../components/sf/ui';

const TAGS = ['Kilo Yönetimi', 'Spor Beslenmesi', 'Hamilelik'];
const DAY_LABELS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

// Slot ISO listesini güne göre grupla -> [{ key, lbl, n, slots:[{iso, time}] }]
function groupSlotsByDay(slots) {
  const map = new Map();
  for (const s of slots) {
    const d = new Date(s.slotAt);
    const key = d.toISOString().slice(0, 10);
    if (!map.has(key)) {
      map.set(key, { key, lbl: DAY_LABELS[d.getDay()], n: d.getDate(), slots: [] });
    }
    map.get(key).slots.push({
      iso: s.slotAt,
      time: d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    });
  }
  return Array.from(map.values()).slice(0, 5);
}

export default function CoachBookingScreen({ navigation, route }) {
  const api = useApi();
  const insets = useSafeAreaInsets();
  const coachId = route?.params?.coachId;
  const [coach, setCoach] = useState(route?.params?.coach || null);
  const [days, setDays] = useState([]);
  const [dayKey, setDayKey] = useState(null);
  const [slotIso, setSlotIso] = useState(null);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!coachId) return;
    (async () => {
      try {
        const [c, slotRes] = await Promise.all([
          api.get(`/api/coaches/${coachId}`).catch(() => null),
          api.get(`/api/coaches/${coachId}/slots`).catch(() => null),
        ]);
        if (c) setCoach(c);
        const grouped = groupSlotsByDay(Array.isArray(slotRes?.slots) ? slotRes.slots : []);
        setDays(grouped);
        if (grouped.length) {
          setDayKey(grouped[0].key);
          setSlotIso(grouped[0].slots[0]?.iso ?? null);
        }
      } catch (e) {}
    })();
  }, [api, coachId]);

  const activeDay = days.find((d) => d.key === dayKey);

  const book = useCallback(async () => {
    if (!coachId || !slotIso) {
      Alert.alert('Eksik seçim', 'Lütfen bir tarih ve saat seçin.');
      return;
    }
    setBooking(true);
    try {
      await api.post('/api/bookings', { coachId, slotAt: slotIso });
      Alert.alert('Randevu alındı', 'Randevun başarıyla oluşturuldu. (+25 ⭐)', [
        { text: 'Tamam', onPress: () => navigation?.goBack?.() },
      ]);
    } catch (e) {
      Alert.alert('Hata', e.message || 'Randevu oluşturulamadı.');
    } finally {
      setBooking(false);
    }
  }, [api, coachId, slotIso, navigation]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.back} onPress={() => navigation?.goBack?.()}><Ionicons name="arrow-back" size={19} color="#3C4A42" /></TouchableOpacity>
          <Text style={styles.title}>Randevu Al</Text>
        </View>

        {/* Diyetisyen kartı */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <View>
              {coach ? (
                <Avatar profile={coach} name={coach.displayName} size={74} style={{ borderRadius: 22 }} />
              ) : (
                <Placeholder height={74} radius={22} style={{ width: 74 }} label="" />
              )}
              <View style={styles.online} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.docName}>{coach?.displayName || 'Diyetisyen'}</Text>
              <Text style={styles.docMeta} numberOfLines={2}>{coach?.bio || 'Klinik Diyetisyen'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 7 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Text style={{ color: colors.amber, fontSize: 13 }}>⭐</Text>
                  <Text style={styles.rating}>4.9</Text><Text style={styles.ratingCount}>(128)</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="videocam" size={14} color="#34A853" />
                  <Text style={styles.online2}>Online</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 13 }}>
            {TAGS.map((t) => <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>)}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Tarih Seç</Text>
        <View style={styles.dayRow}>
          {days.map((d) => {
            const on = dayKey === d.key;
            return (
              <TouchableOpacity key={d.key} style={[styles.day, on ? styles.dayOn : styles.dayOff]}
                onPress={() => { setDayKey(d.key); setSlotIso(d.slots[0]?.iso ?? null); }}>
                <Text style={[styles.dayLbl, { color: on ? '#A9E0C2' : colors.faint }]}>{d.lbl}</Text>
                <Text style={[styles.dayNum, { color: on ? colors.white : colors.ink }]}>{d.n}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Uygun Saatler</Text>
        <View style={styles.slotGrid}>
          {(activeDay?.slots || []).map((s) => {
            const on = slotIso === s.iso;
            return (
              <TouchableOpacity key={s.iso} onPress={() => setSlotIso(s.iso)}
                style={[styles.slot, on ? styles.slotOn : styles.slotOff]}>
                <Text style={[styles.slotText, { color: on ? colors.white : colors.ink }]}>{s.time}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.promo}>
          <Ionicons name="gift" size={18} color={colors.amberDark} />
          <Text style={styles.promoText}>Premium ile ilk ay <Text style={{ fontFamily: font.bodyBold, color: colors.ink }}>ücretsiz</Text> · ayda 1 seans dahil</Text>
        </View>
      </ScrollView>

      {/* Sticky alt bar */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.priceLbl}>45 dk seans</Text>
          <Text style={styles.price}>₺450</Text>
        </View>
        <TouchableOpacity style={[styles.cta, booking && { opacity: 0.6 }]} activeOpacity={0.85} disabled={booking} onPress={book}>
          <Text style={styles.ctaText}>{booking ? 'Alınıyor...' : 'Randevu Al'}</Text>
          <Ionicons name="arrow-forward" size={19} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: font.displayBold, fontSize: 19, color: colors.ink },
  card: { marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 24, ...shadow.card, padding: 16 },
  online: { position: 'absolute', bottom: -3, right: -3, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.online, borderWidth: 2.5, borderColor: colors.surface },
  docName: { fontFamily: font.displayBold, fontSize: 17, color: colors.ink },
  docMeta: { fontSize: 12, color: colors.faint, fontFamily: font.body, marginTop: 2 },
  rating: { fontFamily: font.bodyBold, fontSize: 13, color: colors.ink },
  ratingCount: { fontSize: 12, color: colors.faint, fontFamily: font.body },
  online2: { fontSize: 12, color: '#34A853', fontFamily: font.bodyBold },
  tag: { backgroundColor: colors.mint, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 11 },
  tagText: { color: colors.primary, fontFamily: font.bodyBold, fontSize: 11 },
  sectionTitle: { fontFamily: font.bodyBold, fontSize: 15, color: colors.ink, marginHorizontal: 18, marginTop: 18, marginBottom: 10 },
  dayRow: { flexDirection: 'row', gap: 9, paddingHorizontal: 16 },
  day: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 16 },
  dayOn: { backgroundColor: colors.primary, ...shadow.cta },
  dayOff: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  dayLbl: { fontSize: 11, fontFamily: font.bodyBold },
  dayNum: { fontFamily: font.displayBold, fontSize: 17, marginTop: 2 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, paddingHorizontal: 16 },
  slot: { width: '31.5%', alignItems: 'center', paddingVertical: 12, borderRadius: 14 },
  slotOn: { backgroundColor: colors.primary, ...shadow.soft },
  slotOff: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  slotDis: { backgroundColor: '#F0F2EF' },
  slotText: { fontFamily: font.displayBold, fontSize: 14 },
  slotTextDis: { color: '#BCC6BD', textDecorationLine: 'line-through' },
  promo: { flexDirection: 'row', alignItems: 'center', gap: 9, marginHorizontal: 16, marginTop: 16, backgroundColor: colors.amberTint, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  promoText: { flex: 1, fontSize: 12, color: '#9A7420', fontFamily: font.body },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 26, flexDirection: 'row', alignItems: 'center', gap: 14 },
  priceLbl: { fontSize: 11, color: colors.faint, fontFamily: font.bodyBold },
  price: { fontFamily: font.displayBold, fontSize: 24, color: colors.ink },
  cta: { flex: 1, backgroundColor: colors.primary, borderRadius: 17, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...shadow.cta },
  ctaText: { color: colors.white, fontFamily: font.bodyBold, fontSize: 16 },
});
