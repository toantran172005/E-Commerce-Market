import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface FloatingChatButtonProps {
  onPress: () => void;
  size?: number;
  initialBottomOffset?: number;
  initialRightOffset?: number;
}

const BRAND = {
  primary: '#FF5722',
  primaryDark: '#D9400F',
  white: '#FFFFFF',
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export default function FloatingChatButton({
  onPress,
  size = 60,
  initialBottomOffset = 96,
  initialRightOffset = 18,
}: FloatingChatButtonProps) {
  const { width, height } = useWindowDimensions();
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const positionRef = useRef({ x: 0, y: 0 });
  const gestureStartRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const onPressRef = useRef(onPress);

  useEffect(() => {
    onPressRef.current = onPress;
  }, [onPress]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const bounds = useMemo(() => {
    const margin = 12;
    return {
      minX: margin,
      maxX: Math.max(margin, width - size - margin),
      minY: margin,
      maxY: Math.max(margin, height - size - margin),
    };
  }, [height, size, width]);

  const setPosition = useCallback(
    (x: number, y: number) => {
      const nextX = clamp(x, bounds.minX, bounds.maxX);
      const nextY = clamp(y, bounds.minY, bounds.maxY);
      positionRef.current = { x: nextX, y: nextY };
      pan.setValue({ x: nextX, y: nextY });
    },
    [bounds.maxX, bounds.maxY, bounds.minX, bounds.minY, pan]
  );

  useEffect(() => {
    const initialX = Math.max(
      bounds.minX,
      width - size - initialRightOffset
    );
    const initialY = Math.max(
      bounds.minY,
      height - size - initialBottomOffset
    );
    setPosition(initialX, initialY);
  }, [
    bounds.minX,
    bounds.minY,
    height,
    initialBottomOffset,
    initialRightOffset,
    setPosition,
    size,
    width,
  ]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2,
        onPanResponderGrant: () => {
          hasMovedRef.current = false;
          gestureStartRef.current = { ...positionRef.current };
        },
        onPanResponderMove: (_event, gestureState) => {
          if (
            Math.abs(gestureState.dx) > 3 ||
            Math.abs(gestureState.dy) > 3
          ) {
            hasMovedRef.current = true;
          }

          const nextX = clamp(
            gestureStartRef.current.x + gestureState.dx,
            bounds.minX,
            bounds.maxX
          );
          const nextY = clamp(
            gestureStartRef.current.y + gestureState.dy,
            bounds.minY,
            bounds.maxY
          );

          positionRef.current = { x: nextX, y: nextY };
          pan.setValue({ x: nextX, y: nextY });
        },
        onPanResponderRelease: () => {
          const current = positionRef.current;
          setPosition(current.x, current.y);

          if (!hasMovedRef.current) {
            onPressRef.current();
          }
        },
        onPanResponderTerminate: () => {
          const current = positionRef.current;
          setPosition(current.x, current.y);
        },
      }),
    [bounds.maxX, bounds.maxY, bounds.minX, bounds.minY, pan, setPosition]
  );

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.14],
  });

  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0],
  });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      accessibilityRole="button"
      accessibilityLabel="Mở Trợ Lý AI"
      style={[
        styles.buttonContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: pan.getTranslateTransform(),
        },
      ]}
    >
      <Animated.View
        style={[
          styles.pulseRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: ringScale }],
            opacity: ringOpacity,
          },
        ]}
      />
      <View
        style={[
          styles.buttonInner,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Ionicons name="chatbubble-ellipses" size={28} color={BRAND.white} />
        <View style={styles.sparkleBadge}>
          <Ionicons name="sparkles" size={11} color={BRAND.primary} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    backgroundColor: BRAND.primary,
  },
  buttonInner: {
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 8,
    elevation: 8,
  },
  sparkleBadge: {
    position: 'absolute',
    right: 4,
    top: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BRAND.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});
