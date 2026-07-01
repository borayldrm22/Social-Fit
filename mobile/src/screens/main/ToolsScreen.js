// ToolsScreen.js — SocialFit · Sağlık Hesaplayıcıları
// Konum: src/screens/main/ToolsScreen.js
// Tüm hesaplamalar client-side (anlık). Formüller: docs / SOCIAL FIT sağlıklı yaşam paketi.
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { colors, font, shadow } from '../../theme/socialFitTheme';

const ACT = {
  sedentary:  { label: 'Hareketsiz',  mult: 1.2,   water: 0,    protein: 0.8 },
  light:      { label: 'Hafif',       mult: 1.375, water: 300,  protein: 1.0 },
  moderate:   { label: 'Orta',        mult: 1.55,  water: 500,  protein: 1.4 },
  active:     { label: 'Çok aktif',   mult: 1.725, water: 1000, protein: 1.8 },
  very_active:{ label: 'Aşırı aktif', mult: 1.9,   water: 1000, protein: 2.0 },
};
const GOAL = {
  lose:     { label: 'Yağ yak',  cal: -500, pBump: 0.4 },
  maintain: { label: 'Koru',     cal: 0,    pBump: 0 },
  gain:     { label: 'Kas yap',  cal: 500,  pBump: 0.2 },
};
const DIET = {
  balanced: { label: 'Dengeli',    carb: 0.45, fat: 0.30 },
  lowcarb:  { label: 'Düşük Karb', carb: 0.25, fat: 0.35 },
  athlete:  { label: 'Sporcu',     carb: 0.55, fat: 0.25 },
  keto:     { label: 'Ketojenik',  carb: 0.10, fat: 0.65 },
};
const CLIMATE = {
  cool:   { label: 'Serin',       water: 0 },
  mild:   { label: 'Ilıman',      water: 200 },
  hot:    { label: 'Sıcak/Nemli', water: 500 },
  desert: { label: 'Çöl/Tropik',  water: 800 },
};
const SPECIAL = {
  none:     { label: 'Yok',     water: 0 },
  pregnant: { label: 'Hamile',  water: 400 },
  nursing:  { label: 'Emziren', water: 750 },
};
const opts = (obj) => Object.entries(obj).map(([key, v]) => ({ key, label: v.label }));

// ---- Pure hesaplamalar ----
function calcBMI(w, h) {
  if (!w || !h) return null;
  const m = h / 100;
  const bmi = w / (m * m);
  let cat, color;
  if (bmi < 18.5) { cat = 'Zayıf'; color = colors.blue; }
  else if (bmi < 25) { cat = 'Normal'; color = colors.primary; }
  else if (bmi < 30) { cat = 'Fazla kilolu'; color = colors.amber; }
  else if (bmi < 35) { cat = 'Obez (1° derece)'; color = colors.coral; }
  else if (bmi < 40) { cat = 'Obez (2° derece)'; color = colors.coral; }
  else { cat = 'Morbid obez'; color = colors.coralDark; }
  return { value: bmi.toFixed(1), cat, color };
}
function calcWHR(waist, hip, gender) {
  if (!waist || !hip) return null;
  const whr = waist / hip;
  const t = gender === 'female' ? [0.80, 0.85] : [0.95, 1.0];
  let cat, color;
  if (whr <= t[0]) { cat = 'Düşük risk'; color = colors.primary; }
  else if (whr <= t[1]) { cat = 'Orta risk'; color = colors.amber; }
  else { cat = 'Yüksek risk'; color = colors.coral; }
  return { value: whr.toFixed(2), cat, color };
}
function calcBF(gender, h, waist, neck, hip) {
  if (!h || !waist || !neck) return null;
  const log10 = (x) => Math.log10(x);
  let bf;
  if (gender === 'female') {
    if (!hip) return null;
    if (waist + hip - neck <= 0) return null;
    bf = 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(h)) - 450;
  } else {
    if (waist - neck <= 0) return null;
    bf = 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(h)) - 450;
  }
  if (!isFinite(bf) || bf <= 0) return null;
  const female = gender === 'female';
  let cat, color;
  const limits = female ? [14, 20, 24, 31] : [6, 13, 17, 24];
  if (bf < limits[0]) { cat = 'Çok düşük'; color = colors.blue; }
  else if (bf <= limits[1]) { cat = 'Atletik'; color = colors.primary; }
  else if (bf <= limits[2]) { cat = 'Fit'; color = colors.primary; }
  else if (bf <= limits[3]) { cat = 'Normal'; color = colors.amber; }
  else { cat = 'Fazla yağlı'; color = colors.coral; }
  return { value: bf.toFixed(1), cat, color };
}
function calcEnergy({ gender, w, h, age, activity, goal, diet, climate, special }) {
  if (!w || !h || !age) return null;
  const bmr = gender === 'male'
    ? 10 * w + 6.25 * h - 5 * age + 5
    : 10 * w + 6.25 * h - 5 * age - 161;
  const tdee = bmr * ACT[activity].mult;
  const targetCal = Math.max(0, Math.round(tdee + GOAL[goal].cal));
  const pCoeff = Math.min(2.4, ACT[activity].protein + GOAL[goal].pBump);
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCal,
    pCoeff: pCoeff.toFixed(1),
    protein: Math.round(w * pCoeff),
    carb: Math.round((targetCal * DIET[diet].carb) / 4),
    fat: Math.round((targetCal * DIET[diet].fat) / 9),
    water: Math.round(w * 33 + ACT[activity].water + CLIMATE[climate].water + SPECIAL[special].water),
  };
}

