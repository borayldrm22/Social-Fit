import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { OnboardingProvider } from '../context/OnboardingContext';
import OnboardingNavigator from '../screens/onboarding/OnboardingNavigator';
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
import CreatePostScreen from '../screens/main/CreatePostScreen';
import CommentScreen from '../screens/main/CommentScreen';
import MoreScreen from '../screens/main/MoreScreen';
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
            <TouchableOpacity onPress={() => navigation.getParent()?.navigate('More')} style={{ marginRight: 16 }}>
              <Ionicons name="menu" size={24} color="#2d6a4f" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen name="Comments" component={CommentScreen} options={{ title: 'Yorumlar' }} />
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
      <Stack.Screen name="GroupFeed" component={GroupFeedScreen} options={{ title: 'Grup' }} />
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
  const handleComplete = () => {
    navigation.goBack();
    refreshUser();
  };
  return (
    <OnboardingProvider onComplete={handleComplete}>
      <OnboardingNavigator />
    </OnboardingProvider>
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
  const navRef = useRef(null);

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
        <Tab.Screen name="Feed" component={FeedStack} options={{ title: 'Akış', headerShown: false }} />
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
          listeners={({ navigation }) => {
            navRef.current = navigation;
            return {};
          }}
        />
        <Tab.Screen name="Messages" component={MessagesStack} options={{ title: 'Mesajlar', headerShown: false }} />
        <Tab.Screen name="Profile" component={ProfileStack} options={{ title: 'Profil', headerShown: false }} />
        <Tab.Screen name="More" component={MoreStack} options={{ title: 'Daha Fazla', tabBarButton: () => null }} />
      </Tab.Navigator>

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
            <View style={fabStyles.divider} />
            <TouchableOpacity
              style={fabStyles.menuItem}
              onPress={() => {
                setFabMenuVisible(false);
                navRef.current?.navigate('More', { screen: 'FoodLog' });
              }}
            >
              <View style={[fabStyles.menuIcon, { backgroundColor: '#f59e0b18' }]}>
                <Ionicons name="nutrition-outline" size={22} color="#f59e0b" />
              </View>
              <Text style={fabStyles.menuText}>Yemek Ekle</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const fabStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 100 },
  menu: { backgroundColor: '#fff', borderRadius: 16, width: 220, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  menuIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuText: { fontSize: 15, fontWeight: '600', color: '#111827' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 },
});
