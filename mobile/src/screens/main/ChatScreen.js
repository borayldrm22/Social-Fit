import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../api/client';
import { Ionicons } from '@expo/vector-icons';
import { formatDateDivider, formatTime } from '../../utils/formatRelativeTime';
import DisplayNameWithStars from '../../components/DisplayNameWithStars';

const HEADER_GREEN = '#2D6A4F';
const BUBBLE_ME = '#52b788';
const BUBBLE_THEM = '#F3F4F6';

function AvatarCircle({ profile, size = 40 }) {
  const uri = profile?.avatarUrl;
  const name = profile?.displayName || '?';
  const initial = name.charAt(0).toUpperCase();
  if (uri) {
    return <Image source={{ uri }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />;
  }
  return (
    <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarInitial, { fontSize: size * 0.45 }]}>{initial}</Text>
    </View>
  );
}

function buildListItems(messages) {
  const items = [];
  let prevDate = null;
  for (const m of messages) {
    const d = new Date(m.createdAt);
    const dateKey = d.toDateString();
    if (dateKey !== prevDate) {
      prevDate = dateKey;
      items.push({ type: 'date', key: `date-${dateKey}`, date: d });
    }
    items.push({ type: 'message', key: m.id, ...m });
  }
  return items;
}

export default function ChatScreen({ route, navigation }) {
  const { userId, displayName, avatarUrl, starPoints } = route.params || {};
  const { user } = useAuth();
  const api = useApi();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const listRef = useRef(null);

  const otherProfile = useMemo(
    () => ({ displayName: displayName || 'Kullanıcı', avatarUrl: avatarUrl || null }),
    [displayName, avatarUrl]
  );

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api.get(`/api/messages/${userId}`);
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [userId, api]);

  useEffect(() => { load(); }, [load]);

  const listItems = useMemo(() => buildListItems(messages), [messages]);

  useEffect(() => {
    if (listItems.length > 0 && listRef.current) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [listItems.length]);

  const send = async () => {
    const text = body.trim();
    if (!text) return;
    setBody('');
    try {
      const msg = await api.post('/api/messages', { receiverId: userId, body: text });
      setMessages((prev) => [...prev, msg]);
    } catch (e) {}
  };

  const renderItem = ({ item }) => {
    if (item.type === 'date') {
      return (
        <View style={styles.dateDivider}>
          <Text style={styles.dateDividerText}>{formatDateDivider(item.date)}</Text>
        </View>
      );
    }
    const isMe = item.senderId === user?.id;
    return (
      <View style={[styles.bubbleWrap, isMe ? styles.bubbleWrapMe : styles.bubbleWrapThem]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.body}</Text>
        </View>
        <Text style={styles.bubbleTime}>{formatTime(item.createdAt)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <AvatarCircle profile={otherProfile} size={36} />
          <View style={styles.headerCenterText}>
            <DisplayNameWithStars
              displayName={displayName}
              starPoints={starPoints}
              nameStyle={styles.headerName}
            />
            <Text style={styles.headerStatus}>Şu an müsait</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="call-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="videocam-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={listItems}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Yükleniyor...</Text>
            </View>
          ) : null
        }
      />

      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.cameraBtn}>
          <Ionicons name="camera-outline" size={24} color="#6b7280" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Mesaj"
          placeholderTextColor="#9ca3af"
          value={body}
          onChangeText={setBody}
          onSubmitEditing={send}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={send}>
          <Ionicons name="send" size={22} color="#2d6a4f" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HEADER_GREEN,
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerBack: { padding: 8 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 8, minWidth: 0 },
  headerCenterText: { marginLeft: 10, minWidth: 0 },
  headerName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  headerStatus: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { padding: 10 },
  avatar: { backgroundColor: '#e5e7eb' },
  avatarPlaceholder: {
    backgroundColor: '#95b8a6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { color: '#fff', fontWeight: '700' },
  listContent: { paddingVertical: 12, paddingHorizontal: 12, paddingBottom: 24 },
  dateDivider: { alignItems: 'center', marginVertical: 8 },
  dateDividerText: { fontSize: 12, color: '#9ca3af' },
  bubbleWrap: { marginVertical: 2, maxWidth: '85%' },
  bubbleWrapMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleWrapThem: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { maxWidth: '100%', padding: 12, borderRadius: 16 },
  bubbleMe: { backgroundColor: BUBBLE_ME },
  bubbleThem: { backgroundColor: BUBBLE_THEM },
  bubbleText: { color: '#111827', fontSize: 15 },
  bubbleTextMe: { color: '#fff' },
  bubbleTime: { fontSize: 11, color: '#9ca3af', marginTop: 4, marginHorizontal: 4 },
  emptyWrap: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#6b7280' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cameraBtn: { padding: 8, marginRight: 4 },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 8,
  },
  sendBtn: { padding: 8 },
});
