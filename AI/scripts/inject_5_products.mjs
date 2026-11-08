import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('ECommerceApp/app/(tabs)/home.tsx');
let c = fs.readFileSync(file, 'utf8');

const target = `    image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
  },
];`;

const replacement = `    image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '5',
    name: 'Vortex Gaming 7.1',
    price: 149,
    originalPrice: 199,
    discount: 25,
    rating: 4.6,
    reviews: 320,
    category: 'Audio',
    image:
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80',
  },
];`;

c = c.replace(/\r\n/g, '\n');
c = c.replace(target, replacement);

// Make sure category count text shows 5 products
c = c.replace('6 products', '5 sản phẩm');
c = c.replace('6 sản phẩm', '5 sản phẩm');

fs.writeFileSync(file, c, 'utf8');
console.log('5_PRODUCTS_HOME_INJECTED');
