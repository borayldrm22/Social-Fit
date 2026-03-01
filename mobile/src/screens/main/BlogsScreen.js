import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Reuse Feed assets when available (same paths as FeedScreen.js)
const MOCK_BLOGS = [
  {
    id: '1',
    title: 'The Benefits of a Plant-Based Diet',
    description:
      'Discover how a plant-based diet can improve your health, boost energy, and promote weight loss. Click below to explore more about this lifestyle choice.',
    imageLocal: 'salad',
    body:
      'A plant-based diet focuses on foods primarily from plants. This includes not only fruits and vegetables, but also nuts, seeds, oils, whole grains, legumes, and beans. It doesn\'t mean that you are vegetarian or vegan and never eat meat or dairy. Rather, you are proportionately choosing more of your foods from plant sources.\n\nResearch shows that plant-based diets can help with weight management, reduce the risk of heart disease, and improve overall energy levels. Many people also report better digestion and clearer skin after making the switch.',
  },
  {
    id: '2',
    title: 'Superfoods You Should Include in Your Diet',
    description:
      'Learn about superfoods that can enhance your diet and improve overall wellness. From berries to nuts, find out what to add to your grocery list.',
    imageLocal: 'fruits',
    body:
      'Superfoods are nutrient-rich foods considered to be especially beneficial for health and well-being. Common superfoods include blueberries, kale, salmon, almonds, and quinoa.\n\nIncorporating a variety of these foods into your meals can provide antioxidants, healthy fats, and essential vitamins. They can support your immune system, improve heart health, and help maintain a healthy weight. Start by adding one or two to your weekly shopping list and gradually expand from there.',
  },
  {
    id: '3',
    title: 'Healthy Smoothie Recipes',
    description:
      'Boost your energy with these delicious and nutritious smoothie recipes. Perfect for breakfast or a post-workout snack.',
    imageLocal: 'smoothie',
    body:
      'Smoothies are a quick and easy way to pack nutrients into one drink. Start with a base of banana or avocado for creaminess, add your favorite fruits like berries or mango, and throw in some spinach or kale for extra vitamins.\n\nFor a protein boost after a workout, add Greek yogurt or a scoop of protein powder. You can also add chia seeds or flaxseed for omega-3s and fiber. Blend with milk or plant-based alternatives and enjoy immediately for the best taste and nutrition.',
  },
];

// Reuse Feed assets when available (same paths as FeedScreen.js)
const BLOG_IMAGES = {
  salad: require('../../../assets/smoothie-bowl.png'),
  fruits: require('../../../assets/chicken-rice-bowl.png'),
  smoothie: require('../../../assets/runner.png'),
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

  const filteredBlogs = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_BLOGS;
    const q = searchQuery.trim().toLowerCase();
    return MOCK_BLOGS.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

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
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDescription} numberOfLines={3}>
          {item.description}
        </Text>
        <TouchableOpacity
          style={styles.readMoreBtn}
          onPress={() => navigation.navigate('BlogDetail', { blogId: item.id, item })}
          activeOpacity={0.8}
        >
          <Text style={styles.readMoreText}>Read More</Text>
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
            placeholder="Search..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      <FlatList
        data={filteredBlogs}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.empty}>No blogs match your search.</Text>
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
    marginTop: 12,
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
