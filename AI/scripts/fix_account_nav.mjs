import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('ECommerceApp/app/(tabs)/account.tsx');
let c = fs.readFileSync(file, 'utf8');

// Ensure Alert is imported
if (!c.includes('Alert,')) {
  c = c.replace("import {\n", "import {\n  Alert,\n");
}

c = c.replace("router.push('/profile/edit')", "router.push('/update-user')");
c = c.replace("router.push(stat.id === 'orders' ? '/orders' : '/favourites')", "router.push(stat.id === 'orders' ? { pathname: '/order/[id]', params: { id: 'ORD-21530' } } : '/(tabs)/favourite')");
c = c.replace("router.push(`/orders/${item.id}`)", "router.push({ pathname: '/order/[id]', params: { id: 'ORD-21530' } })");

c = c.replace(
  "onPress={() => router.push(`/account/${item.id}`)}",
  `onPress={() => {
                if (item.id === 'update-info') router.push('/update-user');
                else if (item.id === 'shipping-address') router.push('/shipping-address');
                else if (item.id === 'payment-methods') router.push('/payment-method');
                else if (item.id === 'notifications') router.push('/notification');
                else router.push('/app-settings');
              }}`
);

c = c.replace(
  "onPress={() => router.push(`/support/${item.id}`)}",
  `onPress={() => {
                if (item.id === 'help-center') router.push('/help');
                else if (item.id === 'terms') Alert.alert('Terms & Conditions', 'Điều khoản sử dụng dịch vụ E-Commerce Market.');
                else if (item.id === 'privacy') Alert.alert('Privacy Policy', 'Chính sách bảo mật thông tin người dùng.');
                else router.push('/help');
              }}`
);

c = c.replace("router.replace('/login')", "router.replace('/(auth)/login')");

fs.writeFileSync(file, c, 'utf8');
console.log('ACCOUNT_NAV_FIXED');
