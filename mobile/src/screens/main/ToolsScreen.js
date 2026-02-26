import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useApi } from '../../api/client';

export default function ToolsScreen() {
  const api = useApi();
  const [bmiResult, setBmiResult] = useState(null);
  const [calorieResult, setCalorieResult] = useState(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [activity, setActivity] = useState('moderate');

  const calcBmi = async () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || !h) return;
    try {
      const data = await api.post('/api/tools/bmi', { weightKg: w, heightCm: h });
      setBmiResult(data);
    } catch (e) {
      setBmiResult({ error: e.message });
    }
  };

  const calcCalorie = async () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age, 10);
    if (!w || !h || !a) return;
    try {
      const data = await api.post('/api/tools/calorie', {
        weightKg: w,
        heightCm: h,
        age: a,
        gender,
        activityLevel: activity,
      });
      setCalorieResult(data);
    } catch (e) {
      setCalorieResult({ error: e.message });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>BKİ Hesaplama</Text>
      <TextInput style={styles.input} placeholder="Kilo (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
      <TextInput style={styles.input} placeholder="Boy (cm)" value={height} onChangeText={setHeight} keyboardType="decimal-pad" />
      <TouchableOpacity style={styles.button} onPress={calcBmi}>
        <Text style={styles.buttonText}>Hesapla</Text>
      </TouchableOpacity>
      {bmiResult && (
        <View style={styles.result}>
          {bmiResult.error ? (
            <Text style={styles.error}>{bmiResult.error}</Text>
          ) : (
            <>
              <Text>BKİ: {bmiResult.bmi}</Text>
              <Text>Kategori: {bmiResult.category === 'underweight' ? 'Zayıf' : bmiResult.category === 'normal' ? 'Normal' : bmiResult.category === 'overweight' ? 'Fazla kilolu' : 'Obez'}</Text>
            </>
          )}
        </View>
      )}

      <Text style={[styles.title, { marginTop: 24 }]}>Günlük Kalori İhtiyacı</Text>
      <TextInput style={styles.input} placeholder="Yaş" value={age} onChangeText={setAge} keyboardType="number-pad" />
      <View style={styles.row}>
        <TouchableOpacity style={[styles.toggle, gender === 'male' && styles.toggleActive]} onPress={() => setGender('male')}>
          <Text style={gender === 'male' ? styles.toggleTextActive : styles.toggleText}>Erkek</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggle, gender === 'female' && styles.toggleActive]} onPress={() => setGender('female')}>
          <Text style={gender === 'female' ? styles.toggleTextActive : styles.toggleText}>Kadın</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.label}>Aktivite: </Text>
      {['sedentary', 'light', 'moderate', 'active', 'very_active'].map((a) => (
        <TouchableOpacity key={a} style={[styles.toggle, activity === a && styles.toggleActive]} onPress={() => setActivity(a)}>
          <Text style={activity === a ? styles.toggleTextActive : styles.toggleText}>
            {a === 'sedentary' ? 'Hareketsiz' : a === 'light' ? 'Hafif' : a === 'moderate' ? 'Orta' : a === 'active' ? 'Aktif' : 'Çok aktif'}
          </Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.button} onPress={calcCalorie}>
        <Text style={styles.buttonText}>Kalori Hesapla</Text>
      </TouchableOpacity>
      {calorieResult && (
        <View style={styles.result}>
          {calorieResult.error ? (
            <Text style={styles.error}>{calorieResult.error}</Text>
          ) : (
            <>
              <Text>BMR: {calorieResult.bmr} kcal</Text>
              <Text>Günlük kalori: {calorieResult.dailyCalorie} kcal</Text>
            </>
          )}
        </View>
      )}
      <Text style={styles.disclaimer}>Beslenme önerileri doktor/diyetisyen onayı ile kullanılmalıdır.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 },
  row: { flexDirection: 'row', marginBottom: 12 },
  toggle: { padding: 10, marginRight: 8, borderRadius: 8, backgroundColor: '#f0f0f0' },
  toggleActive: { backgroundColor: '#2d6a4f' },
  toggleText: { color: '#333' },
  toggleTextActive: { color: '#fff', fontWeight: '600' },
  label: { marginBottom: 8 },
  button: { backgroundColor: '#2d6a4f', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  result: { marginTop: 12, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 8 },
  error: { color: '#c00' },
  disclaimer: { marginTop: 24, fontSize: 12, color: '#666' },
});