// ---- Sonuç yorumları (bilgilendirme amaçlı) ----
function bmiNote(cat) {
  if (cat === 'Normal') return 'Sağlıklı aralıktasın (18.5–24.9). Böyle devam!';
  if (cat === 'Zayıf') return 'Sağlıklı aralığın altındasın; dengeli ve yeterli beslenmeye özen göster.';
  return 'Sağlıklı aralık 18.5–24.9. Kalori dengesi ve düzenli hareket faydalı olabilir.';
}
function whrNote(gender, cat) {
  if (cat === 'Düşük risk') return 'Bel/kalça oranın sağlıklı aralıkta.';
  return (gender === 'female'
    ? 'Yağın karın bölgesinde (viseral) birikimine işaret eder; kalp-damar hastalıkları, hipertansiyon, insülin direnci ve hormonal dengesizlik (PCOS) riskini artırabilir.'
    : 'Yağın karın bölgesinde (viseral) birikimine işaret eder; kalp-damar hastalıkları, insülin direnci, karaciğer yağlanması ve testosteron düşüklüğü riskini artırabilir.')
    + ' Bel çevresini azaltmak bu riski düşürür.';
}
function bfNote(cat) {
  if (cat === 'Çok düşük') return 'Yağ oranın çok düşük; çok düşük seviyeler hormonal dengeyi etkileyebilir.';
  if (cat === 'Fazla yağlı') return 'Yağ oranını kademeli düşürmek metabolik sağlığa katkı sağlar.';
  return 'Yağ oranın sağlıklı bir aralıkta.';
}

