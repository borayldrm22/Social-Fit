import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useApi } from '../../api/client';

export default function CreateGroupScreen({ navigation }) {
  const api = useApi();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Grup adı girin.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/groups', { name: name.trim(), description: description.trim() || undefined });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Hata', e.message || 'Grup oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Grup adı *" value={name} onChangeText={setName} />
      <TextInput style={[styles.input, styles.area]} placeholder="Açıklama (isteğe bağlı)" value={description} onChangeText={setDescription} multiline />
      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={submit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Oluşturuluyor...' : 'Grup Oluştur'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 },
  area: { minHeight: 80 },
  button: { backgroundColor: '#2d6a4f', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
