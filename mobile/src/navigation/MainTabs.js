import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useApi } from '../api/client';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import OnboardingNavigator from '../screens/onboarding/OnboardingNavigator';
import { OnboardingExitProvider } from '../context/OnboardingExitContext';
import { DEFAULT_FIRST_SHARE_CAPTION } from '../onboarding/constants';
import { FIRST_SHARE_KEY } from '../onboarding/submitOnboarding';
import FeedScreen from '../screens/main/FeedScreen';
import GroupsScreen from '../screens/main/GroupsScreen';
import MessagesScreen from '../screens/main/MessagesScreen';
import ChatScreen from '../screens/main/ChatScreen';
import SearchUsersScreen from '../screens/main/SearchUsersScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import ToolsScreen from '../screens/main/ToolsScreen';
import LeaderboardScreen from '../screens/main/LeaderboardScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import GroupFeedScreen from '../screens/main/GroupFeedScreen';
import CreateGroupScreen from '../screens/main/CreateGroupScreen';
import EditGroupScreen from '../screens/main/EditGroupScreen';
import CreatePostScreen from '../screens/main/CreatePostScreen';
import CommentScreen from '../screens/main/CommentScreen';
import UserProfileScreen from '../screens/main/UserProfileScreen';
import FollowListScreen from '../screens/main/FollowListScreen';
import MoreScreen from '../screens/main/MoreScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import BlogsScreen from '../screens/main/BlogsScreen';
import BlogDetailScreen from '../screens/main/BlogDetailScreen';
import CoachesScreen from '../screens/main/CoachesScreen';
import CoachBookingScreen from '../screens/main/CoachBookingScreen';
import FoodLogScreen from '../screens/foodlog/FoodLogScreen';
import AddFoodScreen from '../screens/foodlog/AddFoodScreen';
import NutritionScreen from '../screens/main/NutritionScreen';
import RecipesScreen from '../screens/main/RecipesScreen';
import GroupDiscoverScreen from '../screens/main/GroupDiscoverScreen';
import GroupMapScreen from '../screens/main/GroupMapScreen';
import RecipeDetailScreen from '../screens/main/RecipeDetailScreen';
import BlogScreen from '../screens/main/BlogScreen';
import SavedPostsScreen from '../screens/main/SavedPostsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerBackTitleVisible: false, headerBackTitle: '' }}>
      <Stack.Screen name="MoreMenu" component={MoreScreen} options={{ title: 'Daha Fazla', headerShown: false }} />
      <Stack.Screen
        name="Blogs"
        component={BlogsScreen}
        options={({ navigation }) => ({
          title: 'Bloglar',
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="leaf" size={22} color="#157A52" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>Social Fit</Text>
            </View>
          ),
          headerTitleAlign: 'left',
        })}
      />
      <Stack.Screen name="BlogDetail" component={BlogDetailScreen} options={{ title: 'Yazı' }} />
      <Stack.Screen name="Tools" component={ToolsScreen} options={{ title: 'Araçlar' }} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ayarlar' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Bildirimler' }} />
      <Stack.Screen name="SavedPosts" component={SavedPostsScreen} options={{ title: 'Kaydettiklerim' }} />
      <Stack.Screen name="Comments" component={CommentScreen} options={{ title: 'Yorumlar' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Profil' }} />
      <Stack.Screen name="Coaches" component={CoachesScreen} options={{ title: 'Diyetisyenimle Görüş' }} />
      <Stack.Screen name="CoachBooking" component={CoachBookingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="FoodLog" component={FoodLogScreen} options={{ title: 'Yemek Günlüğü' }} />
      <Stack.Screen name="AddFood" component={AddFoodScreen} options={{ title: 'Yemek Ekle' }} />
    </Stack.Navigator>
  );
}

function FeedStack() {
  const api = useApi();
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      api.get('/api/notifications/unread-count')
        .then((d) => setUnreadCount(d.count || 0))
        .catch(() => {});
    }, [api])
  );

  return (
    <Stack.Navigator screenOptions={{ headerBackTitleVisible: false, headerBackTitle: '' }}>
      <Stack.Screen
        name="FeedList"
        component={FeedScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Bildirimler' }} />
      <Stack.Screen name="Comments" component={CommentScreen} options={{ title: 'Yorumlar' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Profil' }} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CoachBooking" component={CoachBookingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BlogDetail2" component={BlogDetailScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function CreateStack() {
  return (
    <Stack.Navigator screenOptions={{ headerBackTitleVisible: false, headerBackTitle: '' }}>
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={({ navigation }) => ({
          title: 'Paylaş',
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Feed')} style={{ marginLeft: 16 }}>
              <Ionicons name="arrow-back" size={24} color="#157A52" />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
}

function GroupsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerBackTitleVisible: false, headerBackTitle: '' }}>
      <Stack.Screen
        name="GroupsList"
        component={GroupsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'Grup Oluştur' }} />
      <Stack.Screen name="GroupDiscover" component={GroupDiscoverScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GroupMap" component={GroupMapScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GroupFeed" component={GroupFeedScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditGroup" component={EditGroupScreen} options={{ title: 'Grubu Düzenle' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Profil' }} />
    </Stack.Navigator>
  );
}

function NutritionStack() {
  return (
    <Stack.Navigator screenOptions={{ headerBackTitleVisible: false, headerBackTitle: '' }}>
      <Stack.Screen name="NutritionMain" component={NutritionScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Tools" component={ToolsScreen} options={{ title: 'Sağlık Hesaplayıcıları' }} />
      <Stack.Screen name="Recipes" component={RecipesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="FoodLog" component={FoodLogScreen} options={{ title: 'Yemek Günlüğü' }} />
      <Stack.Screen name="AddFood" component={AddFoodScreen} options={{ title: 'Yemek Ekle' }} />
    </Stack.Navigator>
  );
}

function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerBackTitleVisible: false, headerBackTitle: '' }}>
      <Stack.Screen
        name="Conversations"
        component={MessagesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="SearchUsers" component={SearchUsersScreen} options={{ title: 'Kullanıcı ara' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function OnboardingModalScreen({ navigation }) {
  const { refreshUser } = useAuth();
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', () => {
      refreshUser();
    });
    return unsub;
  }, [navigation, refreshUser]);
  return (
    <OnboardingExitProvider dismissParentOnComplete>
      <OnboardingNavigator />
    </OnboardingExitProvider>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerBackTitleVisible: false, headerBackTitle: '' }}>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Profili Düzenle' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ayarlar' }} />
      <Stack.Screen name="FollowList" component={FollowListScreen} options={({ route }) => ({ title: route.params?.type === 'following' ? 'Takip Edilenler' : 'Takipçiler' })} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Profil' }} />
      <Stack.Screen
        name="OnboardingModal"
        component={OnboardingModalScreen}
        options={{ presentation: 'modal', title: 'Profili tamamla', headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function MainTabs() {
  const [fabMenuVisible, setFabMenuVisible] = useState(false);
  const [firstShareOpen, setFirstShareOpen] = useState(false);
  const [shareDraft, setShareDraft] = useState(DEFAULT_FIRST_SHARE_CAPTION);
  const navRef = useRef(null);
  const { token } = useAuth();
  const api = useApi();
  const [msgUnread, setMsgUnread] = useState(0);

  // Okunmamış mesaj sayısını periyodik çek → Messages tab badge'i
  useEffect(() => {
    if (!token) { setMsgUnread(0); return; }
    let active = true;
    const poll = () => api.get('/api/messages/unread-count')
      .then((r) => { if (active) setMsgUnread(Number(r?.count) || 0); })
      .catch(() => {});
    poll();
    const id = setInterval(poll, 15000);
    return () => { active = false; clearInterval(id); };
  }, [api, token]);

  useEffect(() => {
    if (!token) return;
    AsyncStorage.getItem(FIRST_SHARE_KEY).then((v) => {
      if (v === 'true') {
        setShareDraft(DEFAULT_FIRST_SHARE_CAPTION);
        setFirstShareOpen(true);
      }
    });
  }, [token]);

  const dismissFirstShare = () => {
    AsyncStorage.removeItem(FIRST_SHARE_KEY).catch(() => {});
    setFirstShareOpen(false);
  };

  const openCreateWithCaption = () => {
    const caption = shareDraft.trim() || DEFAULT_FIRST_SHARE_CAPTION;
    navRef.current?.navigate('Create', { screen: 'CreatePost', params: { prefillCaption: caption } });
    dismissFirstShare();
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            const icons = { Feed: 'home', Nutrition: 'restaurant', Create: 'add', Groups: 'people', Profile: 'person', Messages: 'chatbubbles', More: 'ellipsis-horizontal' };
            if (route.name === 'Create') return null;
            return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#157A52',
          tabBarInactiveTintColor: '#93A299',
          tabBarStyle: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E6EBE5' },
          tabBarShowLabel: false,
        })}
      >
        <Tab.Screen
          name="Feed"
          component={FeedStack}
          options={{ title: 'Akış', headerShown: false }}
          listeners={({ navigation }) => {
            navRef.current = navigation;
            return {};
          }}
        />
        <Tab.Screen name="Groups" component={GroupsStack} options={{ title: 'Gruplar', headerShown: false }} />
        <Tab.Screen
          name="Create"
          component={CreateStack}
          options={{
            title: 'Paylaş',
            headerShown: false,
            tabBarIcon: () => null,
            tabBarLabel: () => null,
            tabBarButton: () => (
              <TouchableOpacity
                onPress={() => setFabMenuVisible(true)}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 8 }}
                activeOpacity={0.8}
              >
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#157A52', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="add" size={32} color="#fff" />
                </View>
              </TouchableOpacity>
            ),
          }}
        />
        <Tab.Screen name="Messages" component={MessagesStack} options={{ title: 'Mesajlar', headerShown: false, tabBarBadge: msgUnread > 0 ? msgUnread : undefined }} />
        <Tab.Screen name="Profile" component={ProfileStack} options={{ title: 'Profil', headerShown: false }} />
        <Tab.Screen name="Nutrition" component={NutritionStack} options={{ title: 'Beslenme', headerShown: false, tabBarButton: () => null }} />
        <Tab.Screen name="More" component={MoreStack} options={{ title: 'Daha Fazla', tabBarButton: () => null }} />
      </Tab.Navigator>

      <Modal visible={firstShareOpen} transparent animationType="slide" onRequestClose={dismissFirstShare}>
        <Pressable style={firstShareStyles.backdrop} onPress={dismissFirstShare}>
          <Pressable style={firstShareStyles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={firstShareStyles.sheetTitle}>İlk paylaşımını yap ve bonus puan kazan! 🎁</Text>
            <TextInput
              style={firstShareStyles.input}
              multiline
              value={shareDraft}
              onChangeText={setShareDraft}
              placeholder="Mesajın..."
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity style={firstShareStyles.primaryBtn} onPress={openCreateWithCaption}>
              <Text style={firstShareStyles.primaryBtnText}>Paylaş</Text>
            </TouchableOpacity>
            <TouchableOpacity style={firstShareStyles.secondaryBtn} onPress={dismissFirstShare}>
              <Text style={firstShareStyles.secondaryBtnText}>Daha sonra</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={fabMenuVisible} transparent animationType="fade" onRequestClose={() => setFabMenuVisible(false)}>
        <Pressable style={fabStyles.overlay} onPress={() => setFabMenuVisible(false)}>
          <View style={fabStyles.menu}>
            <TouchableOpacity
              style={fabStyles.menuItem}
              onPress={() => {
                setFabMenuVisible(false);
                navRef.current?.navigate('Create', { screen: 'CreatePost' });
              }}
            >
              <View style={[fabStyles.menuIcon, { backgroundColor: '#157A5218' }]}>
                <Ionicons name="camera-outline" size={22} color="#157A52" />
              </View>
              <Text style={fabStyles.menuText}>Gönderi Paylaş</Text>
            </TouchableOpacity>
            <View style={fabStyles.divider} />
            <TouchableOpacity
              style={fabStyles.menuItem}
              onPress={() => {
                setFabMenuVisible(false);
                navRef.current?.navigate('Nutrition');
              }}
            >
              <View style={[fabStyles.menuIcon, { backgroundColor: '#F59E0B18' }]}>
                <Ionicons name="restaurant-outline" size={22} color="#F59E0B" />
              </View>
              <Text style={fabStyles.menuText}>Bugün Yediklerim</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const firstShareStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn: { paddingVertical: 12, alignItems: 'center' },
  secondaryBtnText: { color: '#6b7280', fontWeight: '600', fontSize: 15 },
});

const fabStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 100 },
  menu: { backgroundColor: '#fff', borderRadius: 16, width: 220, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  menuIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuText: { fontSize: 15, fontWeight: '600', color: '#111827' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 },
});
