import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
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
    </Stack.Navigator>
  );
}

export default function MainTabs() {
  return (
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
          tabBarButton: (props) => (
            <TouchableOpacity
              onPress={props.onPress}
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
  );
}
