import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{ title: 'Chi tiết sản phẩm' }} />
      <Stack.Screen name="checkout" options={{ title: 'Thanh toán' }} />
    </Stack>
  );
}
