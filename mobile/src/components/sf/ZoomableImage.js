// ZoomableImage.js — SocialFit · Instagram tarzı görsel zoom (pinch + pan + çift-dokun).
// RN Animated + PanResponder ile — ek bağımlılık / babel plugin yok (reanimated v4 setup'ına bağlı değil),
// ve <Modal> içinde sorunsuz çalışır. Tek dokunuş (zoom yokken) onClose çağırır.
import React, { useRef } from 'react';
import { Animated, Image, StyleSheet, PanResponder, useWindowDimensions } from 'react-native';

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const DOUBLE_TAP_MS = 280;

function pinchDistance(touches) {
  const dx = touches[0].pageX - touches[1].pageX;
  const dy = touches[0].pageY - touches[1].pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function ZoomableImage({ uri, onClose }) {
  const { width, height } = useWindowDimensions();

  const scale = useRef(new Animated.Value(1)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;

  // Animated.Value okunamadığı için değerleri elde tutuyoruz.
  const st = useRef({
    scaleV: 1, txV: 0, tyV: 0,
    lastScale: 1, lastTx: 0, lastTy: 0,
    initialDist: 0, isPinch: false, moved: false, lastTapAt: 0,
  }).current;

  const clampTranslate = () => {
    const maxX = Math.max(0, ((st.scaleV - 1) * width) / 2);
    const maxY = Math.max(0, ((st.scaleV - 1) * height) / 2);
    st.txV = Math.min(maxX, Math.max(-maxX, st.txV));
    st.tyV = Math.min(maxY, Math.max(-maxY, st.tyV));
    tx.setValue(st.txV);
    ty.setValue(st.tyV);
  };

  const animateReset = () => {
    st.scaleV = 1; st.txV = 0; st.tyV = 0;
    st.lastScale = 1; st.lastTx = 0; st.lastTy = 0;
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7 }),
      Animated.spring(tx, { toValue: 0, useNativeDriver: true, friction: 7 }),
      Animated.spring(ty, { toValue: 0, useNativeDriver: true, friction: 7 }),
    ]).start();
  };

  const animateZoomIn = () => {
    st.scaleV = DOUBLE_TAP_SCALE; st.lastScale = DOUBLE_TAP_SCALE;
    Animated.spring(scale, { toValue: DOUBLE_TAP_SCALE, useNativeDriver: true, friction: 7 }).start();
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (e, g) =>
        e.nativeEvent.touches.length === 2 || Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
      onPanResponderGrant: () => {
        st.moved = false;
        st.isPinch = false;
        st.lastScale = st.scaleV;
        st.lastTx = st.txV;
        st.lastTy = st.tyV;
      },
      onPanResponderMove: (e, g) => {
        const touches = e.nativeEvent.touches;
        if (touches.length === 2) {
          st.moved = true;
          if (!st.isPinch) { st.isPinch = true; st.initialDist = pinchDistance(touches) || 1; }
          const next = Math.min(MAX_SCALE, Math.max(0.9, st.lastScale * (pinchDistance(touches) / st.initialDist)));
          st.scaleV = next;
          scale.setValue(next);
        } else if (touches.length === 1 && st.scaleV > 1 && !st.isPinch) {
          if (Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2) st.moved = true;
          st.txV = st.lastTx + g.dx;
          st.tyV = st.lastTy + g.dy;
          clampTranslate();
        }
      },
      onPanResponderRelease: () => {
        if (st.isPinch) {
          st.isPinch = false;
          if (st.scaleV < 1) { animateReset(); return; }
          st.lastScale = st.scaleV;
          clampTranslate();
          st.lastTx = st.txV; st.lastTy = st.tyV;
          return;
        }
        if (st.moved) { st.lastTx = st.txV; st.lastTy = st.tyV; return; }

        // Hareketsiz → dokunuş: çift dokunuş zoom, tek dokunuş (zoom yokken) kapat.
        const now = Date.now();
        if (now - st.lastTapAt < DOUBLE_TAP_MS) {
          st.lastTapAt = 0;
          if (st.scaleV > 1) animateReset(); else animateZoomIn();
        } else {
          const stamp = now;
          st.lastTapAt = stamp;
          if (st.scaleV <= 1) {
            setTimeout(() => {
              if (st.lastTapAt === stamp && st.scaleV <= 1) onClose && onClose();
            }, DOUBLE_TAP_MS);
          }
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={[styles.fill, { transform: [{ translateX: tx }, { translateY: ty }, { scale }] }]}
      {...pan.panHandlers}
    >
      <Image source={{ uri }} style={styles.fill} resizeMode="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%' },
});
