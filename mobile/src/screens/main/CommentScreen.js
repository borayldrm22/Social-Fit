import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useApi } from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';
import DisplayNameWithStars from '../../components/DisplayNameWithStars';

export default function CommentScreen({ route }) {
  const { postId } = route.params || {};
  const api = useApi();
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!postId) return;
    try {
      const data = await api.get(`/api/posts/${postId}/comments`);
      setComments(Array.isArray(data) ? data : []);
    } catch (e) {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postId, api]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const submit = async () => {
    const text = body.trim();
    if (!text) return;
    setBody('');
    try {
      const comment = await api.post(`/api/posts/${postId}/comments`, { body: text });
      setComments((prev) => [...prev, comment]);
    } catch (e) {}
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={loading ? <Text>Yükleniyor...</Text> : <Text style={styles.empty}>Henüz yorum yok.</Text>}
        renderItem={({ item }) => (
          <View style={styles.comment}>
            <DisplayNameWithStars
              displayName={item.user?.profile?.displayName}
              starPoints={item.user?.starPoints}
              nameStyle={styles.author}
            />
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput style={styles.input} placeholder="Yorum yaz..." value={body} onChangeText={setBody} />
        <TouchableOpacity style={styles.sendBtn} onPress={submit}>
          <Text style={styles.sendText}>Gönder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  comment: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  author: { fontWeight: '600', marginBottom: 4 },
  body: { color: '#333' },
  empty: { textAlign: 'center', padding: 24, color: '#666' },
  inputRow: { flexDirection: 'row', padding: 8, borderTopWidth: 1, borderTopColor: '#eee' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginRight: 8 },
  sendBtn: { justifyContent: 'center', paddingHorizontal: 12 },
  sendText: { color: '#2d6a4f', fontWeight: '600' },
});
