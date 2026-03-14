import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useApi } from '../../api/client';
import DisplayNameWithStars from '../../components/DisplayNameWithStars';

export default function SearchUsersScreen({ navigation }) {
  const api = useApi();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    try {
      const data = await api.get(`/api/users/search?q=${encodeURIComponent(q)}`);
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Kullanıcı ara..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={search}>
          <Text style={styles.searchBtnText}>Ara</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={loading ? <Text>Aranıyor...</Text> : <Text style={styles.empty}>Arama yapın veya sonuç yok.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('Chat', { userId: item.id, displayName: item.profile?.displayName || 'Kullanıcı', avatarUrl: item.profile?.avatarUrl, starPoints: item.starPoints })}
          >
            <DisplayNameWithStars
              displayName={item.profile?.displayName}
              starPoints={item.starPoints}
              nameStyle={styles.name}
            />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  searchRow: { flexDirection: 'row', marginBottom: 16 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginRight: 8 },
  searchBtn: { justifyContent: 'center', paddingHorizontal: 16, backgroundColor: '#2d6a4f', borderRadius: 8 },
  searchBtnText: { color: '#fff', fontWeight: '600' },
  item: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  name: { fontSize: 16 },
  empty: { textAlign: 'center', padding: 24, color: '#666' },
});
