import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../api/client';

export default function ChatScreen({ route }) {
  const { userId, displayName } = route.params || {};
  const { user } = useAuth();
  const api = useApi();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);

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
    const isMe = item.senderId === user?.id;
    return (
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.body}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={loading ? <Text>Yükleniyor...</Text> : null}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Mesaj..."
          value={body}
          onChangeText={setBody}
          onSubmitEditing={send}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={send}>
          <Text style={styles.sendText}>Gönder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 12, margin: 8 },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: '#2d6a4f' },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: '#fff' },
  bubbleText: { color: '#333' },
  bubbleTextMe: { color: '#fff' },
  inputRow: { flexDirection: 'row', padding: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
  sendBtn: { justifyContent: 'center', paddingHorizontal: 16 },
  sendText: { color: '#2d6a4f', fontWeight: '600' },
});
