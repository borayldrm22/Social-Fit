import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const KVKK_TEXT = `Bu uygulama kapsamında toplanan sağlık ve beslenme verileriniz (kilo, boy, kalori hedefi, hedef notları) 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında "özel nitelikli kişisel veri" sayılmaktadır. Bu verilerin işlenmesi için açık rızanız gerekmektedir. Verileriniz yalnızca size özel diyet ve beslenme önerileri sunmak amacıyla kullanılacaktır. Beslenme önerileri doktor onayıyla değerlendirilmelidir.`;

export default function EditProfileScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const api = useApi();
  const profile = user?.profile || {};
  const hasKvkkConsent = !!profile.kvkkConsentAt;
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [weightKg, setWeightKg] = useState(profile.weightKg != null ? String(profile.weightKg) : '');
  const [heightCm, setHeightCm] = useState(profile.heightCm != null ? String(profile.heightCm) : '');
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState(profile.dailyCalorieGoal != null ? String(profile.dailyCalorieGoal) : '');
  const [goalNote, setGoalNote] = useState(profile.goalNote ?? '');
  const [isPublic, setIsPublic] = useState(profile.isPublic !== false); // default true
  const [loading, setLoading] = useState(false);
  const [showKvkkModal, setShowKvkkModal] = useState(false);

  const hasHealthData = () =>
    (weightKg && parseFloat(weightKg) > 0) ||
    (heightCm && parseFloat(heightCm) > 0) ||
    (dailyCalorieGoal && parseInt(dailyCalorieGoal, 10) > 0) ||
    (goalNote && goalNote.trim().length > 0);

  const doSubmit = async (withConsent = false) => {
    setLoading(true);
    try {
      const body = {
        displayName: displayName.trim() || profile.displayName,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
        dailyCalorieGoal: dailyCalorieGoal ? parseInt(dailyCalorieGoal, 10) : undefined,
        goalNote: goalNote.trim() || undefined,
        isPublic,
      };
      if (withConsent) body.kvkkConsent = true;
      await api.patch('/api/users/me', body);
      await refreshUser();
      setShowKvkkModal(false);
      navigation.goBack();
    } catch (e) {
      if (e.message && e.message.includes('KVKK') && !withConsent) {
        setShowKvkkModal(true);
      } else {
        Alert.alert('Hata', e.message || 'Kaydedilemedi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (hasHealthData() && !hasKvkkConsent) {
      setShowKvkkModal(true);
      return;
    }
    await doSubmit(false);
  };

  const acceptKvkkAndSubmit = () => {
    doSubmit(true);
  };

  const needsOnboarding = profile.onboardingCompleted === false;

  return (
    <View style={styles.container}>
      {needsOnboarding && (
        <View style={styles.onboardingBanner}>
          <Text style={styles.onboardingBannerText}>Profilinizi tamamlayın</Text>
          <TouchableOpacity
            style={styles.onboardingBannerButton}
            onPress={() => navigation.navigate('OnboardingModal')}
            activeOpacity={0.8}
          >
            <Text style={styles.onboardingBannerButtonText}>Tamamla</Text>
          </TouchableOpacity>
        </View>
      )}
      <TextInput style={styles.input} placeholder="Görünen ad" value={displayName} onChangeText={setDisplayName} />
      <TextInput style={[styles.input, styles.inputMultiline]} placeholder="Biyografi — kendinden bahset" value={goalNote} onChangeText={setGoalNote} multiline numberOfLines={3} />
      <TextInput style={styles.input} placeholder="Kilo (kg)" value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" />
      <TextInput style={styles.input} placeholder="Boy (cm)" value={heightCm} onChangeText={setHeightCm} keyboardType="decimal-pad" />
      <TextInput style={styles.input} placeholder="Günlük kalori hedefi" value={dailyCalorieGoal} onChangeText={setDailyCalorieGoal} keyboardType="number-pad" />

      {/* Profil Gizliliği */}
      <View style={styles.privacyRow}>
        <View style={styles.privacyLeft}>
          <Ionicons
            name={isPublic ? 'globe-outline' : 'lock-closed-outline'}
            size={20}
            color={isPublic ? '#2d6a4f' : '#6B7280'}
          />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.privacyLabel}>{isPublic ? 'Herkese Açık' : 'Gizli Profil'}</Text>
            <Text style={styles.privacyDesc}>
              {isPublic
                ? 'Gönderileriniz Keşfet\'te görünür'
                : 'Gönderileriniz yalnızca takipçilere görünür'}
            </Text>
          </View>
        </View>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          trackColor={{ false: '#D1D5DB', true: '#86efac' }}
          thumbColor={isPublic ? '#2d6a4f' : '#9CA3AF'}
        />
      </View>

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={submit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</Text>
      </TouchableOpacity>

      <Modal visible={showKvkkModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>KVKK Aydınlatma Metni</Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalBody}>{KVKK_TEXT}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={acceptKvkkAndSubmit} disabled={loading}>
              <Text style={styles.modalButtonText}>Kabul ediyorum</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowKvkkModal(false)} disabled={loading}>
              <Text style={styles.modalCancelText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  onboardingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fef3c7',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  onboardingBannerText: { fontSize: 15, fontWeight: '600', color: '#92400e' },
  onboardingBannerButton: {
    backgroundColor: '#2d6a4f',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  onboardingBannerButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 },
  privacyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, padding: 14, marginBottom: 16,
  },
  privacyLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  privacyLabel: { fontSize: 15, fontWeight: '600', color: '#111827' },
  privacyDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  button: { backgroundColor: '#2d6a4f', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalBox: { backgroundColor: '#fff', borderRadius: 12, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  modalScroll: { maxHeight: 280, marginBottom: 16 },
  modalBody: { fontSize: 14, color: '#374151', lineHeight: 22 },
  modalButton: { backgroundColor: '#2d6a4f', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  modalButtonText: { color: '#fff', fontWeight: '600' },
  modalCancel: { alignItems: 'center', padding: 8 },
  modalCancelText: { color: '#6b7280', fontSize: 15 },
});
