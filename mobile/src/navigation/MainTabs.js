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
import MoreScreen from '../screens/main/MoreScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import BlogsScreen from '../screens/main/BlogsScreen';
import BlogDetailScreen from '../screens/main/BlogDetailScreen';
import CoachesScreen from '../screens/main/CoachesScreen';
import CoachBookingScreen from '../screens/main/CoachBookingScreen';
import FoodLogScreen from '../screens/foodlog/FoodLogScreen';
import AddFoodScreen from '../screens/foodlog/AddFoodScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MoreStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MoreMenu" component={MoreScreen} options={{ title: 'Daha Fazla', headerShown: false }} />
      <Stack.Screen
        name="Blogs"
        component={BlogsScreen}
        options={({ navigation }) => ({
          title: 'Bloglar',
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="leaf" size={22} color="#2d6a4f" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>Social Fit</Text>
            </View>
          ),
          headerTitleAlign: 'left',
        })}
      />
      <Stack.Screen name="BlogDetail" component={BlogDetailScreen} options={{ title: 'Yazı' }} />
      <Stack.Screen name="Tools" component={ToolsScreen} options={{ title: 'Araçlar' }} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'Lider Tablosu' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ayarlar' }} />
      <Stack.Screen name="Coaches" component={CoachesScreen} options={{ title: 'Diyetisyenimle Görüş' }} />
      <Stack.Screen name="CoachBooking" component={CoachBookingScreen} options={{ title: 'Randevu Al' }} />
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
    <Stack.Navigator>
      <Stack.Screen
        name="FeedList"
        component={FeedScreen}
        options={({ navigation }) => ({
          headerTitle: 'Akış',
          headerTitleAlign: 'left',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.getParent()?.navigate('More', { screen: 'Leaderboard' })}
              style={{ marginLeft: 16 }}
            >
              <Ionicons name="trophy" size={24} color="#2d6a4f" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <TouchableOpacity
                onPress={() => { setUnreadCount(0); navigation.navigate('Notifications'); }}
                style={{ marginRight: 8, padding: 4 }}
              >
                <View>
                  <Ionicons name="notifications-outline" size={24} color="#2d6a4f" />
                  {unreadCount > 0 && (
                    <View style={{
                      position: 'absolute', top: -4, right: -4,
                      minWidth: 16, height: 16, borderRadius: 8,
                      backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center',
                      paddingHorizontal: 3,
                    }}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.getParent()?.navigate('More', { screen: 'MoreMenu' })}
                style={{ padding: 4 }}
              >
                <Ionicons name="menu" size={24} color="#2d6a4f" />
              </TouchableOpacity>
            </View>
          ),
        })}
      />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Bildirimler' }} />
      <Stack.Screen name="Comments" component={CommentScreen} options={{ title: 'Yorumlar' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Profil' }} />
    </Stack.Navigator>
  );
}

function CreateStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={({ navigation }) => ({
          title: 'Paylaş',
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Feed')} style={{ marginLeft: 16 }}>
              <Ionicons name="arrow-back" size={24} color="#2d6a4f" />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
}

function GroupsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="GroupsList"
        component={GroupsScreen}
        options={({ navigation }) => ({ title: 'Gruplar', headerRight: () => (
          <TouchableOpacity onPress={() => navigation.navigate('CreateGroup')} style={{ marginRight: 16 }}>
            <Ionicons name="add" size={24} color="#2d6a4f" />
          </TouchableOpacity>
        ) })}
      />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'Grup Oluştur' }} />
      <Stack.Screen name="GroupFeed" component={GroupFeedScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditGroup" component={EditGroupScreen} options={{ title: 'Grubu Düzenle' }} />
    </Stack.Navigator>
  );
}

function MessagesStack() {
  return (
    <Stack.Navigator>
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
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={({ navigation }) => ({
          title: 'Profil',
          headerRight: () => (
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={{ marginRight: 16 }}>
              <Ionicons name="pencil" size={22} color="#2d6a4f" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Profili Düzenle' }} />
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
            const icons = { Feed: 'home', Create: 'add', Messages: 'chatbubbles', Profile: 'person', Groups: 'people', More: 'ellipsis-horizontal' };
            if (route.name === 'Create') return null;
            return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2d6a4f',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
          tabBarLabelStyle: { fontSize: 12 },
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
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#2d6a4f', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="add" size={32} color="#fff" />
                </View>
              </TouchableOpacity>
            ),
          }}
        />
        <Tab.Screen name="Messages" component={MessagesStack} options={{ title: 'Mesajlar', headerShown: false }} />
        <Tab.Screen name="Profile" component={ProfileStack} options={{ title: 'Profil', headerShown: false }} />
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
              <View style={[fabStyles.menuIcon, { backgroundColor: '#2d6a4f18' }]}>
                <Ionicons name="camera-outline" size={22} color="#2d6a4f" />
              </View>
              <Text style={fabStyles.menuText}>Gönderi Paylaş</Text>
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
