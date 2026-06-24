import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config';

const GREEN = '#2D6A4F';
const GREEN_XL = '#D8F3DC';
const ORANGE = '#F4845F';

const MENU_SECTIONS = [
  {
    title: 'Keşfet',
    items: [
      { label: 'Blog & Makaleler', icon: 'newspaper-outline', color: '#3B82F6', bg: '#DBEAFE', screen: 'Blogs' },
      { label: 'Kanallar & Gruplar', icon: 'people-outline', color: '#8B5CF6', bg: '#EDE9FE', screen: 'Groups', parent: true },
      { label: 'Lider Tablosu', icon: 'trophy-outline', color: '#F59E0B', bg: '#FEF3C7', screen: 'Leaderboard' },
    ],
  },
  {
    title: 'Araçlar',
    items: [
      { label: 'BKİ & Kalori Hesapla', icon: 'calculator-outline', color: GREEN, bg: GREEN_XL, screen: 'Tools' },
      { label: 'Koç & Diyetisyen Bul', icon: 'medkit-outline', color: ORANGE, bg: '#FDDDD5', screen: 'Coaches' },
    ],
  },
  {
    title: 'Hesap',
    items: [
      { label: 'Bildirimler', icon: 'notifications-outline', color: '#EF4444', bg: '#FEE2E2', screen: 'Notifications' },
      { label: 'Ayarlar', icon: 'settings-outline', color: '#6B7280', bg: '#F3F4F6', screen: 'Settings' },
    ],
  },
];

function avatarUri(profile) {
  const url = profile?.avatarUrl;
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

export default function MoreScreen({ navigation }) {
  const { user, logout } = useAuth();
  const profile = user?.profile || {};
  const displayName = profile.displayName || user?.email?.split('@')[0] || 'Kullanıcı';
  const uri = avatarUri(profile);

  const navigate = (item) => {
    if (item.parent) {
      navigation.getParent()?.navigate(item.screen);
    } else {
      navigation.navigate(item.screen);
    }
  };

  return (
    <View style={styles.root}>
      {/* ── Green Header ── */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          {uri ? (
            <Image source={{ uri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={styles.headerName}>{displayName}</Text>
            <Text style={styles.headerSub}>{user?.email || ''}</Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.getParent()?.navigate('Profile')}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={16} color={GREEN} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    idx < section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={() => navigate(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconWrap, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* ── Çıkış ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={ORANGE} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7FAF8' },

  // Header
  header: {
    backgroundColor: GREEN,
    paddingTop: 52, paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerInner: {
    flexDirection: 'row', alignItems: 'center',
  },
  avatar: {
    width: 54, height: 54, borderRadius: 27,
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarFallback: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerText: { flex: 1, marginLeft: 14 },
  headerName: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  editBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },

  // Section
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 10, marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 15,
  },
  menuItemBorder: {
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
    borderRadius: 16, borderWidth: 1.5, borderColor: '#FDDDD5',
    backgroundColor: '#fff',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: ORANGE },
});
