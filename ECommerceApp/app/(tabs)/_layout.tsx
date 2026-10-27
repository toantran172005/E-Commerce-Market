import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="Home" options={{ title: 'Trang chủ' }} />
      <Tabs.Screen name="Favourite" options={{ title: 'Yêu thích' }} />
      <Tabs.Screen name="Account" options={{ title: 'Tài khoản' }} />
    </Tabs>
  );
}
