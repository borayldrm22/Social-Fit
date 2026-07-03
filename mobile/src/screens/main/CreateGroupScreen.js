import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../api/client';
import { compressImage } from '../../utils/image';
import GroupLocationPrivacyFields from '../../components/sf/GroupLocationPrivacyFields';

const GREEN = '#2D6A4F';
const GREEN_XL = '#D8F3DC';

export default function CreateGroupScreen({ navigation }) {
  const api = useApi();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState(null); // seçilen yerel görsel
  const [loc, setLoc] = useState({ isPrivate: false, latitude: null, longitude: null, locationName: '' });
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin gerekli', 'Fotoğraf seçmek için galeri iznine ihtiyaç var.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      const a = result.assets[0];
      setImageUri(await compressImage(a.uri, { width: a.width }));
    }
  };

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Grup adı girin.');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      if (description.trim()) formData.append('description', description.trim());
      if (imageUri) {
        const filename = imageUri.split('/').pop();
        const ext = filename.split('.').pop() || 'jpg';
        formData.append('image', { uri: imageUri, name: filename, type: `image/${ext}` });
      }
      formData.append('isPrivate', loc.isPrivate ? 'true' : 'false');
      if (loc.latitude != null && loc.longitude != null) {
        formData.append('latitude', String(loc.latitude));
        formData.append('longitude', String(loc.longitude));
      }
      if (loc.locationName?.trim()) formData.append('locationName', loc.locationName.trim());
      await api.postForm('/api/groups', formData);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Hata', e.message || 'Grup oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      {/* Fotoğraf seçici */}
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera-outline" size={36} color={GREEN} />
            <Text style={styles.imagePlaceholderText}>Fotoğraf Ekle</Text>
          </View>
        )}
        <View style={styles.cameraOverlay}>
          <Ionicons name="camera" size={18} color="#fff" />
        </View>
      </TouchableOpacity>

      {/* Grup Adı */}
      <Text style={styles.label}>Grup Adı *</Text>
      <TextInput
        style={styles.input}
        placeholder="Grubunuzun adı"
        placeholderTextColor="#9CA3AF"
        value={name}
        onChangeText={setName}
        maxLength={60}
      />

      {/* Açıklama */}
      <Text style={styles.label}>Açıklama</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Grubunuz hakkında kısa bir açıklama..."
        placeholderTextColor="#9CA3AF"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        maxLength={300}
        textAlignVertical="top"
      />
      <Text style={styles.charCount}>{description.length}/300</Text>

      <GroupLocationPrivacyFields value={loc} onChange={(pp) => setLoc((s) => ({ ...s, ...pp }))} />

      {/* Oluştur Butonu */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={submit}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveBtnText}>Grup Oluştur</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAF8' },
  content: { padding: 20, paddingBottom: 40 },

  // Fotoğraf
  imagePicker: {
    alignSelf: 'center',
    width: 110, height: 110,
    borderRadius: 20,
    marginBottom: 28,
    position: 'relative',
  },
  imagePreview: { width: 110, height: 110, borderRadius: 20 },
  imagePlaceholder: {
    width: 110, height: 110, borderRadius: 20,
    backgroundColor: GREEN_XL,
    justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  imagePlaceholderText: { fontSize: 12, color: GREEN, fontWeight: '600' },
  cameraOverlay: {
    position: 'absolute', bottom: -6, right: -6,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: GREEN,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: '#F7FAF8',
  },

  // Form
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, color: '#111827',
    marginBottom: 20,
  },
  textArea: { minHeight: 100, paddingTop: 13 },
  charCount: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginTop: -16, marginBottom: 24 },

  // Oluştur
  saveBtn: {
    backgroundColor: GREEN,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
