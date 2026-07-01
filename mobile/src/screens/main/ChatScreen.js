// ChatScreen.js — SocialFit redesign · Sohbet detayı
// Konum önerisi: src/screens/main/ChatScreen.js
//
// Backend:
//   GET  /messages/:userId   -> [{ id, body, senderId, createdAt, read, sender }]
//   POST /messages           -> { receiverId, body }
//
// route.params: { userId, profile:{displayName, avatarUrl} }

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config';
import { colors, radius, font, shadow, avatarColor, getInitials } from '../../theme/socialFitTheme';
import { comingSoon } from '../../utils/comingSoon';

function avatarUri(profile) {
  const url = profile?.avatarUrl;
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

function clockOf(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function HeaderAvatar({ profile }) {
  const uri = avatarUri(profile);
  if (uri) return <Image source={{ uri }} style={styles.hAvatar} />;
  return (
    <View style={[styles.hAvatar, { backgroundColor: avatarColor(profile?.displayName), alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: colors.white, fontFamily: font.displayBold, fontSize: 15 }}>{getInitials(profile?.displayName)}</Text>
    </View>
  );
}

export default function ChatScreen({ route, navigation }) {
  const { userId, profile } = route.params || {};
  const api = useApi();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const myId = user?.id;
  const listRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api.get(`/api/messages/${userId}`);
      if (Array.isArray(data)) setMessages(data);
    } catch (e) {}
  }, [api, userId]);

  useEffect(() => { load(); }, [load]);

  const send = useCallback(async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    // İyimser ekleme
    const temp = { id: `tmp-${Date.now()}`, body, senderId: myId, createdAt: new Date().toISOString(), read: false, pending: true };
    setMessages((m) => [...m, temp]);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    try {
      const saved = await api.post('/api/messages', { receiverId: userId, body });
      setMessages((m) => m.map((x) => (x.id === temp.id ? saved : x)));
    } catch (e) {
      setMessages((m) => m.map((x) => (x.id === temp.id ? { ...x, failed: true, pending: false } : x)));
    }
  }, [api, draft, myId, userId]);

  const renderItem = ({ item }) => {
    const mine = item.senderId === myId;
    if (mine) {
      return (
        <View style={styles.mineWrap}>
          <View style={styles.mineBubble}>
            <Text style={styles.mineText}>{item.body}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.mineTime}>{clockOf(item.createdAt)}</Text>
              <Ionicons
                name={item.pending ? 'time-outline' : 'checkmark-done'}
                size={14}
                color={item.read ? '#A9E0C2' : 'rgba(255,255,255,0.6)'}
              />
            </View>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.theirWrap}>
        <View style={styles.theirBubble}>
          <Text style={styles.theirText}>{item.body}</Text>
          <Text style={styles.theirTime}>{clockOf(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Başlık */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <View>
          <HeaderAvatar profile={profile} />
          <View style={styles.onlineDot} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={styles.hName}>{profile?.displayName}</Text>
          </View>
          <Text style={styles.hStatus}>çevrimiçi</Text>
        </View>
        <TouchableOpacity hitSlop={10} onPress={() => comingSoon('Sesli arama')}>
          <Ionicons name="call-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Mesajlar */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(it) => String(it.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listPad}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListHeaderComponent={
          <View style={styles.dayWrap}>
            <Text style={styles.dayPill}>Bugün</Text>
          </View>
        }
      />

      {/* Giriş çubuğu */}
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.attachBtn} activeOpacity={0.7} onPress={() => comingSoon('Dosya ekle')}>
          <Ionicons name="add" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.inputField}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Mesaj yaz..."
            placeholderTextColor={colors.faint}
            style={styles.input}
            multiline
          />
          <Ionicons name="happy-outline" size={20} color={colors.faint} />
        </View>
        <TouchableOpacity style={styles.sendBtn} activeOpacity={0.8} onPress={send}>
          <Ionicons name="send" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDF3EC' },
  header: {
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider,
    paddingHorizontal: 14, paddingTop: 6, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center', gap: 11,
  },
  hAvatar: { width: 42, height: 42, borderRadius: 14 },
  onlineDot: {
    position: 'absolute', bottom: -1, right: -1, width: 13, height: 13, borderRadius: 7,
    backgroundColor: colors.online, borderWidth: 2, borderColor: colors.surface,
  },
  hName: { fontFamily: font.bodyBold, fontSize: 16, color: colors.ink },
  hStatus: { fontSize: 12, color: colors.online, fontFamily: font.bodyBold, marginTop: 1 },

  listPad: { padding: 16, paddingBottom: 8, gap: 11 },
  dayWrap: { alignItems: 'center', marginBottom: 11 },
  dayPill: {
    fontSize: 11, color: colors.muted, fontFamily: font.bodyBold,
    backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10,
    overflow: 'hidden',
  },

  theirWrap: { alignItems: 'flex-start' },
  theirBubble: {
    maxWidth: '80%', backgroundColor: colors.surface,
    borderRadius: 18, borderBottomLeftRadius: 5, paddingHorizontal: 14, paddingVertical: 11, ...shadow.soft,
  },
  theirText: { fontSize: 14, color: '#1F2D26', lineHeight: 20 },
  theirTime: { fontSize: 10, color: '#A6B2A8', fontFamily: font.bodyBold, textAlign: 'right', marginTop: 4 },

  mineWrap: { alignItems: 'flex-end' },
  mineBubble: {
    maxWidth: '80%', backgroundColor: colors.primary,
    borderRadius: 18, borderBottomRightRadius: 5, paddingHorizontal: 14, paddingVertical: 11, ...shadow.card,
  },
  mineText: { fontSize: 14, color: colors.white, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  mineTime: { fontSize: 10, color: '#A9E0C2', fontFamily: font.bodyBold },

  inputBar: {
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 26,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  attachBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F4EF', alignItems: 'center', justifyContent: 'center' },
  inputField: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: 22, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 11 : 4,
  },
  input: { flex: 1, fontSize: 14, color: colors.ink, fontFamily: font.body, maxHeight: 100, paddingTop: 0, paddingBottom: 0 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow.cta },
});
