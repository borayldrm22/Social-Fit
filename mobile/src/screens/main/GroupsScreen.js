import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, SectionList } from 'react-native';
import { useApi } from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';

export default function GroupsScreen({ navigation }) {
  const api = useApi();
  const [myGroups, setMyGroups] = useState([]);
  const [discover, setDiscover] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [mine, disc] = await Promise.all([api.get('/api/groups'), api.get('/api/groups/discover')]);
      setMyGroups(Array.isArray(mine) ? mine : []);
      setDiscover(Array.isArray(disc) ? disc : []);
    } catch (e) {
      setMyGroups([]);
      setDiscover([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const joinGroup = async (groupId) => {
    try {
      await api.post(`/api/groups/${groupId}/join`);
      load();
    } catch (e) {}
  };

  const sections = [
    { title: 'Gruplarım', data: myGroups },
    { title: 'Keşfet', data: discover },
  ];

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item, section }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() =>
              section.title === 'Gruplarım'
                ? navigation.navigate('GroupFeed', { groupId: item.id, groupName: item.name })
                : joinGroup(item.id)
            }
          >
            <Text style={styles.name}>{item.name}</Text>
            {item.description ? <Text style={styles.desc} numberOfLines={1}>{item.description}</Text> : null}
            {section.title === 'Keşfet' && <Text style={styles.joinText}>Katıl</Text>}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Henüz grubunuz yok. Grup oluşturun veya keşfedin.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  sectionHeader: { padding: 12, paddingTop: 16, fontWeight: '600', backgroundColor: '#f0f0f0' },
  item: { backgroundColor: '#fff', padding: 16, marginBottom: 8 },
  name: { fontWeight: '600', fontSize: 16 },
  desc: { color: '#666', marginTop: 4 },
  joinText: { color: '#2d6a4f', marginTop: 4, fontWeight: '600' },
  empty: { textAlign: 'center', padding: 24, color: '#666' },
});
