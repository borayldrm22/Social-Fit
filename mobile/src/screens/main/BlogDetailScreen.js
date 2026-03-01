import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBlogById, getBlogImage } from './BlogsScreen';

export default function BlogDetailScreen({ route }) {
  const { blogId, item: paramItem } = route.params || {};
  const item = paramItem || getBlogById(blogId);

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Blog not found.</Text>
      </View>
    );
  }

  const imageSource = getBlogImage(item);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {imageSource ? (
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="newspaper-outline" size={48} color="#9ca3af" />
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.paragraph}>{item.body}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  content: { paddingBottom: 24 },
  image: { width: '100%', height: 220, backgroundColor: '#e5e7eb' },
  imagePlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: { padding: 16, backgroundColor: '#fff', marginTop: 8 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d6a4f',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  empty: { textAlign: 'center', padding: 24, color: '#6b7280', fontSize: 16 },
});
