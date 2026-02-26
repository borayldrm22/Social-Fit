import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LANDING_HERO = require('../../../assets/landing-hero.png');
const WELCOME_BG_URI = 'https://assets.api.uizard.io/api/cdn/stream/668cbfdc-f3dd-4d94-b92f-85384d2755a5.png';
const DARK_GREEN = '#2d6a4f';

export default function WelcomeScreen({ navigation }) {
  return (
    <ImageBackground
      source={{ uri: WELCOME_BG_URI }}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>
            Get ready to become the best version of yourself!
          </Text>
          <View style={styles.heroImageWrap}>
            <Image source={LANDING_HERO} style={styles.heroImage} resizeMode="contain" />
          </View>
        </View>
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.buttonCreate}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonCreateText}>Create Account</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonLogin}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonLoginText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: DARK_GREEN,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: DARK_GREEN,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.95,
    marginBottom: 20,
  },
  heroImageWrap: {
    overflow: 'hidden',
  },
  heroImage: {
    width: 200,
    height: 200,
  },
  buttons: {
    paddingBottom: 32,
  },
  buttonCreate: {
    marginBottom: 12,
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonCreateText: {
    color: DARK_GREEN,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonLogin: {
    backgroundColor: DARK_GREEN,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonLoginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
