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
import { useHeaderHeight } from '@react-navigation/elements';
import * as ImagePicker from 'expo-image-picker';
import { useApi, uploadFormData } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useStarReward } from '../../context/StarRewardContext';
import { compressImage } from '../../utils/image';
import { colors, font, radius, spacing } from '../../theme/socialFitTheme';

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Kahvaltı', icon: 'sunny-outline' },
  { key: 'lunch', label: 'Öğle', icon: 'restaurant-outline' },
  { key: 'dinner', label: 'Akşam', icon: 'moon-outline' },
  { key: 'snack', label: 'Atıştırma', icon: 'cafe-outline' },
];
const PORTION_OPTIONS = [1, 2, 3, 4];

function showToast(msg) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert('', msg);
  }
}

function parseNumericInput(value) {
  if (value == null) return null;
  const normalized = String(value).replace(',', '.').trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumeric(value, fractionDigits = 1) {
  if (value == null) return '';
  const rounded = Number(value.toFixed(fractionDigits));
  return String(rounded);
}

function formatCalories(value) {
  if (value == null) return '';
  return String(Math.round(value));
}

export default function AddFoodScreen({ navigation, route }) {
  const api = useApi();
  const { token } = useAuth();
  const { celebrate } = useStarReward();
  const headerHeight = useHeaderHeight();
  const passedDate = route.params?.date;
  const passedMealType = route.params?.mealType;

  // Search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Form
  const [mealType, setMealType] = useState(passedMealType || 'lunch');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [note, setNote] = useState('');
  const [portionMultiplier, setPortionMultiplier] = useState(1);
  const [baseNutrition, setBaseNutrition] = useState({
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
  });
  const [imageUri, setImageUri] = useState(null);
  const [saving, setSaving] = useState(false);

  const canSave = foodName.trim().length > 0 && calories.length > 0 && !isNaN(Number(calories));

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setSearching(false);
      setSearchError('');
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (!cancelled) {
        setSearching(true);
        setSearchError('');
      }
      try {
        const res = await api.get(`/api/foodlog/search?q=${encodeURIComponent(query)}`);
        if (!cancelled) setResults(Array.isArray(res) ? res : []);
      } catch {
        if (!cancelled) {
          setResults([]);
          setSearchError('Arama su an kullanilamiyor, lutfen tekrar dene.');
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, api]);

  const selectFood = (food) => {
    const nextBase = {
      calories: parseNumericInput(food.calories) ?? 0,
      protein: parseNumericInput(food.protein),
      carbs: parseNumericInput(food.carbs),
      fat: parseNumericInput(food.fat),
    };
    setBaseNutrition(nextBase);
    setPortionMultiplier(1);
    setFoodName(food.name);
    setCalories(formatCalories(nextBase.calories));
    setProtein(formatNumeric(nextBase.protein));
    setCarbs(formatNumeric(nextBase.carbs));
    setFat(formatNumeric(nextBase.fat));
    setQuery('');
    setResults([]);
  };

  const setFieldAndBase = (field, text, setter) => {
    setter(text);
    const parsed = parseNumericInput(text);
    setBaseNutrition((prev) => ({
      ...prev,
      [field]: parsed == null ? null : parsed / portionMultiplier,
    }));
  };

  const applyMultiplier = (nextMultiplier) => {
    const safe = Math.min(20, Math.max(1, Math.round(nextMultiplier)));
    setPortionMultiplier(safe);
    setCalories(baseNutrition.calories == null ? '' : formatCalories(baseNutrition.calories * safe));
    setProtein(baseNutrition.protein == null ? '' : formatNumeric(baseNutrition.protein * safe));
    setCarbs(baseNutrition.carbs == null ? '' : formatNumeric(baseNutrition.carbs * safe));
    setFat(baseNutrition.fat == null ? '' : formatNumeric(baseNutrition.fat * safe));
  };

  const buildPayload = (dateStr) => {
    const payload = {
      date: dateStr,
      mealType,
      foodName: foodName.trim(),
      calories: parseInt(calories, 10),
      protein: protein ? parseFloat(String(protein).replace(',', '.')) : undefined,
      carbs: carbs ? parseFloat(String(carbs).replace(',', '.')) : undefined,
      fat: fat ? parseFloat(String(fat).replace(',', '.')) : undefined,
      note: undefined,
    };
    const servingTag = `Adet: ${portionMultiplier} [serving:${portionMultiplier}]`;
    const cleanNote = note.trim();
    payload.note = cleanNote ? `${cleanNote}\n${servingTag}` : servingTag;
    return payload;
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
    if (!result.canceled) {
      const a = result.assets[0];
      setImageUri(await compressImage(a.uri, { width: a.width }));
    }
  };

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const today = new Date();
      const dateStr = passedDate || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const payload = buildPayload(dateStr);
      let res;

      if (imageUri) {
        const formData = new FormData();
        formData.append('date', payload.date);
        formData.append('mealType', payload.mealType);
        formData.append('foodName', payload.foodName);
        formData.append('calories', String(payload.calories));
        if (payload.protein != null) formData.append('protein', String(payload.protein));
        if (payload.carbs != null) formData.append('carbs', String(payload.carbs));
        if (payload.fat != null) formData.append('fat', String(payload.fat));
        if (payload.note) formData.append('note', payload.note);
        const name = imageUri.split('/').pop() || 'photo.jpg';
        formData.append('image', { uri: imageUri, name, type: 'image/jpeg' });
        res = await uploadFormData('/api/foodlog', formData, token);
      } else {
        res = await api.post('/api/foodlog', payload);
      }

      navigation.goBack();

      // Günün ilk aktivitesiyse yıldız kutlaması (global overlay)
      if (res?.awarded > 0) {
        setTimeout(() => celebrate({ points: res.awarded, bonus: res.bonus || 0 }), 350);
      }
    } catch {
      showToast('Kaydedilemedi, tekrar deneyin');
    } finally {
      setSaving(false);
    }
  };

  const showSearch = query.length >= 2;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={headerHeight}>
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
              <Ionicons name={mt.icon} size={15} color={mealType === mt.key ? colors.white : colors.muted} />
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
            <Ionicons name="search" size={18} color={colors.faint} style={{ marginRight: spacing.sm }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Yemek ara..."
              placeholderTextColor={colors.faint}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
                <Ionicons name="close-circle" size={18} color={colors.faint} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.barcodeBtn}
            onPress={() => showToast('Yakında eklenecek')}
            activeOpacity={0.7}
          >
            <Ionicons name="barcode-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Search results ── */}
        {showSearch && (
          <View style={styles.resultsBox}>
            {searching && (
              <View style={styles.resultStatus}>
                <Ionicons name="hourglass-outline" size={14} color={colors.faint} />
                <Text style={styles.resultStatusText}>Aranıyor...</Text>
              </View>
            )}
            {!searching && results.length === 0 && (
              <View style={styles.resultStatus}>
                <Text style={styles.resultStatusText}>{searchError || 'Sonuç bulunamadı'}</Text>
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
          <Text style={styles.inputLabel}>Adet</Text>
          <View style={styles.portionRow}>
            <TouchableOpacity
              style={styles.portionIconBtn}
              onPress={() => applyMultiplier(portionMultiplier - 1)}
              activeOpacity={0.75}
            >
              <Ionicons name="remove" size={18} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.portionText}>{portionMultiplier} adet</Text>
            <TouchableOpacity
              style={styles.portionIconBtn}
              onPress={() => applyMultiplier(portionMultiplier + 1)}
              activeOpacity={0.75}
            >
              <Ionicons name="add" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.portionChips}>
            {PORTION_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.portionChip, portionMultiplier === opt && styles.portionChipActive]}
                onPress={() => applyMultiplier(opt)}
                activeOpacity={0.75}
              >
                <Text style={[styles.portionChipText, portionMultiplier === opt && styles.portionChipTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Yemek adı *</Text>
          <TextInput
            style={styles.input}
            placeholder="ör. Tavuk göğsü"
            placeholderTextColor={colors.faint}
            value={foodName}
            onChangeText={setFoodName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Kalori *</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={colors.faint}
            value={calories}
            onChangeText={(t) => setFieldAndBase('calories', t, setCalories)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.macroRow}>
          <View style={styles.macroCol}>
            <Text style={styles.inputLabel}>Protein (g)</Text>
            <TextInput style={styles.input} placeholder="0" placeholderTextColor={colors.faint} value={protein} onChangeText={(t) => setFieldAndBase('protein', t, setProtein)} keyboardType="numeric" />
          </View>
          <View style={styles.macroCol}>
            <Text style={styles.inputLabel}>Karbonhidrat (g)</Text>
            <TextInput style={styles.input} placeholder="0" placeholderTextColor={colors.faint} value={carbs} onChangeText={(t) => setFieldAndBase('carbs', t, setCarbs)} keyboardType="numeric" />
          </View>
          <View style={styles.macroCol}>
            <Text style={styles.inputLabel}>Yağ (g)</Text>
            <TextInput style={styles.input} placeholder="0" placeholderTextColor={colors.faint} value={fat} onChangeText={(t) => setFieldAndBase('fat', t, setFat)} keyboardType="numeric" />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Not</Text>
          <TextInput
            style={[styles.input, { minHeight: 64, textAlignVertical: 'top' }]}
            placeholder="İsteğe bağlı not..."
            placeholderTextColor={colors.faint}
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
                <Ionicons name="close-circle" size={24} color={colors.like} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={28} color={colors.faint} />
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
          <Ionicons name="checkmark-circle" size={20} color={colors.white} style={{ marginRight: spacing.sm }} />
          <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, padding: spacing.lg },

  // Meal pills
  mealRow: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  mealBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm + 2, borderRadius: radius.field - 6, backgroundColor: colors.bg },
  mealBtnActive: { backgroundColor: colors.primary },
  mealBtnText: { fontSize: 12, color: colors.muted, marginLeft: 5, fontFamily: font.body },
  mealBtnTextActive: { color: colors.white, fontFamily: font.bodyBold },

  // Section
  sectionTitle: { fontSize: 12, fontFamily: font.bodyBold, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.sm },

  // Search
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: radius.field - 6, paddingHorizontal: spacing.md, height: 44 },
  searchInput: { flex: 1, fontSize: 15, color: colors.ink, fontFamily: font.body },
  barcodeBtn: { width: 44, height: 44, borderRadius: radius.field - 6, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },

  // Results
  resultsBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.field - 4, marginTop: 6, overflow: 'hidden' },
  resultStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 6 },
  resultStatusText: { color: colors.faint, fontSize: 13, fontFamily: font.body },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.divider },
  resultName: { fontSize: 14, fontFamily: font.bodyBold, color: colors.ink },
  resultMacro: { fontSize: 11, color: colors.faint, marginTop: 2, fontFamily: font.body },
  calBadge: { backgroundColor: colors.mint, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 8 },
  calBadgeText: { fontSize: 12, fontFamily: font.bodyBold, color: colors.primary },
  addBadge: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  addBadgeText: { color: colors.white, fontSize: 12, fontFamily: font.bodyBold },

  // Form
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 12, color: colors.muted, marginBottom: 5, fontFamily: font.bodyBold },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.field - 6, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: colors.ink, backgroundColor: colors.bg, fontFamily: font.body },
  portionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  portionIconBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.mint, borderWidth: 1, borderColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  portionText: { fontSize: 16, fontFamily: font.displayBold, color: colors.primary, minWidth: 78, textAlign: 'center' },
  portionChips: { flexDirection: 'row', gap: 8, marginTop: 10 },
  portionChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  portionChipActive: { borderColor: colors.primary, backgroundColor: colors.mint },
  portionChipText: { fontSize: 12, color: colors.muted, fontFamily: font.bodyBold },
  portionChipTextActive: { color: colors.primary },
  macroRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  macroCol: { flex: 1 },

  // Image
  imageBox: { marginBottom: 20, borderRadius: 12, overflow: 'hidden' },
  imagePreview: { width: '100%', height: 180, borderRadius: 12, backgroundColor: colors.bg },
  imageRemove: { position: 'absolute', top: 8, right: 8 },
  imagePlaceholder: { height: 80, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8, backgroundColor: colors.bg },
  imagePlaceholderText: { fontSize: 14, color: colors.faint, fontFamily: font.bodyBold },

  // Save
  saveBtn: { backgroundColor: colors.primary, paddingVertical: 15, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { color: colors.white, fontFamily: font.bodyBold, fontSize: 16 },
});
