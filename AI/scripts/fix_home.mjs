import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('ECommerceApp/app/(tabs)/home.tsx');
let c = fs.readFileSync(file, 'utf8');

// Add 5th product to PRODUCTS
const product5 = `  {
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

c = c.replace('  },\n];\n\nexport default function HomeScreen()', product5 + '\n\nexport default function HomeScreen()');

// Translate headers and text to Vietnamese
c = c.replace("<Text style={styles.greeting}>Good morning</Text>", "<Text style={styles.greeting}>Chào buổi sáng</Text>");
c = c.replace("<Text style={styles.sectionTitle}>Categories</Text>", "<Text style={styles.sectionTitle}>Danh mục sản phẩm</Text>");
c = c.replace("<Text style={styles.sectionMeta}>6 products</Text>", "<Text style={styles.sectionMeta}>5 sản phẩm</Text>");
c = c.replace("<Text style={styles.sectionTitle}>All Products</Text>", "<Text style={styles.sectionTitle}>Tất cả sản phẩm</Text>");
c = c.replace('placeholder="Search headphones, phones..."', 'placeholder="Tìm kiếm tai nghe, điện thoại, laptop..."');

// Translate category names in CATEGORIES
c = c.replace("{ id: 'audio', name: 'Audio'", "{ id: 'audio', name: 'Âm thanh'");
c = c.replace("{ id: 'phones', name: 'Phones'", "{ id: 'phones', name: 'Điện thoại'");
c = c.replace("{ id: 'laptops', name: 'Laptops'", "{ id: 'laptops', name: 'Laptop'");
c = c.replace("{ id: 'accessories', name: 'Accessories'", "{ id: 'accessories', name: 'Phụ kiện'");

// Translate FILTER_CHIPS
c = c.replace(
  "const FILTER_CHIPS = ['All', 'Audio', 'Phones', 'Laptops', 'Accessories'];",
  "const FILTER_CHIPS = ['Tất cả', 'Audio', 'Phones', 'Laptops', 'Accessories'];"
);
c = c.replace("useState<string>('All')", "useState<string>('Tất cả')");
c = c.replace("activeCategory === 'All'", "activeCategory === 'Tất cả'");

// Fix card width in styles: width is already CARD_WIDTH (exact fixed pixels: (width - 40 - 14) / 2)
// Ensure maxWidth: CARD_WIDTH so it never stretches
c = c.replace(
  "  card: {\n    backgroundColor: '#FFFFFF',",
  "  card: {\n    width: CARD_WIDTH,\n    maxWidth: CARD_WIDTH,\n    backgroundColor: '#FFFFFF',"
);

fs.writeFileSync(file, c, 'utf8');
console.log('HOME_VIETNAMESE_AND_5_PRODUCTS_FIXED');
