import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Kart metinleri için sınırlar — içerikler bu sınırları aşmayacak şekilde yazılır,
// böylece kartlar aynı yükseklikte durur ve açıklama yarıda "…" ile kesilmez.
export const BLOG_TITLE_MAX = 56;
export const BLOG_DESC_MAX = 120;

export const BLOG_CATEGORIES = ['Tümü', 'Beslenme', 'Tarifler', 'Spor', 'Etkinlikler'];

const MOCK_BLOGS = [
  {
    id: '1',
    category: 'Beslenme',
    title: 'Bitkisel Beslenmenin Faydaları',
    description:
      'Bitki ağırlıklı beslenme enerji verir, kalp sağlığını destekler ve kilo kontrolüne yardımcı olur.',
    imageLocal: 'bowl',
    body:
      'Bitkisel beslenme; sebze ve meyvelerin yanı sıra kuruyemiş, tohum, tam tahıl ve baklagilleri de kapsar. Tamamen vegan olmak zorunda değilsin — sadece tabağının çoğunu bitkisel kaynaklardan seçersin.\n\nAraştırmalar, bitki ağırlıklı beslenmenin kilo yönetimine yardımcı olduğunu, kalp hastalığı riskini azalttığını ve enerji seviyeni artırdığını gösteriyor.',
  },
  {
    id: '2',
    category: 'Beslenme',
    title: 'Diyetine Eklemen Gereken Süper Besinler',
    description:
      'Yaban mersini, ceviz, ıspanak… Antioksidan ve vitamin deposu besinlerle tabağını güçlendir.',
    imageLocal: 'smoothie',
    body:
      'Süper besinler, sağlığa faydası yüksek, besin değeri yoğun gıdalardır. Yaban mersini, lahana, somon, badem ve kinoa en bilinenleri.\n\nBunları öğünlerine eklemek antioksidan, sağlıklı yağ ve temel vitaminler sağlar. Haftalık alışveriş listene bir-iki tane ekleyerek başla, zamanla çeşitlendir.',
  },
  {
    id: '3',
    category: 'Tarifler',
    title: '5 Dakikada Sağlıklı Smoothie',
    description:
      'Muz, yaban mersini ve ıspanakla dakikalar içinde enerji dolu bir kahvaltı ya da ara öğün.',
    imageLocal: 'smoothie',
    body:
      'Smoothie, tek bardakta bol besin almanın hızlı yolu. Kıvam için muz veya avokadoyla başla, sevdiğin meyveleri ekle, biraz ıspanak at.\n\nAntrenman sonrası protein için yoğurt veya protein tozu ekleyebilirsin. Chia veya keten tohumu omega-3 ve lif katar. Süt ya da bitkisel alternatifle çırp ve hemen iç.',
  },
  {
    id: '4',
    category: 'Spor',
    title: 'Evde 20 Dakikalık HIIT Antrenmanı',
    description:
      'Ekipmansız, yüksek tempolu bu antrenmanla yağ yak ve dayanıklılığını artır.',
    imageLocal: 'runner',
    body:
      'HIIT, kısa yüksek tempolu hareketlerle kısa dinlenmeleri birleştirir. 20 dakikada, ekipman olmadan, evde yapabilirsin.\n\n40 saniye çalış, 20 saniye dinlen: jumping jack, squat, mountain climber ve plank döngüsünü tekrarla. Isınmayı ve soğumayı atlama.',
  },
  {
    id: '5',
    category: 'Spor',
    title: 'Yeni Başlayanlar için Koşu Rehberi',
    description:
      'Doğru tempo, nefes ve ısınma ile ilk 5K’na hazırlan; sakatlanmadan ilerle.',
    imageLocal: 'runner',
    body:
      'Koşuya yeni başlıyorsan yürü-koş yöntemiyle başla: 1 dakika koş, 2 dakika yürü. Zamanla koşu süresini artır.\n\nRahat konuşabildiğin bir tempo tut, her antrenman öncesi ısın ve sonrası esne. Haftada 3 gün, dinlenme günleriyle ilerle.',
  },
  {
    id: '6',
    category: 'Etkinlikler',
    title: '30 Günlük Su İçme Challenge’ı',
    description:
      'Toplulukla birlikte her gün su hedefini tuttur, streak’ini büyüt ve ödüller kazan.',
    imageLocal: 'bowl',
    body:
      'Yeterli su içmek enerji, cilt ve sindirim için kritik. Bu challenge’da 30 gün boyunca günlük su hedefini tutturuyorsun.\n\nHer tamamladığın gün streak’ini büyütür ve yıldız kazandırır. Topluluk kanalından ilerlemeni paylaş, birbirinizi motive edin.',
  },
];

// Yerel görsel havuzu (mevcut asset'ler yeniden kullanılır)
const BLOG_IMAGES = {
  bowl: require('../../../assets/chicken-rice-bowl.png'),
  smoothie: require('../../../assets/smoothie-bowl.png'),
  runner: require('../../../assets/runner.png'),
};

export function getBlogById(id) {
  return MOCK_BLOGS.find((b) => b.id === id) || null;
}

export function getBlogImage(item) {
  const key = item?.imageLocal;
  if (key && BLOG_IMAGES[key]) return BLOG_IMAGES[key];
  return null;
}

export default function BlogsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('Tümü');

  const filteredBlogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return MOCK_BLOGS.filter((b) => {
      const matchCat = category === 'Tümü' || b.category === category;
      const matchSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [searchQuery, category]);

  const renderCard = ({ item }) => {
    const imageSource = getBlogImage(item);
    return (
      <View style={styles.card}>
        {imageSource ? (
          <Image source={imageSource} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Ionicons name="newspaper-outline" size={48} color="#9ca3af" />
          </View>
        )}
        <View style={styles.catBadge}><Text style={styles.catBadgeText}>{item.category}</Text></View>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <TouchableOpacity
          style={styles.readMoreBtn}
          onPress={() => navigation.navigate('BlogDetail', { blogId: item.id, item })}
          activeOpacity={0.8}
        >
          <Text style={styles.readMoreText}>Devamını Oku</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Ara..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {BLOG_CATEGORIES.map((cat) => {
            const active = cat === category;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      <FlatList
        data={filteredBlogs}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.empty}>Bu kategoride yazı bulunamadı.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  searchRow: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 16, color: '#111827' },
  chipsRow: { gap: 8, paddingTop: 10, paddingRight: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: '#f3f4f6' },
  chipActive: { backgroundColor: '#2d6a4f' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  chipTextActive: { color: '#fff' },
  catBadge: { alignSelf: 'flex-start', marginHorizontal: 16, marginTop: 12, backgroundColor: '#D8F3DC', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  catBadgeText: { fontSize: 11, fontWeight: '700', color: '#2d6a4f' },
  listContent: { padding: 16, paddingBottom: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: { width: '100%', height: 200, backgroundColor: '#e5e7eb' },
  cardImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d6a4f',
    marginHorizontal: 16,
    marginTop: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#374151',
    marginHorizontal: 16,
    marginTop: 8,
    lineHeight: 20,
  },
  readMoreBtn: {
    backgroundColor: '#2d6a4f',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  readMoreText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  empty: { textAlign: 'center', padding: 24, color: '#6b7280', fontSize: 16 },
});
