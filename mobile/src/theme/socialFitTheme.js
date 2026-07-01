// socialFitTheme.js
// SocialFit redesign tasarım token'ları.
// Konum önerisi: src/theme/socialFitTheme.js
// Kullanım:  import { colors, radius, font, shadow } from '../../theme/socialFitTheme';

export const colors = {
  // Marka
  primary:      '#157A52',  // emerald — ana yeşil
  primaryDark:  '#0E5538',  // koyu yeşil (gradient ucu)
  primaryTint:  '#7AC79B',  // açık yeşil (gradient / vurgu)
  mint:         '#E4F3EA',  // nane yüzey
  mintSoft:     '#F0F8F3',  // çok açık nane (seçili satır)

  // Vurgu
  coral:        '#F4734A',  // streak & ikincil CTA
  coralDark:    '#E0552F',
  coralTint:    '#FFEDE6',
  amber:        '#F2A93B',  // yıldız puanı
  amberDark:    '#C8881A',
  amberTint:    '#FEF3DC',
  blue:         '#2A6FDB',  // blog kategorisi

  // Nötr
  ink:          '#11231B',  // başlık metni
  text:         '#374151',  // gövde metni
  muted:        '#5A6B62',  // ikincil metin
  faint:        '#93A299',  // soluk metin / ikon
  bg:           '#F4F7F2',  // ekran arka planı
  surface:      '#FFFFFF',  // kart
  border:       '#E6EBE5',  // ince çizgi
  divider:      '#EEF2EC',

  // Durum
  online:       '#34C759',
  like:         '#F0476A',
  white:        '#FFFFFF',
};

export const radius = {
  chip: 13,
  field: 16,
  pill: 18,
  card: 24,
  sheet: 28,
  phone: 46,
  full: 999,
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };

// expo-font ile yüklenecek aileler (aşağıdaki nota bak)
export const font = {
  // Başlıklar, sayılar, rozet/etiketler
  display:    'Outfit_700Bold',
  displayBold:'Outfit_800ExtraBold',
  // Arayüz / gövde
  body:       'PlusJakartaSans_500Medium',
  bodyBold:   'PlusJakartaSans_700Bold',
};

// iOS gölge + Android elevation birlikte
export const shadow = {
  card: {
    shadowColor: '#113C28',
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  soft: {
    shadowColor: '#113C28',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cta: {
    shadowColor: '#157A52',
    shadowOpacity: 0.3,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
};

// Avatar'lar için döngüsel renk paleti (ada göre stabil seç)
export const avatarPalette = ['#FF9D6E', '#6FA8DC', '#E5A3C0', '#86C5A3', '#F2A93B', '#9F8AE0'];

export function avatarColor(seed = '') {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return avatarPalette[h % avatarPalette.length];
}

export function getInitials(name) {
  if (!name?.trim()) return '?';
  const p = name.trim().split(/\s+/);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

/*
  FONT KURULUMU (App.js içinde bir kere):

  import { useFonts as useOutfit, Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
  import { PlusJakartaSans_500Medium, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';

  const [loaded] = useFonts({
    Outfit_700Bold, Outfit_800ExtraBold,
    PlusJakartaSans_500Medium, PlusJakartaSans_700Bold,
  });
  if (!loaded) return null; // veya splash

  Kurulum:
  npx expo install @expo-google-fonts/outfit @expo-google-fonts/plus-jakarta-sans expo-font expo-linear-gradient
*/
