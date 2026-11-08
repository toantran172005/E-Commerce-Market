import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('ECommerceApp/app/product/[id].tsx');
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  `  const handleBuyNow = () => {
    Alert.alert('Checkout', \`Proceeding to checkout · $\${product.price}\`);
  };`,
  `  const handleBuyNow = () => {
    router.push('/checkout');
  };`
);

fs.writeFileSync(file, c, 'utf8');
console.log('PRODUCT_BUY_NOW_CONNECTED');
