import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function EditProfileScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const api = useApi();
  const profile = user?.profile || {};
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [weightKg, setWeightKg] = useState(profile.weightKg != null ? String(profile.weightKg) : '');
  const [heightCm, setHeightCm] = useState(profile.heightCm != null ? String(profile.heightCm) : '');
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState(profile.dailyCalorieGoal != null ? String(profile.dailyCalorieGoal) : '');
  const [goalNote, setGoalNote] = useState(profile.goalNote ?? '');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const body = {
        displayName: displayName.trim() || profile.displayName,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
        dailyCalorieGoal: dailyCalorieGoal ? parseInt(dailyCalorieGoal, 10) : undefined,
        goalNote: goalNote.trim() || undefined,
      };
      await api.patch('/api/users/me', body);
      await refreshUser();
      navigation.goBack();
    } catch (e) {
      Alert.alert('Hata', e.message || 'Kaydedilemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Görünen ad" value={displayName} onChangeText={setDisplayName} />
      <TextInput style={[styles.input, styles.inputMultiline]} placeholder="Hedefler (her satıra bir hedef)" value={goalNote} onChangeText={setGoalNote} multiline numberOfLines={3} />
      <TextInput style={styles.input} placeholder="Kilo (kg)" value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" />
      <TextInput style={styles.input} placeholder="Boy (cm)" value={heightCm} onChangeText={setHeightCm} keyboardType="decimal-pad" />
      <TextInput style={styles.input} placeholder="Günlük kalori hedefi" value={dailyCalorieGoal} onChangeText={setDailyCalorieGoal} keyboardType="number-pad" />
      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={submit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  button: { backgroundColor: '#2d6a4f', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
