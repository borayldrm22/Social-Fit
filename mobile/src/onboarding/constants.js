/** @type {const} */
export const GOAL_OPTIONS = [
  { id: 'lose_weight', label: 'Kilo vermek' },
  { id: 'gain_muscle', label: 'Kas kazanmak' },
  { id: 'maintain', label: 'Kilomu korumak' },
  { id: 'healthy_life', label: 'Daha sağlıklı yaşamak' },
  { id: 'energy', label: 'Enerjimi artırmak' },
  { id: 'eat_healthy', label: 'Sağlıklı beslenmek' },
  { id: 'stay_active', label: 'Aktif kalmak' },
  { id: 'look_fit', label: 'Daha fit görünmek' },
  { id: 'motivate', label: 'Motive olmak' },
];

export const CHALLENGE_OPTIONS = [
  { id: 'lack_knowledge', label: 'Bilgi eksikliği' },
  { id: 'lack_support', label: 'Destek eksikliği' },
  { id: 'meal_planning', label: 'Öğün planlama' },
  { id: 'health_issue', label: 'Sağlık / tıbbi sorun' },
  { id: 'no_time', label: 'Yeterli zaman olmaması' },
];

// Onboarding step 5 — hazır rutin şablonları (kullanıcı seçer + özel ekler)
export const ROUTINE_TEMPLATES = [
  { id: 'water', title: 'Su iç', icon: '💧', target: 8, unit: 'bardak' },
  { id: 'read', title: 'Kitap oku', icon: '📖', target: 10, unit: 'sayfa' },
  { id: 'steps', title: 'Yürü', icon: '👟', target: 8000, unit: 'adım' },
  { id: 'meditate', title: 'Meditasyon', icon: '🧘', target: 10, unit: 'dk' },
  { id: 'sleep', title: 'Erken uyu', icon: '😴', target: 1, unit: '' },
  { id: 'stretch', title: 'Esneme', icon: '🤸', target: 1, unit: '' },
];

export const TIMELINE_OPTIONS = [
  { id: '1-2', label: '1-2 ay' },
  { id: '3', label: '3 ay' },
  { id: '6', label: '6 ay' },
  { id: 'sustainable', label: 'Sürdürülebilir olması önemli' },
];

/** Maps to TDEE multipliers in calculations */
export const ACTIVITY_OPTIONS = [
  { id: 'sedentary', label: 'Hareketsiz yaşam / Masa başı', emoji: '🛋️' },
  { id: 'light', label: 'Hafif aktif / Haftada 1-3 gün egzersiz', emoji: '🚶' },
  { id: 'moderate', label: 'Orta aktif / Haftada 3-5 gün egzersiz', emoji: '🏃' },
  { id: 'active', label: 'Çok aktif / Haftada 6-7 gün egzersiz', emoji: '💪' },
  { id: 'veryActive', label: 'Profesyonel sporcu', emoji: '🏆' },
];

export const IDENTITY_OPTIONS = [
  { id: 'share', label: 'Başarımı diğer insanlarla paylaşmak istiyorum.' },
  { id: 'best_self', label: 'Kendimin en iyi versiyonu olmak istiyorum.' },
  { id: 'healthy', label: 'Sağlıklı bir hayat sürmek istiyorum.' },
  { id: 'energetic', label: 'Daha enerjik olmak istiyorum.' },
  { id: 'discipline', label: 'Disiplinli bir hayat istiyorum.' },
  { id: 'learn', label: 'Sağlıklı yaşama dair yeni bilgiler edinmek istiyorum.' },
  { id: 'active_life', label: 'Daha aktif bir hayat yaşamak istiyorum.' },
  { id: 'aging', label: 'Daha geç yaşlanmak istiyorum.' },
];

export const ONBOARDING_TOTAL_STEPS = 8;

// Sıra: Ad Soyad+username → Vücut/BMI → Aktivite → Hedef → Rutinler → Zorlanma → Sonuç → Kanal
export const ONBOARDING_ROUTE_STEP = {
  OnboardingWelcome: 1,
  OnboardingProfile: 2,
  OnboardingActivity: 3,
  OnboardingGoals: 4,
  OnboardingRoutines: 5,
  OnboardingChallenge: 6,
  OnboardingResult: 7,
  OnboardingSocial: 8,
};

export const DEFAULT_FIRST_SHARE_CAPTION =
  'Sağlıklı yaşam treninde sizlerin arasına katılmaktan çok mutluyum! Kendimin en iyi versiyonu olma yolculuğumu sizlerle paylaşacağım. 💪 #SocialFit';
