import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import * as ImagePicker from 'expo-image-picker';
import { uploadFormData } from '../../api/client';
import { useApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useStarReward } from '../../context/StarRewardContext';
import { compressImage } from '../../utils/image';
import { API_BASE } from '../../config';

const GREEN = '#2D6A4F';
const GREEN_XL = '#D8F3DC';

export default function CreatePostScreen({ navigation, route }) {
  console.log('[CreatePostScreen] rendered, token exists:', !!useAuth().token);
  const api = useApi();
  const { token } = useAuth();
  const { celebrate } = useStarReward();
  const headerHeight = useHeaderHeight();
  const [type, setType] = useState(route.params?.prefillType || 'meal'); // 'meal' | 'workout' | 'text'
  const [caption, setCaption] = useState(route.params?.prefillCaption || '');
  const [media, setMedia] = useState(null); // { uri, isVideo }
  const [loading, setLoading] = useState(false);

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin gerekli', 'Galeri erişimi için izin verin.');
      return false;
    }
    return true;
  };

  const pickPhoto = async () => {
    if (!(await requestPermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled) {
      const a = result.assets[0];
      const uri = await compressImage(a.uri, { width: a.width });
      setMedia({ uri, isVideo: false });
    }
  };

  const pickVideo = async () => {
    if (!(await requestPermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      videoMaxDuration: 60,
      quality: 0.85,
    });
    if (!result.canceled) {
      setMedia({ uri: result.assets[0].uri, isVideo: true });
    }
  };

  const showMediaChoice = () => {
    Alert.alert('Medya Ekle', 'Ne eklemek istersin?', [
      { text: 'Fotoğraf', onPress: pickPhoto },
      { text: 'Video', onPress: pickVideo },
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  const submit = async () => {
    if (type === 'text' && !caption.trim()) {
      Alert.alert('Uyarı', 'Yazı paylaşmak için bir şeyler yaz.');
      return;
    }
    console.log('[CreatePostScreen] submit pressed, type:', type, 'caption:', caption);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('type', type);
      if (caption.trim()) formData.append('caption', caption.trim());

      if (media) {
        const uri = media.uri;
        const filename = uri.split('/').pop() || (media.isVideo ? 'video.mp4' : 'photo.jpg');
        const mimeType = media.isVideo
          ? 'video/mp4'
          : 'image/jpeg';
        formData.append('image', { uri, name: filename, type: mimeType });
      }

      await uploadFormData('/api/posts', formData, token);

      let reward = null;
      try {
        const res = await api.post('/api/streaks/record');
        if (res?.awarded > 0) reward = { points: res.awarded, bonus: res.bonus || 0 };
      } catch (_) {}

      const parent = navigation.getParent();
      if (parent) parent.navigate('Feed');
      else navigation.goBack();

      // Navigasyon tamamlandıktan sonra global overlay'i tetikle
      if (reward) setTimeout(() => celebrate(reward), 350);
    } catch (e) {
      console.error('[CreatePost] submit error:', e);
      Alert.alert('Hata', e.message || 'Paylaşım yapılamadı. Sunucu bağlantısını kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Öğün / Spor tag seçimi */}
      <Text style={styles.sectionLabel}>İçerik türü</Text>
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'meal' && styles.typeBtnActive]}
          onPress={() => setType('meal')}
          activeOpacity={0.8}
        >
          <Text style={styles.typeEmoji}>🥗</Text>
          <Text style={[styles.typeText, type === 'meal' && styles.typeTextActive]}>Öğün</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'workout' && styles.typeBtnActive]}
          onPress={() => setType('workout')}
          activeOpacity={0.8}
        >
          <Text style={styles.typeEmoji}>💪</Text>
          <Text style={[styles.typeText, type === 'workout' && styles.typeTextActive]}>Spor</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'text' && styles.typeBtnActive]}
          onPress={() => { setType('text'); setMedia(null); }}
          activeOpacity={0.8}
        >
          <Text style={styles.typeEmoji}>💭</Text>
          <Text style={[styles.typeText, type === 'text' && styles.typeTextActive]}>Düşüncelerim</Text>
        </TouchableOpacity>
      </View>

      {/* Medya Alanı — yazı tipinde gizlenir */}
      {type !== 'text' && <Text style={styles.sectionLabel}>Medya</Text>}
      {type !== 'text' && media ? (
        <View style={styles.previewWrapper}>
          <Image source={{ uri: media.uri }} style={styles.preview} resizeMode="cover" />
          {media.isVideo && (
            <View style={styles.videoOverlay}>
              <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
            </View>
          )}
          <TouchableOpacity style={styles.removeMedia} onPress={() => setMedia(null)}>
            <Ionicons name="close-circle" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : type !== 'text' ? (
        <View style={styles.mediaRow}>
          <TouchableOpacity style={styles.mediaBtn} onPress={pickPhoto} activeOpacity={0.8}>
            <Ionicons name="image-outline" size={28} color={GREEN} />
            <Text style={styles.mediaBtnText}>Fotoğraf</Text>
          </TouchableOpacity>
          <View style={styles.mediaDivider} />
          <TouchableOpacity style={styles.mediaBtn} onPress={pickVideo} activeOpacity={0.8}>
            <Ionicons name="videocam-outline" size={28} color={GREEN} />
            <Text style={styles.mediaBtnText}>Video</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Açıklama */}
      <Text style={styles.sectionLabel}>Açıklama</Text>
      <TextInput
        style={styles.input}
        placeholder={type === 'text' ? 'Bugün ne düşünüyorsun?' : 'Ne paylaşmak istersin?'}
        placeholderTextColor="#9CA3AF"
        value={caption}
        onChangeText={setCaption}
        multiline
      />

      {/* Paylaş Butonu */}
      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={submit}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Paylaş</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 48 },

  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 10, marginTop: 4,
  },

  // Öğün / Spor
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 2, borderColor: 'transparent',
  },
  typeBtnActive: {
    backgroundColor: GREEN_XL,
    borderColor: GREEN,
  },
  typeEmoji: { fontSize: 20 },
  typeText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  typeTextActive: { color: GREEN },

  // Medya
  mediaRow: {
    flexDirection: 'row', height: 130, borderRadius: 14,
    backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB',
    borderStyle: 'dashed', overflow: 'hidden', marginBottom: 24,
  },
  mediaBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  mediaBtnText: { fontSize: 13, fontWeight: '600', color: GREEN },
  mediaDivider: { width: 1, backgroundColor: '#E5E7EB', marginVertical: 24 },

  previewWrapper: { position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: 24 },
  preview: { width: '100%', height: 260, borderRadius: 14 },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  removeMedia: {
    position: 'absolute', top: 10, right: 10,
  },

  // Açıklama
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14,
    padding: 14, minHeight: 100, fontSize: 15, color: '#111827',
    textAlignVertical: 'top', marginBottom: 28,
    backgroundColor: '#FAFAFA',
  },

  // Buton
  submitBtn: {
    backgroundColor: GREEN, paddingVertical: 16, borderRadius: 14, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
