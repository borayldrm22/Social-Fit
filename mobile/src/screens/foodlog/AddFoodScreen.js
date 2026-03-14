import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ToastAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApi, uploadFormData } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Kahvaltı', icon: 'sunny-outline' },
  { key: 'lunch', label: 'Öğle', icon: 'restaurant-outline' },
  { key: 'dinner', label: 'Akşam', icon: 'moon-outline' },
  { key: 'snack', label: 'Atıştırma', icon: 'cafe-outline' },
];

function showToast(msg) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert('', msg);
  }
}

export default function AddFoodScreen({ navigation, route }) {
  const api = useApi();
  const { token } = useAuth();
  const passedDate = route.params?.date;
  const passedMealType = route.params?.mealType;

  // Search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Form
  const [mealType, setMealType] = useState(passedMealType || 'lunch');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [note, setNote] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [saving, setSaving] = useState(false);

  const canSave = foodName.trim().length > 0 && calories.length > 0 && !isNaN(Number(calories));

  // Debounced search
  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/api/foodlog/search?q=${encodeURIComponent(query)}`);
        setResults(res);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const selectFood = (food) => {
    setFoodName(food.name);
    setCalories(String(food.calories));
    setProtein(food.protein != null ? String(food.protein) : '');
    setCarbs(food.carbs != null ? String(food.carbs) : '');
    setFat(food.fat != null ? String(food.fat) : '');
    setQuery('');
    setResults([]);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin gerekli', 'Galeri erişimi için izin verin.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const today = new Date();
      const dateStr = passedDate || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      if (imageUri) {
        const formData = new FormData();
        formData.append('date', dateStr);
        formData.append('mealType', mealType);
        formData.append('foodName', foodName.trim());
        formData.append('calories', String(parseInt(calories, 10)));
        if (protein) formData.append('protein', String(parseFloat(protein)));
        if (carbs) formData.append('carbs', String(parseFloat(carbs)));
        if (fat) formData.append('fat', String(parseFloat(fat)));
        if (note.trim()) formData.append('note', note.trim());
        const name = imageUri.split('/').pop() || 'photo.jpg';
        formData.append('image', { uri: imageUri, name, type: 'image/jpeg' });
        await uploadFormData('/api/foodlog', formData, token);
      } else {
        await api.post('/api/foodlog', {
          date: dateStr,
          mealType,
          foodName: foodName.trim(),
          calories: parseInt(calories, 10),
          protein: protein ? parseFloat(protein) : undefined,
          carbs: carbs ? parseFloat(carbs) : undefined,
          fat: fat ? parseFloat(fat) : undefined,
          note: note.trim() || undefined,
        });
      }

      navigation.goBack();
    } catch {
      showToast('Kaydedilemedi, tekrar deneyin');
    } finally {
      setSaving(false);
    }
  };

  const showSearch = query.length >= 2;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Meal type pills ── */}
        <View style={styles.mealRow}>
          {MEAL_TYPES.map((mt) => (
            <TouchableOpacity
              key={mt.key}
              style={[styles.mealBtn, mealType === mt.key && styles.mealBtnActive]}
              onPress={() => setMealType(mt.key)}
              activeOpacity={0.75}
            >
              <Ionicons name={mt.icon} size={15} color={mealType === mt.key ? '#fff' : '#6b7280'} />
              <Text style={[styles.mealBtnText, mealType === mt.key && styles.mealBtnTextActive]}>
                {mt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Search bar + barcode ── */}
        <Text style={styles.sectionTitle}>Yemek Ara</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Yemek ara..."
              placeholderTextColor="#9ca3af"
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.barcodeBtn}
            onPress={() => showToast('Yakında eklenecek')}
            activeOpacity={0.7}
          >
            <Ionicons name="barcode-outline" size={22} color="#2d6a4f" />
          </TouchableOpacity>
        </View>

        {/* ── Search results ── */}
        {showSearch && (
          <View style={styles.resultsBox}>
            {searching && (
              <View style={styles.resultStatus}>
                <Ionicons name="hourglass-outline" size={14} color="#9ca3af" />
                <Text style={styles.resultStatusText}>Aranıyor...</Text>
              </View>
            )}
            {!searching && results.length === 0 && (
              <View style={styles.resultStatus}>
                <Text style={styles.resultStatusText}>Sonuç bulunamadı</Text>
              </View>
            )}
            {results.map((food, idx) => (
              <TouchableOpacity key={idx} style={styles.resultRow} onPress={() => selectFood(food)} activeOpacity={0.6}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultName}>{food.name}</Text>
                  <Text style={styles.resultMacro}>
                    P: {food.protein}g{'  '}K: {food.carbs}g{'  '}Y: {food.fat}g
                  </Text>
                </View>
                <View style={styles.calBadge}>
                  <Text style={styles.calBadgeText}>{food.calories} kal</Text>
                </View>
                <TouchableOpacity style={styles.addBadge} onPress={() => selectFood(food)}>
                  <Text style={styles.addBadgeText}>Ekle</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Form ── */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Detaylar</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Yemek adı *</Text>
          <TextInput
            style={styles.input}
            placeholder="ör. Tavuk göğsü"
            placeholderTextColor="#c5c7cc"
            value={foodName}
            onChangeText={setFoodName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Kalori *</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor="#c5c7cc"
            value={calories}
            onChangeText={setCalories}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.macroRow}>
          <View style={styles.macroCol}>
            <Text style={styles.inputLabel}>Protein (g)</Text>
            <TextInput style={styles.input} placeholder="0" placeholderTextColor="#c5c7cc" value={protein} onChangeText={setProtein} keyboardType="numeric" />
          </View>
          <View style={styles.macroCol}>
            <Text style={styles.inputLabel}>Karbonhidrat (g)</Text>
            <TextInput style={styles.input} placeholder="0" placeholderTextColor="#c5c7cc" value={carbs} onChangeText={setCarbs} keyboardType="numeric" />
          </View>
          <View style={styles.macroCol}>
            <Text style={styles.inputLabel}>Yağ (g)</Text>
            <TextInput style={styles.input} placeholder="0" placeholderTextColor="#c5c7cc" value={fat} onChangeText={setFat} keyboardType="numeric" />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Not</Text>
          <TextInput
            style={[styles.input, { minHeight: 64, textAlignVertical: 'top' }]}
            placeholder="İsteğe bağlı not..."
            placeholderTextColor="#c5c7cc"
            value={note}
            onChangeText={setNote}
            multiline
          />
        </View>

        {/* ── Image picker ── */}
        <TouchableOpacity style={styles.imageBox} onPress={pickImage} activeOpacity={0.7}>
          {imageUri ? (
            <View style={{ width: '100%' }}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.imageRemove} onPress={() => setImageUri(null)}>
                <Ionicons name="close-circle" size={24} color="#e63946" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={28} color="#9ca3af" />
              <Text style={styles.imagePlaceholderText}>Fotoğraf ekle</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Save button ── */}
        <TouchableOpacity
          style={[styles.saveBtn, (!canSave || saving) && styles.saveBtnDisabled]}
          onPress={submit}
          disabled={!canSave || saving}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },

  // Meal pills
  mealRow: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  mealBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: '#f3f4f6' },
  mealBtnActive: { backgroundColor: '#2d6a4f' },
  mealBtnText: { fontSize: 12, color: '#6b7280', marginLeft: 5, fontWeight: '500' },
  mealBtnTextActive: { color: '#fff', fontWeight: '600' },

  // Section
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },

  // Search
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  barcodeBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },

  // Results
  resultsBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, marginTop: 6, overflow: 'hidden' },
  resultStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 6 },
  resultStatusText: { color: '#9ca3af', fontSize: 13 },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  resultName: { fontSize: 14, fontWeight: '500', color: '#111827' },
  resultMacro: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  calBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 8 },
  calBadgeText: { fontSize: 12, fontWeight: '600', color: '#2d6a4f' },
  addBadge: { backgroundColor: '#2d6a4f', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  addBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Form
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 12, color: '#6b7280', marginBottom: 5, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#111827', backgroundColor: '#fafafa' },
  macroRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  macroCol: { flex: 1 },

  // Image
  imageBox: { marginBottom: 20, borderRadius: 12, overflow: 'hidden' },
  imagePreview: { width: '100%', height: 180, borderRadius: 12, backgroundColor: '#f3f4f6' },
  imageRemove: { position: 'absolute', top: 8, right: 8 },
  imagePlaceholder: { height: 80, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8, backgroundColor: '#fafafa' },
  imagePlaceholderText: { fontSize: 14, color: '#9ca3af', fontWeight: '500' },

  // Save
  saveBtn: { backgroundColor: '#2d6a4f', paddingVertical: 15, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
