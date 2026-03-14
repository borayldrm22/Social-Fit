import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApi, uploadFormData } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function CreatePostScreen({ navigation, route }) {
  const api = useApi();
  const { token } = useAuth();
  const fromFoodLog = route.params?.fromFoodLog ?? false;
  const [type, setType] = useState(route.params?.prefillType || 'meal');
  const [caption, setCaption] = useState(route.params?.prefillCaption || '');
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin gerekli', 'Galeri erişimi için izin verin.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const submit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('type', type);
      if (caption) formData.append('caption', caption);
      if (imageUri) {
        const name = imageUri.split('/').pop() || 'photo.jpg';
        formData.append('image', { uri: imageUri, name, type: 'image/jpeg' });
      }
      await uploadFormData('/api/posts', formData, token);
      await api.post('/api/streaks/record');
      const parent = navigation.getParent();
      if (parent) parent.navigate('Feed');
      else navigation.goBack();
    } catch (e) {
      Alert.alert('Hata', e.message || 'Paylaşım yapılamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {fromFoodLog && (
        <View style={styles.foodLogBanner}>
          <Ionicons name="nutrition-outline" size={16} color="#2d6a4f" />
          <Text style={styles.foodLogBannerText}>Yemek günlüğünden paylaşılıyor</Text>
        </View>
      )}
      <View style={styles.typeRow}>
        <TouchableOpacity style={[styles.typeBtn, type === 'meal' && styles.typeBtnActive]} onPress={() => setType('meal')}>
          <Text style={[styles.typeText, type === 'meal' && styles.typeTextActive]}>Öğün</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.typeBtn, type === 'workout' && styles.typeBtnActive]} onPress={() => setType('workout')}>
          <Text style={[styles.typeText, type === 'workout' && styles.typeTextActive]}>Spor</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} />
        ) : (
          <Text style={styles.placeholder}>Fotoğraf ekle</Text>
        )}
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="Açıklama (isteğe bağlı)"
        value={caption}
        onChangeText={setCaption}
        multiline
      />
      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={submit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Paylaşılıyor...' : 'Paylaş'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  typeRow: { flexDirection: 'row', marginBottom: 16 },
  typeBtn: { flex: 1, padding: 12, marginHorizontal: 4, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#2d6a4f' },
  typeText: { color: '#666' },
  typeTextActive: { color: '#fff', fontWeight: '600' },
  imageBox: { height: 200, borderRadius: 8, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  preview: { width: '100%', height: '100%', borderRadius: 8 },
  placeholder: { color: '#999' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, minHeight: 80, marginBottom: 16 },
  button: { backgroundColor: '#2d6a4f', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '600' },
  foodLogBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 8, padding: 10, marginBottom: 12 },
  foodLogBannerText: { fontSize: 13, color: '#2d6a4f', fontWeight: '500', marginLeft: 8 },
});
