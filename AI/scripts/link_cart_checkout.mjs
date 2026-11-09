import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('ECommerceApp/app/cart.tsx');
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  `  const handleCheckout = () => {
    // navigation would happen here
  };`,
  `  const handleCheckout = () => {
    router.push('/checkout');
  };`
);

fs.writeFileSync(file, c, 'utf8');
console.log('CART_CHECKOUT_CONNECTED');
