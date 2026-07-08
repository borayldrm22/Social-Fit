import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { ROUTINE_TEMPLATES } from '../../onboarding/constants';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useOnboardingTheme } from '../../components/onboarding/onboardingStyles';

export default function OnboardingRoutines({ navigation }) {
  const { c } = useOnboardingTheme();
  const savedRoutines = useOnboardingStore((s) => s.routines);
  const setRoutines = useOnboardingStore((s) => s.setRoutines);
  const [selected, setSelected] = useState(Array.isArray(savedRoutines) ? savedRoutines : []);
  const [customText, setCustomText] = useState('');

  const isSelected = (id) => selected.some((r) => r.templateId === id);

  const toggleTemplate = (tpl) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelected((prev) =>
      isSelected(tpl.id)
        ? prev.filter((r) => r.templateId !== tpl.id)
        : [...prev, { templateId: tpl.id, title: tpl.title, icon: tpl.icon, target: tpl.target, unit: tpl.unit, frequency: 'daily' }]
    );
  };

  const addCustom = () => {
    const t = customText.trim();
    if (!t) return;
    setSelected((prev) => [...prev, { title: t, icon: '⭐', target: 1, unit: '', frequency: 'daily', custom: true }]);
    setCustomText('');
  };

  const removeCustom = (idx) => setSelected((prev) => prev.filter((_, i) => i !== idx));

  const onNext = () => {
    setRoutines(selected);
    navigation.navigate('OnboardingChallenge');
  };

  const targetLabel = (r) => (r.target > 1 ? `${r.target} ${r.unit || ''}`.trim() : null);

  return (
    <OnboardingLayout
      navigation={navigation}
      routeName="OnboardingRoutines"
      title="Hedef rutinlerin 🎯"
      subtitle="Sadece diyet değil — küçük günlük alışkanlıklar seç. İstediğini ekleyebilirsin."
      onNext={onNext}
      nextLabel="Devam →"
    >
      {ROUTINE_TEMPLATES.map((tpl) => {
        const on = isSelected(tpl.id);
        return (
          <TouchableOpacity
            key={tpl.id}
            style={[styles.card, { borderColor: on ? '#157A52' : c.border, backgroundColor: on ? '#F0FDF4' : c.inputBg }]}
            onPress={() => toggleTemplate(tpl)}
            activeOpacity={0.85}
          >
            <Text style={styles.icon}>{tpl.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: c.text }]}>{tpl.title}</Text>
              {targetLabel(tpl) ? <Text style={[styles.sub, { color: c.textSecondary }]}>Günde {targetLabel(tpl)}</Text> : null}
            </View>
            <Ionicons
              name={on ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={on ? '#157A52' : c.border}
            />
          </TouchableOpacity>
        );
      })}

      {/* Özel eklenenler */}
      {selected.filter((r) => r.custom).map((r, i) => {
        const realIdx = selected.indexOf(r);
        return (
          <View key={`c-${i}`} style={[styles.card, { borderColor: '#157A52', backgroundColor: '#F0FDF4' }]}>
            <Text style={styles.icon}>⭐</Text>
            <Text style={[styles.title, { flex: 1, color: c.text }]}>{r.title}</Text>
            <TouchableOpacity onPress={() => removeCustom(realIdx)} hitSlop={8}>
              <Ionicons name="close-circle" size={22} color="#DC2626" />
            </TouchableOpacity>
          </View>
        );
      })}

      {/* Özel rutin ekle */}
      <View style={[styles.addRow, { borderColor: c.border, backgroundColor: c.inputBg }]}>
        <Ionicons name="add" size={20} color={c.textSecondary} />
        <TextInput
          style={[styles.addInput, { color: c.text }]}
          placeholder="Kendi rutinini yaz…"
          placeholderTextColor="#94a3b8"
          value={customText}
          onChangeText={setCustomText}
          onSubmitEditing={addCustom}
          returnKeyType="done"
        />
        {customText.trim() ? (
          <TouchableOpacity onPress={addCustom} hitSlop={8}>
            <Text style={styles.addBtn}>Ekle</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={{ height: 24 }} />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 10,
  },
  icon: { fontSize: 22 },
  title: { fontSize: 15.5, fontWeight: '600' },
  sub: { fontSize: 12.5, marginTop: 2 },
  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, marginTop: 4,
  },
  addInput: { flex: 1, fontSize: 15, paddingVertical: 13 },
  addBtn: { color: '#157A52', fontWeight: '700', fontSize: 14 },
});
