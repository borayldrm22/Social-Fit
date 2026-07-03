// StarRewardContext.js — SocialFit · Yıldız kazanma anı kutlaması (global overlay)
// Root'ta bir kez mount edilir. Herhangi bir ekran useStarReward().celebrate(...) çağırır.
// Ekran unmount olsa bile (ör. paylaşım sonrası Feed'e geçiş) animasyon kesilmez.
import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, font, shadow, radius } from '../theme/socialFitTheme';

const { width: SCREEN_W } = Dimensions.get('window');
const StarRewardContext = createContext({ celebrate: () => {} });

export function useStarReward() {
  return useContext(StarRewardContext);
}

// Merkezî yıldızın etrafına saçılan parıltılar
const SPARKS = [
  { dx: -70, dy: -54, size: 12, delay: 60 },
  { dx: 66, dy: -60, size: 10, delay: 120 },
  { dx: -84, dy: 20, size: 9, delay: 180 },
  { dx: 82, dy: 14, size: 13, delay: 90 },
  { dx: -40, dy: -84, size: 8, delay: 150 },
  { dx: 44, dy: -80, size: 11, delay: 40 },
];

export function StarRewardProvider({ children }) {
  const [reward, setReward] = useState(null); // { points, bonus }
  const scrim = useRef(new Animated.Value(0)).current;
  const starScale = useRef(new Animated.Value(0)).current;
  const pointsY = useRef(new Animated.Value(24)).current;
  const pointsOpacity = useRef(new Animated.Value(0)).current;
  const bonusScale = useRef(new Animated.Value(0)).current;
  const sparks = useRef(SPARKS.map(() => new Animated.Value(0))).current;

  const celebrate = useCallback(({ points, bonus = 0 } = {}) => {
    if (!points || points <= 0) return;
    setReward({ points, bonus });

    scrim.setValue(0);
    starScale.setValue(0);
    pointsY.setValue(24);
    pointsOpacity.setValue(0);
    bonusScale.setValue(0);
    sparks.forEach((s) => s.setValue(0));

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    Animated.parallel([
      Animated.timing(scrim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(starScale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
      Animated.stagger(
        30,
        sparks.map((s) =>
          Animated.timing(s, { toValue: 1, duration: 620, easing: Easing.out(Easing.quad), useNativeDriver: true })
        )
      ),
      Animated.parallel([
        Animated.timing(pointsY, { toValue: 0, duration: 420, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true }),
        Animated.timing(pointsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start(() => {
      if (bonus > 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        Animated.spring(bonusScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
      }
    });

    const holdMs = bonus > 0 ? 2400 : 1700;
    setTimeout(() => {
      Animated.timing(scrim, { toValue: 0, duration: 260, useNativeDriver: true }).start(() => setReward(null));
    }, holdMs);
  }, [scrim, starScale, pointsY, pointsOpacity, bonusScale, sparks]);

  const total = reward ? reward.points + (reward.bonus || 0) : 0;

  return (
    <StarRewardContext.Provider value={{ celebrate }}>
      {children}
      {reward && (
        <Animated.View pointerEvents="none" style={[styles.overlay, { opacity: scrim }]}>
          <View style={styles.center}>
            {SPARKS.map((sp, i) => (
              <Animated.Text
                key={i}
                style={[
                  styles.spark,
                  {
                    fontSize: sp.size,
                    opacity: sparks[i].interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 1, 0] }),
                    transform: [
                      { translateX: sparks[i].interpolate({ inputRange: [0, 1], outputRange: [0, sp.dx] }) },
                      { translateY: sparks[i].interpolate({ inputRange: [0, 1], outputRange: [0, sp.dy] }) },
                      { scale: sparks[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 1.1, 0.6] }) },
                    ],
                  },
                ]}
              >
                ✨
              </Animated.Text>
            ))}

            <Animated.View style={{ transform: [{ scale: starScale }] }}>
              <LinearGradient colors={[colors.amber, colors.amberDark]} style={styles.starDisc}>
                <Text style={styles.starGlyph}>⭐</Text>
              </LinearGradient>
            </Animated.View>

            <Animated.View style={{ opacity: pointsOpacity, transform: [{ translateY: pointsY }] }}>
              <Text style={styles.points}>+{total}</Text>
              <Text style={styles.label}>yıldız kazandın!</Text>
            </Animated.View>

            {reward.bonus > 0 && (
              <Animated.View style={[styles.bonusPill, { transform: [{ scale: bonusScale }] }]}>
                <Text style={styles.bonusText}>🔥 7 gün seri · +{reward.bonus} bonus</Text>
              </Animated.View>
            )}
          </View>
        </Animated.View>
      )}
    </StarRewardContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 35, 27, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  center: { alignItems: 'center', width: SCREEN_W, justifyContent: 'center' },
  spark: { position: 'absolute', top: '50%' },
  starDisc: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.cta,
    shadowColor: colors.amberDark,
  },
  starGlyph: { fontSize: 54 },
  points: {
    fontFamily: font.displayBold,
    fontSize: 46,
    color: colors.white,
    textAlign: 'center',
    marginTop: 18,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  label: {
    fontFamily: font.bodyBold,
    fontSize: 15,
    color: colors.amberTint,
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  bonusPill: {
    marginTop: 18,
    backgroundColor: colors.coral,
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingHorizontal: 16,
    ...shadow.cta,
    shadowColor: colors.coralDark,
  },
  bonusText: { fontFamily: font.bodyBold, fontSize: 13.5, color: colors.white },
});
