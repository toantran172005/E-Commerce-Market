import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('ECommerceApp/app/(tabs)/favourite.tsx');
let c = fs.readFileSync(file, 'utf8');

// Replace card style to have maxWidth: '48.5%' so single odd items don't stretch
c = c.replace(
  "  card: {\n    flex: 1,",
  "  card: {\n    flex: 1,\n    maxWidth: '48.5%',"
);

// Cart button should navigate to cart
c = c.replace(
  "onPress={() => {}}",
  "onPress={() => router.push('/cart')}"
);

// Clicking on card should navigate to product detail
c = c.replace(
  "    <View style={styles.card}>",
  "    <Pressable style={styles.card} onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}>"
);
c = c.replace(
  "    </View>\n  );\n\n  return (",
  "    </Pressable>\n  );\n\n  return ("
);

fs.writeFileSync(file, c, 'utf8');
console.log('FAVOURITE_FIXED');
