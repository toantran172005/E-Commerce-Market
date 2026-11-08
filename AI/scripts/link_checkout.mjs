import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('ECommerceApp/app/checkout.tsx');
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  '<TouchableOpacity style={styles.payButton} activeOpacity={0.9}>',
  "<TouchableOpacity style={styles.payButton} activeOpacity={0.9} onPress={() => router.push('/checkout-success')}>"
);

fs.writeFileSync(file, c, 'utf8');
console.log('CHECKOUT_PAY_LINKED_NODE');
