import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('ECommerceApp/app/(tabs)/account.tsx');
let c = fs.readFileSync(file, 'utf8');

// Update ORDERS section in account.tsx to route to /orders
c = c.replace(
  "onPress={() => router.push(stat.id === 'orders' ? { pathname: '/order/[id]', params: { id: 'ORD-21530' } } : '/(tabs)/favourite')}",
  "onPress={() => router.push(stat.id === 'orders' ? '/orders' : '/(tabs)/favourite')}"
);

c = c.replace(
  "onPress={() => router.push({ pathname: '/order/[id]', params: { id: 'ORD-21530' } })}",
  "onPress={() => router.push('/orders')}"
);

fs.writeFileSync(file, c, 'utf8');
console.log('ACCOUNT_ORDERS_LINKED');
