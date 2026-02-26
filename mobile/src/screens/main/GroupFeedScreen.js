import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useApi } from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function GroupFeedScreen({ route, navigation }) {
  const { groupId, groupName } = route.params || {};
  const api = useApi();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!groupId) return;
      api.get(`/api/groups/${groupId}/posts`).then(setPosts).catch(() => setPosts([])).finally(() => setLoading(false));
    }, [groupId, api])
  );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.displayName}>{item.user?.profile?.displayName || 'Kullanıcı'}</Text>
      </View>
      {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.postImage} />}
      {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={loading ? <Text>Yükleniyor...</Text> : <Text style={styles.empty}>Bu grupta henüz paylaşım yok.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  card: { backgroundColor: '#fff', marginBottom: 8, padding: 12 },
  cardHeader: { marginBottom: 8 },
  displayName: { fontWeight: '600' },
  postImage: { width: '100%', height: 200, borderRadius: 8 },
  caption: { marginTop: 8 },
  empty: { textAlign: 'center', padding: 24, color: '#666' },
});