// ---- Küçük bileşenler ----
function NumField({ label, value, onChangeText, placeholder, unit, kb = 'decimal-pad' }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.faint} keyboardType={kb} />
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
    </View>
  );
}
function Choice({ label, options, value, onChange }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chips}>
        {options.map((o) => (
          <TouchableOpacity key={o.key} style={[styles.chip, value === o.key && styles.chipOn]} onPress={() => onChange(o.key)} activeOpacity={0.8}>
            <Text style={[styles.chipText, value === o.key && styles.chipTextOn]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
function ResultRow({ title, value, unit, cat, color, sub }) {
  return (
    <View style={styles.resultRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.resultTitle}>{title}</Text>
        {sub ? <Text style={styles.resultSub}>{sub}</Text> : null}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.resultValue}>{value}{unit ? <Text style={styles.resultUnit}> {unit}</Text> : null}</Text>
        {cat ? <View style={styles.catPill}><Text style={[styles.catText, color && { color }]}>{cat}</Text></View> : null}
      </View>
    </View>
  );
}

export default function ToolsScreen() {
  const api = useApi();
  const { user, refreshUser } = useAuth();
  const prof = user?.profile || {};

  const [tab, setTab] = useState('health'); // 'health' | 'energy'
  const [gender, setGender] = useState(prof.gender === 'female' ? 'female' : 'male');
  const [age, setAge] = useState(prof.age ? String(prof.age) : '');
  const [height, setHeight] = useState(prof.heightCm ? String(prof.heightCm) : '');
  const [weight, setWeight] = useState(prof.weightKg ? String(prof.weightKg) : '');
  // Sağlık
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [neck, setNeck] = useState('');
  const [healthRes, setHealthRes] = useState(null);
  // Enerji
  const [activity, setActivity] = useState('moderate');
  const [goal, setGoal] = useState('maintain');
  const [diet, setDiet] = useState('balanced');
  const [climate, setClimate] = useState('mild');
  const [special, setSpecial] = useState('none');
  const [energyRes, setEnergyRes] = useState(null);
  const [applying, setApplying] = useState(false);

  const computeHealth = () => {
    const w = parseFloat(weight), h = parseFloat(height);
    const wa = parseFloat(waist), hp = parseFloat(hip), nk = parseFloat(neck);
    const res = { bmi: calcBMI(w, h), whr: calcWHR(wa, hp, gender), bf: calcBF(gender, h, wa, nk, hp) };
    if (!res.bmi && !res.whr && !res.bf) { Alert.alert('Eksik bilgi', 'En az boy ve kilo gir; WHR/Yağ oranı için bel, kalça ve boyun ölçüleri gerekir.'); return; }
    setHealthRes(res);
  };
  const computeEnergy = () => {
    const w = parseFloat(weight), h = parseFloat(height), a = parseInt(age, 10);
    const res = calcEnergy({ gender, w, h, age: a, activity, goal, diet, climate, special });
    if (!res) { Alert.alert('Eksik bilgi', 'Kalori için kilo, boy ve yaş gerekli.'); return; }
    setEnergyRes(res);
  };
  const applyCalorie = async () => {
    if (!energyRes) return;
    setApplying(true);
    try {
      await api.patch('/api/users/me', { dailyCalorieGoal: energyRes.targetCal });
      refreshUser && refreshUser();
      Alert.alert('Kaydedildi', `Günlük kalori hedefin ${energyRes.targetCal} kcal olarak ayarlandı. Beslenme ekranındaki hedefler buna göre güncellenir.`);
    } catch (e) {
      Alert.alert('Hata', 'Hedef kaydedilemedi, tekrar dene.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      {/* Sekme */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'health' && styles.tabOn]} onPress={() => setTab('health')} activeOpacity={0.8}>
          <Text style={[styles.tabText, tab === 'health' && styles.tabTextOn]}>Ne Kadar Sağlıklıyım</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'energy' && styles.tabOn]} onPress={() => setTab('energy')} activeOpacity={0.8}>
          <Text style={[styles.tabText, tab === 'energy' && styles.tabTextOn]}>Kalori & Makro</Text>
        </TouchableOpacity>
      </View>

      {/* Ortak girdiler */}
      <View style={styles.card}>
        <Choice label="Cinsiyet" options={[{ key: 'male', label: 'Erkek' }, { key: 'female', label: 'Kadın' }]} value={gender} onChange={setGender} />
        <View style={styles.row3}>
          <View style={{ flex: 1 }}><NumField label="Yaş" value={age} onChangeText={setAge} placeholder="28" kb="number-pad" /></View>
          <View style={{ flex: 1 }}><NumField label="Boy" value={height} onChangeText={setHeight} placeholder="175" unit="cm" /></View>
          <View style={{ flex: 1 }}><NumField label="Kilo" value={weight} onChangeText={setWeight} placeholder="72" unit="kg" /></View>
        </View>
      </View>

      {tab === 'health' ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Vücut Ölçüleri</Text>
            <View style={styles.row3}>
              <View style={{ flex: 1 }}><NumField label="Bel" value={waist} onChangeText={setWaist} placeholder="80" unit="cm" /></View>
              <View style={{ flex: 1 }}><NumField label="Kalça" value={hip} onChangeText={setHip} placeholder="95" unit="cm" /></View>
              <View style={{ flex: 1 }}><NumField label="Boyun" value={neck} onChangeText={setNeck} placeholder="38" unit="cm" /></View>
            </View>
            <Text style={styles.hint}>Bel: en ince yer · Kalça: en geniş yer · Boyun: ölçü vücut yağı için gerekli.</Text>
            <TouchableOpacity style={styles.cta} onPress={computeHealth} activeOpacity={0.85}>
              <Ionicons name="calculator-outline" size={18} color={colors.white} />
              <Text style={styles.ctaText}>Hesapla</Text>
            </TouchableOpacity>
          </View>

          {healthRes && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sonuçlar</Text>
              {healthRes.bmi ? (
                <>
                  <ResultRow title="Vücut Kitle Endeksi (BMI)" value={healthRes.bmi.value} cat={healthRes.bmi.cat} color={healthRes.bmi.color} />
                  <Text style={styles.note}>{bmiNote(healthRes.bmi.cat)}</Text>
                </>
              ) : <ResultRow title="BMI" value="—" sub="Boy ve kilo gerekli" />}
              {healthRes.whr ? (
                <>
                  <ResultRow title="Bel / Kalça Oranı (WHR)" value={healthRes.whr.value} cat={healthRes.whr.cat} color={healthRes.whr.color} />
                  <Text style={styles.note}>{whrNote(gender, healthRes.whr.cat)}</Text>
                </>
              ) : <ResultRow title="WHR" value="—" sub="Bel ve kalça gerekli" />}
              {healthRes.bf ? (
                <>
                  <ResultRow title="Vücut Yağ Oranı" value={healthRes.bf.value} unit="%" cat={healthRes.bf.cat} color={healthRes.bf.color} />
                  <Text style={styles.note}>{bfNote(healthRes.bf.cat)}</Text>
                </>
              ) : <ResultRow title="Vücut Yağ Oranı" value="—" sub={gender === 'female' ? 'Bel, kalça ve boyun gerekli' : 'Bel ve boyun gerekli'} />}
            </View>
          )}
        </>
      ) : (
        <>
          <View style={styles.card}>
            <Choice label="Aktivite düzeyi" options={opts(ACT)} value={activity} onChange={setActivity} />
            <Choice label="Hedef" options={opts(GOAL)} value={goal} onChange={setGoal} />
            <Choice label="Beslenme türü" options={opts(DIET)} value={diet} onChange={setDiet} />
            <Choice label="İklim" options={opts(CLIMATE)} value={climate} onChange={setClimate} />
            <Choice label="Özel durum" options={opts(SPECIAL)} value={special} onChange={setSpecial} />
            <TouchableOpacity style={styles.cta} onPress={computeEnergy} activeOpacity={0.85}>
              <Ionicons name="calculator-outline" size={18} color={colors.white} />
              <Text style={styles.ctaText}>Hesapla</Text>
            </TouchableOpacity>
          </View>

          {energyRes && (
            <View style={styles.card}>
              <View style={styles.calHero}>
                <Text style={styles.calHeroNum}>{energyRes.targetCal.toLocaleString('tr-TR')}</Text>
                <Text style={styles.calHeroLbl}>kcal / gün hedefin</Text>
                <Text style={styles.calHeroSub}>BMR {energyRes.bmr} · Aktiviteyle {energyRes.tdee} kcal</Text>
              </View>
              <ResultRow title="Protein" value={energyRes.protein} unit="g" sub={`${energyRes.pCoeff} g/kg`} />
              <ResultRow title="Karbonhidrat" value={energyRes.carb} unit="g" sub={`Kalorinin %${Math.round(DIET[diet].carb * 100)}`} />
              <ResultRow title="Yağ" value={energyRes.fat} unit="g" sub={`Kalorinin %${Math.round(DIET[diet].fat * 100)}`} />
              <ResultRow title="Su" value={(energyRes.water / 1000).toFixed(1)} unit="L" sub={`${energyRes.water} ml`} />

              <TouchableOpacity style={[styles.applyBtn, applying && { opacity: 0.6 }]} onPress={applyCalorie} disabled={applying} activeOpacity={0.85}>
                {applying ? <ActivityIndicator color={colors.primary} size="small" /> : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
                    <Text style={styles.applyText}>Kalori hedefimi uygula</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      <Text style={styles.disclaimer}>Sonuçlar yalnızca bilgilendirme ve öneri amaçlıdır; kişisel sağlık kararların için bir uzmana danış.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  tabs: { flexDirection: 'row', backgroundColor: '#E9EFE9', borderRadius: 14, padding: 4, marginBottom: 14 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10 },
  tabOn: { backgroundColor: colors.surface, ...shadow.soft },
  tabText: { fontFamily: font.bodyBold, fontSize: 13, color: '#8A988E' },
  tabTextOn: { color: colors.ink },
  card: { backgroundColor: colors.surface, borderRadius: 20, ...shadow.soft, padding: 16, marginBottom: 14 },
  cardTitle: { fontFamily: font.bodyBold, fontSize: 15, color: colors.ink, marginBottom: 12 },
  field: { marginBottom: 14 },
  fieldLabel: { fontFamily: font.bodyBold, fontSize: 12, color: colors.muted, marginBottom: 7 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12 },
  input: { flex: 1, paddingVertical: 11, fontSize: 15, color: colors.ink, fontFamily: font.body },
  unit: { fontSize: 13, color: colors.faint, fontFamily: font.bodyBold },
  row3: { flexDirection: 'row', gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: font.bodyBold, fontSize: 13, color: colors.text },
  chipTextOn: { color: colors.white },
  hint: { fontSize: 11, color: colors.faint, fontFamily: font.body, marginBottom: 12, lineHeight: 16 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, ...shadow.cta },
  ctaText: { color: colors.white, fontFamily: font.bodyBold, fontSize: 15 },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.divider },
  resultTitle: { fontFamily: font.bodyBold, fontSize: 14, color: colors.ink },
  resultSub: { fontSize: 11, color: colors.faint, fontFamily: font.body, marginTop: 2 },
  resultValue: { fontFamily: font.displayBold, fontSize: 20, color: colors.ink },
  resultUnit: { fontSize: 12, color: colors.faint, fontFamily: font.bodyBold },
  catPill: { backgroundColor: colors.bg, borderRadius: 9, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  catText: { fontSize: 11, fontFamily: font.bodyBold, color: colors.muted },
  note: { fontSize: 12, color: colors.muted, fontFamily: font.body, lineHeight: 17, paddingBottom: 10 },
  calHero: { alignItems: 'center', paddingBottom: 8 },
  calHeroNum: { fontFamily: font.displayBold, fontSize: 40, color: colors.primary, letterSpacing: -0.5 },
  calHeroLbl: { fontFamily: font.bodyBold, fontSize: 13, color: colors.ink, marginTop: -2 },
  calHeroSub: { fontSize: 12, color: colors.faint, fontFamily: font.body, marginTop: 4 },
  applyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.mint, borderRadius: 14, paddingVertical: 13, marginTop: 14 },
  applyText: { color: colors.primary, fontFamily: font.bodyBold, fontSize: 14 },
  disclaimer: { fontSize: 11, color: colors.faint, fontFamily: font.body, textAlign: 'center', lineHeight: 16, marginTop: 4 },
});
