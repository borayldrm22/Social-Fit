// GroupMapScreen.js — SocialFit · Grupları haritada keşfet
// Konum: src/screens/main/GroupMapScreen.js
// Backend: GET /api/groups/map ; POST /api/groups/:id/join (public→katıl, private→istek)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../../api/client';
import { API_BASE } from '../../config';
import { colors, font, shadow, radius } from '../../theme/socialFitTheme';

const ISTANBUL = { latitude: 41.0082, longitude: 28.9784, latitudeDelta: 0.35, longitudeDelta: 0.35 };
const EMOJIS = ['🧓', '🥦', '🏃', '🍬', '👶', '💪', '🧘', '🥗', '🚴', '⚽'];
const TINTS = ['#FCEAD6', colors.mint, '#FDEBE3', '#FBE9C8', '#E7EEF7', '#E4F3EA', '#FFEDE6', '#FEF3DC'];
function pickByName(name = '', arr) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}
function resolveUri(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

// Grup fotoğraflı özel pin — yoksa isimden türeyen emoji/renk
function GroupMarker({ group, onPress }) {
  const uri = resolveUri(group.imageUrl);
  // Android'de görsel marker'da boş çıkmasın diye yüklenmeden tracksViewChanges=true tutulur
  const [tracks, setTracks] = useState(!!uri);
  const ring = group.isPrivate ? colors.coral : colors.primary;
  return (
    <Marker
      coordinate={{ latitude: group.latitude, longitude: group.longitude }}
      onPress={onPress}
      tracksViewChanges={tracks}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={markerStyles.wrap}>
        <View style={[markerStyles.bubble, { borderColor: ring }]}>
          {uri ? (
            <Image
              source={{ uri }}
              style={markerStyles.img}
              onLoadEnd={() => setTracks(false)}
              onError={() => setTracks(false)}
            />
          ) : (
            <View style={[markerStyles.fallback, { backgroundColor: pickByName(group.name, TINTS) }]}>
              <Text style={markerStyles.emoji}>{pickByName(group.name, EMOJIS)}</Text>
            </View>
          )}
        </View>
        {group.isPrivate ? (
          <View style={markerStyles.lockBadge}><Ionicons name="lock-closed" size={9} color={colors.white} /></View>
        ) : null}
        <View style={[markerStyles.tail, { borderTopColor: ring }]} />
      </View>
    </Marker>
  );
}

export default function GroupMapScreen({ navigation }) {
  const api = useApi();
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  // Marker'a basınca MapView.onPress de tetiklenip kartı anında kapatıyordu ("basılamıyor" hissi).
  // Son marker dokunuşunun zamanını tutup harita basışını kısa süre yok sayıyoruz.
  const lastMarkerTapRef = useRef(0);
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState(null);
  const [joiningId, setJoiningId] = useState(null);

  const load = useCallback(() => {
    let cancelled = false;
    api.get('/api/groups/map')
      .then((d) => { if (!cancelled) setGroups(Array.isArray(d) ? d.filter((g) => g.latitude != null && g.longitude != null) : []); })
      .catch(() => { if (!cancelled) setGroups([]); });
    return () => { cancelled = true; };
  }, [api]);
  useFocusEffect(useCallback(() => load(), [load]));

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({});
        mapRef.current?.animateToRegion({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, latitudeDelta: 0.15, longitudeDelta: 0.15 }, 600);
      } catch (e) {}
    })();
  }, []);

  const patch = (id, fields) => {
    setGroups((prev) => prev.map((x) => (x.id === id ? { ...x, ...fields } : x)));
    setSelected((s) => (s && s.id === id ? { ...s, ...fields } : s));
  };

  const join = async (g) => {
    setJoiningId(g.id);
    try {
      const res = await api.post(`/api/groups/${g.id}/join`);
      if (res.status === 'joined') {
        patch(g.id, { isMember: true, memberCount: (g.memberCount || 0) + 1 });
        Alert.alert('Katıldın 🎉', `"${g.name}" grubuna katıldın.`);
      } else {
        patch(g.id, { isPending: true });
        Alert.alert('İstek gönderildi', 'Grup admini onayladığında katılacaksın.');
      }
    } catch (e) {
      Alert.alert('Hata', e.message || 'İşlem başarısız.');
    } finally {
      setJoiningId(null);
    }
  };

  const renderAction = (g) => {
    if (g.isMember) {
      return (
        <TouchableOpacity style={styles.cta} activeOpacity={0.85} onPress={() => navigation.navigate('GroupFeed', { groupId: g.id, groupName: g.name })}>
          <Ionicons name="arrow-forward" size={17} color={colors.white} />
          <Text style={styles.ctaText}>Görüntüle</Text>
        </TouchableOpacity>
      );
    }
    if (g.isPending) {
      return (
        <View style={[styles.cta, styles.ctaMuted]}>
          <Ionicons name="time-outline" size={17} color={colors.muted} />
          <Text style={[styles.ctaText, { color: colors.muted }]}>İstek gönderildi</Text>
        </View>
      );
    }
    return (
      <TouchableOpacity style={styles.cta} activeOpacity={0.85} disabled={joiningId === g.id} onPress={() => join(g)}>
        {joiningId === g.id ? <ActivityIndicator color={colors.white} size="small" /> : (
          <>
            <Ionicons name={g.isPrivate ? 'lock-closed' : 'add'} size={17} color={colors.white} />
            <Text style={styles.ctaText}>{g.isPrivate ? 'Katılma isteği gönder' : 'Katıl'}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <MapView ref={mapRef} provider={PROVIDER_DEFAULT} style={StyleSheet.absoluteFill} initialRegion={ISTANBUL} showsUserLocation showsMyLocationButton={false} onPress={() => { if (Date.now() - lastMarkerTapRef.current < 400) return; setSelected(null); }}>
        {groups.map((g) => (
          <GroupMarker
            key={g.id}
            group={g}
            onPress={(e) => { e?.stopPropagation?.(); lastMarkerTapRef.current = Date.now(); setSelected(g); }}
          />
        ))}
      </MapView>

      {/* Header */}
      <View style={[styles.header, { top: insets.top + 6 }]}>
        <TouchableOpacity style={styles.glass} onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.titlePill}><Text style={styles.titleText}>Grup Haritası</Text></View>
        <View style={{ width: 40 }} />
      </View>

      {/* Seçili grup kartı */}
      {selected && (
        <View style={[styles.card, { bottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.cardClose} onPress={() => setSelected(null)} hitSlop={8}>
            <Ionicons name="close" size={18} color={colors.faint} />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}
            activeOpacity={selected.isMember ? 0.7 : 1}
            onPress={() => { if (selected.isMember) navigation.navigate('GroupFeed', { groupId: selected.id, groupName: selected.name }); }}
          >
            {resolveUri(selected.imageUrl) ? (
              <Image source={{ uri: resolveUri(selected.imageUrl) }} style={styles.cardImg} />
            ) : (
              <View style={[styles.cardImg, styles.cardImgFallback]}><Ionicons name="people" size={24} color={colors.primary} /></View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.cardName} numberOfLines={1}>{selected.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                <View style={[styles.tag, selected.isPrivate ? { backgroundColor: colors.coralTint } : { backgroundColor: colors.mint }]}>
                  <Ionicons name={selected.isPrivate ? 'lock-closed' : 'earth'} size={11} color={selected.isPrivate ? colors.coralDark : colors.primary} />
                  <Text style={[styles.tagText, { color: selected.isPrivate ? colors.coralDark : colors.primary }]}>{selected.isPrivate ? 'Gizli' : 'Herkese açık'}</Text>
                </View>
                <Text style={styles.cardMeta}>{selected.memberCount ?? 0} üye{selected.locationName ? ` · ${selected.locationName}` : ''}</Text>
              </View>
            </View>
          </TouchableOpacity>
          {selected.description?.trim() ? (
            <Text style={styles.cardDesc} numberOfLines={2}>{selected.description.trim()}</Text>
          ) : null}
          <View style={{ marginTop: 12 }}>{renderAction(selected)}</View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { position: 'absolute', left: 14, right: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  glass: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', ...shadow.soft },
  titlePill: { backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill, ...shadow.soft },
  titleText: { fontFamily: font.displayBold, fontSize: 15, color: colors.ink },
  card: { position: 'absolute', left: 14, right: 14, backgroundColor: colors.surface, borderRadius: radius.card, padding: 16, ...shadow.card },
  cardClose: { position: 'absolute', top: 10, right: 10, zIndex: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  cardImg: { width: 54, height: 54, borderRadius: 16 },
  cardImgFallback: { backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontFamily: font.displayBold, fontSize: 17, color: colors.ink, paddingRight: 28 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9 },
  tagText: { fontFamily: font.bodyBold, fontSize: 11 },
  cardMeta: { fontSize: 12, color: colors.faint, fontFamily: font.body },
  cardDesc: { fontSize: 13, color: colors.text, fontFamily: font.body, lineHeight: 19, marginTop: 10 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 13, ...shadow.cta },
  ctaMuted: { backgroundColor: colors.bg, ...{ shadowOpacity: 0 } },
  ctaText: { color: colors.white, fontFamily: font.bodyBold, fontSize: 15 },
});

const markerStyles = StyleSheet.create({
  wrap: { alignItems: 'center', width: 50 },
  bubble: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 3, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  img: { width: 38, height: 38, borderRadius: 19 },
  fallback: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 20 },
  lockBadge: { position: 'absolute', top: -2, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.surface },
  tail: { marginTop: -2, width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
});
