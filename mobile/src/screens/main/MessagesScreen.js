import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useApi } from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';

export default function MessagesScreen({ navigation }) {
  const api = useApi();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.get('/api/messages/conversations');
      setConversations(Array.isArray(data) ? data : []);
    } catch (e) {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.userId}
        ListEmptyComponent={<Text style={styles.empty}>Henüz sohbet yok. Arkadaşlarınızla mesajlaşın.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('Chat', { userId: item.userId, displayName: item.profile?.displayName || 'Kullanıcı' })}
          >
            <Text style={styles.name}>{item.profile?.displayName || 'Kullanıcı'}</Text>
            <Text style={styles.preview} numberOfLines={1}>{item.lastMessage}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  item: { backgroundColor: '#fff', padding: 16, marginBottom: 1 },
  name: { fontWeight: '600' },
  preview: { color: '#666', marginTop: 4, fontSize: 14 },
  empty: { textAlign: 'center', padding: 24, color: '#666' },
});
