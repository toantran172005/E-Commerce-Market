import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AppProviders } from '../src/context/AppProviders';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/constants/theme';

/** Màn splash ngắn trong lúc khởi tạo auth state. */
function SplashOverlay() {
  return (
    <View style={styles.splash}>
      <View style={styles.splashLogo}>
        <Ionicons name="bag-handle" size={32} color={colors.white} />
      </View>
      <ActivityIndicator size="small" color={colors.primary} style={styles.splashSpinner} />
    </View>
  );
}

/** Điều hướng chính + route guard. */
function RootNavigator() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const isInAuthGroup = segments[0] === '(auth)';

    if (!user && !isInAuthGroup) {
      // Chưa đăng nhập -> buộc về màn login.
      router.replace('/(auth)/login');
    } else if (user && !user.isGuest && isInAuthGroup) {
      // Đã đăng nhập tài khoản thật mà đang ở màn auth -> về Home.
      router.replace('/(tabs)/home');
    }
  }, [user, isLoading, segments, router]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="cart" options={{ headerShown: false }} />
        <Stack.Screen name="checkout" options={{ headerShown: false }} />
        <Stack.Screen name="checkout-success" options={{ headerShown: false }} />
        <Stack.Screen name="orders" options={{ headerShown: false }} />
        <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="notification" options={{ headerShown: false }} />
        <Stack.Screen name="shipping-address" options={{ headerShown: false }} />
        <Stack.Screen name="payment-method" options={{ headerShown: false }} />
        <Stack.Screen name="help" options={{ headerShown: false }} />
        <Stack.Screen name="update-user" options={{ headerShown: false }} />
        <Stack.Screen name="app-settings" options={{ headerShown: false }} />

        {/* Chỉ filter là bottom sheet modal */}
        <Stack.Screen
          name="filter"
          options={{
            presentation: 'transparentModal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />
      </Stack>

      {isLoading ? <SplashOverlay /> : null}
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <RootNavigator />
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  splash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  splashLogo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashSpinner: {
    marginTop: 20,
  },
});
