import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  terminate,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCPkVyg1V7erOSe2KWUvp9pDfO5EgVsJs4",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "e-commerce-market-e2875.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "e-commerce-market-e2875",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "e-commerce-market-e2875.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "794360087185",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:794360087185:web:ee816e20e5d8d6d1cb3530",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─────────────────────────────────────────────────────────────
// BRANDS (Thương hiệu toàn cầu có thật)
// ─────────────────────────────────────────────────────────────
const brands = [
  {
    id: 'apple',
    name: 'Apple',
    shortName: 'AP',
    description: 'Thương hiệu công nghệ cao cấp hàng đầu thế giới từ Mỹ',
    logo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'samsung',
    name: 'Samsung',
    shortName: 'SS',
    description: 'Tập đoàn điện tử công nghệ đa quốc gia Hàn Quốc',
    logo: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'sony',
    name: 'Sony',
    shortName: 'SN',
    description: 'Tập đoàn âm thanh, hình ảnh và công nghệ đỉnh cao Nhật Bản',
    logo: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'asus',
    name: 'Asus',
    shortName: 'AS',
    description: 'Thương hiệu laptop văn phòng & gaming ROG nổi tiếng Đài Loan',
    logo: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'dell',
    name: 'Dell',
    shortName: 'DL',
    description: 'Thương hiệu máy tính doanh nghiệp, Ultrabook XPS và workstation Mỹ',
    logo: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'lenovo',
    name: 'Lenovo',
    shortName: 'LN',
    description: 'Tập đoàn máy tính cá nhân hàng đầu thế giới với dòng ThinkPad & IdeaPad',
    logo: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'xiaomi',
    name: 'Xiaomi',
    shortName: 'MI',
    description: 'Hệ sinh thái smartphone, thiết bị thông minh quốc dân',
    logo: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'logitech',
    name: 'Logitech',
    shortName: 'LG',
    description: 'Thương hiệu phụ kiện máy tính, bàn phím chuột và gaming gear Thụy Sĩ',
    logo: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=300&q=80',
  },
];

// ─────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────
const categories = [
  {
    id: 'laptops',
    name: 'Laptop & Máy tính',
    slug: 'laptops',
    icon: 'laptop-outline',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'phones',
    name: 'Điện thoại',
    slug: 'phones',
    icon: 'phone-portrait-outline',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'audio',
    name: 'Âm thanh & Tai nghe',
    slug: 'audio',
    icon: 'headset-outline',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'watches',
    name: 'Đồng hồ thông minh',
    slug: 'watches',
    icon: 'watch-outline',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'tablets',
    name: 'Máy tính bảng',
    slug: 'tablets',
    icon: 'tablet-portrait-outline',
    image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'accessories',
    name: 'Phụ kiện & Gear',
    slug: 'accessories',
    icon: 'hardware-chip-outline',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
  },
];

const IMG = {
  macAir: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
  macPro: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=900&q=80',
  laptop1: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80',
  laptop2: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=900&q=80',
  laptop3: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=900&q=80',
  iphone: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=80',
  phone2: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
  phone3: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=900&q=80',
  headphone1: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
  headphone2: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80',
  earbuds: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=80',
  watch1: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=900&q=80',
  watch2: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
  tablet1: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=900&q=80',
  tablet2: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?auto=format&fit=crop&w=900&q=80',
  keyboard: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80',
  mouse: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=900&q=80',
};

function P(opts) {
  return {
    id: opts.id,
    name: opts.name,
    brandName: opts.brand,
    brandId: opts.brandId,
    category: opts.categoryId === 'audio' ? 'Âm thanh' : opts.category,
    categoryId: opts.categoryId,
    categoryName: opts.category,
    price: opts.price,
    originalPrice: opts.originalPrice ?? opts.price,
    image: opts.image,
    images: opts.images ?? [opts.image],
    description: opts.description,
    specs: opts.specs ?? {},
    stock: opts.stock ?? 20,
    rating: opts.rating ?? 4.8,
    reviewCount: opts.reviewCount ?? 120,
    sold: opts.sold ?? 500,
    isFeatured: opts.isFeatured ?? false,
    tags: [opts.brand.toLowerCase(), opts.categoryId.toLowerCase(), ...(opts.tags || [])],
  };
}

// ─────────────────────────────────────────────────────────────
// 24 SẢN PHẨM NỔI TIẾNG TOÀN CẦU (GIÁ THẬT VNĐ)
// ─────────────────────────────────────────────────────────────
const products = [
  // ── LAPTOP (Có cả dưới 15M và cao cấp)
  P({
    id: 'apple-macbook-air-m3-13',
    name: 'MacBook Air M3 13 inch 8GB/256GB',
    brand: 'Apple',
    brandId: 'apple',
    category: 'Laptop & Máy tính',
    categoryId: 'laptops',
    price: 27990000,
    originalPrice: 31990000,
    image: IMG.macAir,
    description: 'MacBook Air M3 13 inch — siêu mỏng nhẹ 1.24kg, chip Apple M3, pin 18 giờ, màn hình Liquid Retina 13.6 inch.',
    specs: { CPU: 'Apple M3 8-core', RAM: '8GB', Storage: '256GB SSD', Display: '13.6" Liquid Retina', Battery: '18 giờ' },
    stock: 30, rating: 4.9, isFeatured: true, tags: ['macbook', 'apple', 'm3', 'laptop'],
  }),
  P({
    id: 'apple-macbook-pro-14-m3',
    name: 'MacBook Pro 14 inch M3 Pro 18GB/512GB',
    brand: 'Apple',
    brandId: 'apple',
    category: 'Laptop & Máy tính',
    categoryId: 'laptops',
    price: 49990000,
    originalPrice: 54990000,
    image: IMG.macPro,
    description: 'MacBook Pro 14 inch chip M3 Pro — màn hình Liquid Retina XDR 120Hz, pin 22 giờ, đồ họa đỉnh cao.',
    specs: { CPU: 'Apple M3 Pro', RAM: '18GB', Storage: '512GB SSD', Display: '14.2" XDR 120Hz' },
    stock: 15, rating: 4.9, isFeatured: true, tags: ['macbook pro', 'apple', 'laptop cao cap'],
  }),
  P({
    id: 'asus-vivobook-15-oled',
    name: 'Laptop Asus Vivobook 15 OLED A1504',
    brand: 'Asus',
    brandId: 'asus',
    category: 'Laptop & Máy tính',
    categoryId: 'laptops',
    price: 13990000,
    originalPrice: 16490000,
    image: IMG.laptop1,
    description: 'Laptop văn phòng bình dân dưới 15 triệu, màn hình OLED 15.6 inch rực rỡ, Intel Core i5-1335U, RAM 16GB mượt mà.',
    specs: { CPU: 'Intel Core i5-1335U', RAM: '16GB', Storage: '512GB SSD', Display: '15.6" OLED FHD' },
    stock: 45, rating: 4.7, isFeatured: true, tags: ['laptop gia re', 'duoi 15 trieu', 'asus', 'oled'],
  }),
  P({
    id: 'lenovo-ideapad-slim-3',
    name: 'Laptop Lenovo IdeaPad Slim 3 15IAH8',
    brand: 'Lenovo',
    brandId: 'lenovo',
    category: 'Laptop & Máy tính',
    categoryId: 'laptops',
    price: 11490000,
    originalPrice: 13990000,
    image: IMG.laptop3,
    description: 'Laptop học sinh sinh viên giá rẻ dưới 12 triệu, chip Intel Core i3-1215U, RAM 8GB, SSD 512GB bền bỉ.',
    specs: { CPU: 'Intel Core i3-1215U', RAM: '8GB', Storage: '512GB SSD', Display: '15.6" FHD IPS' },
    stock: 60, rating: 4.6, isFeatured: false, tags: ['laptop gia re', 'duoi 15 trieu', 'lenovo', 'sinh vien'],
  }),
  P({
    id: 'asus-rog-strix-g16',
    name: 'Laptop Gaming Asus ROG Strix G16 RTX 4060',
    brand: 'Asus',
    brandId: 'asus',
    category: 'Laptop & Máy tính',
    categoryId: 'laptops',
    price: 38990000,
    originalPrice: 42990000,
    image: IMG.laptop2,
    description: 'Laptop gaming khủng Intel Core i7-13650HX, card đồ họa RTX 4060 8GB, màn hình 16 inch 165Hz mượt mà.',
    specs: { CPU: 'Intel Core i7-13650HX', GPU: 'RTX 4060', RAM: '16GB DDR5', Display: '16" 165Hz' },
    stock: 18, rating: 4.8, isFeatured: true, tags: ['laptop gaming', 'rog', 'asus', 'rtx 4060'],
  }),
  P({
    id: 'dell-xps-13-plus',
    name: 'Laptop Dell XPS 13 Plus 9320 OLED',
    brand: 'Dell',
    brandId: 'dell',
    category: 'Laptop & Máy tính',
    categoryId: 'laptops',
    price: 34990000,
    originalPrice: 38990000,
    image: IMG.laptop1,
    description: 'Ultrabook doanh nhân cao cấp mỏng nhẹ nhất của Dell, màn hình vô cực 3.5K OLED, Intel Core i7.',
    specs: { CPU: 'Intel Core i7-1260P', RAM: '16GB', Storage: '512GB SSD', Display: '13.4" 3.5K OLED' },
    stock: 12, rating: 4.8, isFeatured: false, tags: ['dell', 'xps', 'doanh nhan'],
  }),
  P({
    id: 'xiaomi-redmibook-pro-15',
    name: 'Laptop Xiaomi RedmiBook Pro 15 2024',
    brand: 'Xiaomi',
    brandId: 'xiaomi',
    category: 'Laptop & Máy tính',
    categoryId: 'laptops',
    price: 15990000,
    originalPrice: 17990000,
    image: IMG.laptop2,
    description: 'Laptop Xiaomi thiết kế nguyên khối kim loại, màn hình 3.2K 120Hz, chip Intel Core Ultra 5 thế hệ mới.',
    specs: { CPU: 'Intel Core Ultra 5 125H', RAM: '16GB', Storage: '512GB SSD', Display: '15.6" 3.2K 120Hz' },
    stock: 25, rating: 4.7, isFeatured: false, tags: ['xiaomi', 'redmibook', 'laptop'],
  }),

  // ── ĐIỆN THOẠI (PHONES)
  P({
    id: 'apple-iphone-16-pro-max',
    name: 'Điện thoại iPhone 16 Pro Max 256GB',
    brand: 'Apple',
    brandId: 'apple',
    category: 'Điện thoại',
    categoryId: 'phones',
    price: 34990000,
    originalPrice: 37990000,
    image: IMG.iphone,
    description: 'Flagship Apple cao cấp nhất — khung Titan, chip A18 Pro siêu mạnh, nút chụp ảnh Camera Control, camera 48MP zoom 5x.',
    specs: { Chip: 'Apple A18 Pro', Display: '6.9" Super Retina XDR 120Hz', Camera: '48MP + 48MP + 12MP', Battery: '4685 mAh' },
    stock: 50, rating: 5.0, isFeatured: true, tags: ['iphone', 'apple', 'iphone 16 pro max'],
  }),
  P({
    id: 'apple-iphone-16',
    name: 'Điện thoại iPhone 16 128GB',
    brand: 'Apple',
    brandId: 'apple',
    category: 'Điện thoại',
    categoryId: 'phones',
    price: 22490000,
    originalPrice: 24990000,
    image: IMG.iphone,
    description: 'iPhone 16 tiêu chuẩn chip A18, camera 48MP sắc nét, nút Camera Control và Action Button đa năng.',
    specs: { Chip: 'Apple A18', Display: '6.1" OLED Super Retina XDR', Camera: '48MP + 12MP' },
    stock: 40, rating: 4.8, isFeatured: true, tags: ['iphone', 'apple', 'iphone 16'],
  }),
  P({
    id: 'samsung-galaxy-s24-ultra',
    name: 'Điện thoại Samsung Galaxy S24 Ultra 12GB/256GB',
    brand: 'Samsung',
    brandId: 'samsung',
    category: 'Điện thoại',
    categoryId: 'phones',
    price: 26990000,
    originalPrice: 31990000,
    image: IMG.phone2,
    description: 'Flagship Android đỉnh cao với Galaxy AI, camera 200MP zoom 100x, khung viền Titanium và bút S Pen thần thánh.',
    specs: { Chip: 'Snapdragon 8 Gen 3', Display: '6.8" 2X AMOLED 120Hz', Camera: '200MP', 'S Pen': 'Tích hợp' },
    stock: 35, rating: 4.9, isFeatured: true, tags: ['samsung', 's24 ultra', 'galaxy ai'],
  }),
  P({
    id: 'samsung-galaxy-z-fold-6',
    name: 'Điện thoại gập Samsung Galaxy Z Fold 6 12GB/512GB',
    brand: 'Samsung',
    brandId: 'samsung',
    category: 'Điện thoại',
    categoryId: 'phones',
    price: 41990000,
    originalPrice: 47990000,
    image: IMG.phone3,
    description: 'Tuyệt tác màn hình gập 7.6 inch, thiết kế mỏng nhẹ vuông vức, đa nhiệm thông minh cùng Galaxy AI.',
    specs: { Chip: 'Snapdragon 8 Gen 3', MainDisplay: '7.6" AMOLED 120Hz', CoverDisplay: '6.3" AMOLED 120Hz' },
    stock: 15, rating: 4.8, isFeatured: true, tags: ['samsung', 'z fold 6', 'dien thoai gap'],
  }),
  P({
    id: 'xiaomi-14-ultra',
    name: 'Điện thoại Xiaomi 14 Ultra 16GB/512GB Leica',
    brand: 'Xiaomi',
    brandId: 'xiaomi',
    category: 'Điện thoại',
    categoryId: 'phones',
    price: 24990000,
    originalPrice: 28990000,
    image: IMG.phone2,
    description: 'Chuyên gia nhiếp ảnh di động cảm biến 1 inch, ống kính Leica huyền thoại, Snapdragon 8 Gen 3.',
    specs: { Chip: 'Snapdragon 8 Gen 3', Camera: '50MP Leica 4 ống kính', Display: '6.73" 2K LTPO AMOLED' },
    stock: 20, rating: 4.8, isFeatured: false, tags: ['xiaomi', 'xiaomi 14 ultra', 'leica'],
  }),

  // ── ÂM THANH & TAI NGHE (AUDIO)
  P({
    id: 'sony-wh-1000xm5',
    name: 'Tai nghe chụp tai chống ồn Sony WH-1000XM5',
    brand: 'Sony',
    brandId: 'sony',
    category: 'Âm thanh & Tai nghe',
    categoryId: 'audio',
    price: 7490000,
    originalPrice: 8990000,
    image: IMG.headphone1,
    description: 'Tai nghe chống ồn số 1 thế giới — 8 micro khử ồn, âm thanh Hi-Res Audio, thời lượng pin 30 giờ.',
    specs: { ANC: 'Chống ồn đầu ngành', Battery: '30 giờ', Driver: '30mm', Codec: 'LDAC/AAC' },
    stock: 30, rating: 4.9, isFeatured: true, tags: ['sony', 'tai nghe', 'chong on', 'wh1000xm5'],
  }),
  P({
    id: 'apple-airpods-pro-2-usbc',
    name: 'Tai nghe Apple AirPods Pro 2 (USB-C)',
    brand: 'Apple',
    brandId: 'apple',
    category: 'Âm thanh & Tai nghe',
    categoryId: 'audio',
    price: 5790000,
    originalPrice: 6590000,
    image: IMG.earbuds,
    description: 'Tai nghe true-wireless cao cấp chip H2, chống ồn chủ động gấp 2 lần, hộp sạc MagSafe USB-C chống bụi nước IP54.',
    specs: { Chip: 'Apple H2', Battery: '6h (30h hộp sạc)', ANC: 'Chống ồn chủ động', Port: 'USB-C' },
    stock: 50, rating: 4.9, isFeatured: true, tags: ['airpods pro 2', 'apple', 'tai nghe'],
  }),
  P({
    id: 'samsung-galaxy-buds-3-pro',
    name: 'Tai nghe Samsung Galaxy Buds 3 Pro',
    brand: 'Samsung',
    brandId: 'samsung',
    category: 'Âm thanh & Tai nghe',
    categoryId: 'audio',
    price: 4890000,
    originalPrice: 5490000,
    image: IMG.earbuds,
    description: 'Thiết kế dải đèn Blade Lights độc đáo, chống ồn thông minh, âm thanh 24bit Hi-Fi và phiên dịch Galaxy AI trực tiếp.',
    specs: { Driver: 'Loa 2 chiều', Battery: '7 giờ', ANC: 'Thích ứng thông minh', 'Kháng nước': 'IP57' },
    stock: 35, rating: 4.7, isFeatured: false, tags: ['samsung', 'galaxy buds', 'tai nghe'],
  }),
  P({
    id: 'sony-wf-1000xm5',
    name: 'Tai nghe nhét tai Sony WF-1000XM5 True Wireless',
    brand: 'Sony',
    brandId: 'sony',
    category: 'Âm thanh & Tai nghe',
    categoryId: 'audio',
    price: 6290000,
    originalPrice: 7290000,
    image: IMG.earbuds,
    description: 'Tai nghe in-ear chống ồn tốt nhất hiện nay, màng loa Dynamic Driver X, âm thanh chi tiết và đàm thoại rõ nét.',
    specs: { Driver: 'Dynamic Driver X 8.4mm', Battery: '8h + 16h', 'Kháng nước': 'IPX4' },
    stock: 25, rating: 4.8, isFeatured: false, tags: ['sony', 'wf1000xm5', 'tai nghe'],
  }),

  // ── ĐỒNG HỒ THÔNG MINH (WATCHES)
  P({
    id: 'apple-watch-series-10',
    name: 'Đồng hồ thông minh Apple Watch Series 10 GPS 46mm',
    brand: 'Apple',
    brandId: 'apple',
    category: 'Đồng hồ thông minh',
    categoryId: 'watches',
    price: 11490000,
    originalPrice: 12490000,
    image: IMG.watch1,
    description: 'Apple Watch Series 10 — màn hình OLED góc rộng lớn nhất, thiết kế siêu mỏng 9.7mm, sạc nhanh 80% trong 30 phút.',
    specs: { Chip: 'S10 SiP', Display: 'OLED góc nhìn rộng', Battery: '18 giờ', 'Chống nước': '50m' },
    stock: 25, rating: 4.9, isFeatured: true, tags: ['apple watch', 'apple', 'dong ho'],
  }),
  P({
    id: 'samsung-galaxy-watch-7',
    name: 'Đồng hồ thông minh Samsung Galaxy Watch 7 44mm',
    brand: 'Samsung',
    brandId: 'samsung',
    category: 'Đồng hồ thông minh',
    categoryId: 'watches',
    price: 6890000,
    originalPrice: 7990000,
    image: IMG.watch2,
    description: 'Galaxy Watch 7 trang bị chip 3nm mạnh mẽ, đo chỉ số AGEs, phân tích giấc ngủ và thể chất thông minh với Galaxy AI.',
    specs: { Chip: 'Exynos W1000 (3nm)', Display: '1.5" Super AMOLED', Pin: '425 mAh' },
    stock: 30, rating: 4.7, isFeatured: false, tags: ['samsung', 'galaxy watch', 'dong ho'],
  }),
  P({
    id: 'xiaomi-smart-band-8',
    name: 'Vòng đeo tay thông minh Xiaomi Smart Band 8',
    brand: 'Xiaomi',
    brandId: 'xiaomi',
    category: 'Đồng hồ thông minh',
    categoryId: 'watches',
    price: 890000,
    originalPrice: 1090000,
    image: IMG.watch1,
    description: 'Vòng đeo tay quốc dân giá rẻ dưới 1 triệu, màn hình AMOLED 60Hz mượt mà, pin trâu đến 16 ngày, hơn 150 chế độ thể thao.',
    specs: { Display: '1.62" AMOLED 60Hz', Battery: '16 ngày', 'Chống nước': '5ATM' },
    stock: 80, rating: 4.8, isFeatured: false, tags: ['xiaomi', 'smart band 8', 'vong deo tay', 'duoi 1 trieu'],
  }),

  // ── MÁY TÍNH BẢNG (TABLETS)
  P({
    id: 'apple-ipad-pro-m4-11',
    name: 'Máy tính bảng Apple iPad Pro M4 11 inch 256GB WiFi',
    brand: 'Apple',
    brandId: 'apple',
    category: 'Máy tính bảng',
    categoryId: 'tablets',
    price: 28490000,
    originalPrice: 30990000,
    image: IMG.tablet1,
    description: 'iPad Pro M4 mỏng kỷ lục 5.3mm, chip M4 đỉnh cao, màn hình Ultra Retina XDR Tandem OLED tuyệt mỹ.',
    specs: { Chip: 'Apple M4', Display: '11" Tandem OLED', Storage: '256GB' },
    stock: 20, rating: 5.0, isFeatured: true, tags: ['ipad', 'apple', 'ipad pro m4'],
  }),
  P({
    id: 'samsung-galaxy-tab-s9-fe',
    name: 'Máy tính bảng Samsung Galaxy Tab S9 FE kèm bút S Pen',
    brand: 'Samsung',
    brandId: 'samsung',
    category: 'Máy tính bảng',
    categoryId: 'tablets',
    price: 8990000,
    originalPrice: 10990000,
    image: IMG.tablet2,
    description: 'Máy tính bảng giá tốt dưới 10 triệu, màn hình 10.9 inch 90Hz, kháng nước IP68, sẵn bút S Pen vẽ viết mượt mà.',
    specs: { Display: '10.9" 90Hz', RAM: '6GB', Storage: '128GB', Pen: 'S Pen đi kèm' },
    stock: 28, rating: 4.8, isFeatured: false, tags: ['samsung', 'galaxy tab', 's pen'],
  }),
  P({
    id: 'xiaomi-pad-6',
    name: 'Máy tính bảng Xiaomi Pad 6 8GB/256GB',
    brand: 'Xiaomi',
    brandId: 'xiaomi',
    category: 'Máy tính bảng',
    categoryId: 'tablets',
    price: 9490000,
    originalPrice: 10990000,
    image: IMG.tablet1,
    description: 'Tablet giải trí và học tập màn hình 11 inch 144Hz 2.8K, chip Snapdragon 870, 4 loa âm thanh vòm Dolby Atmos.',
    specs: { Chip: 'Snapdragon 870', Display: '11" 2.8K 144Hz', RAM: '8GB', Storage: '256GB' },
    stock: 35, rating: 4.7, isFeatured: false, tags: ['xiaomi', 'xiaomi pad 6', 'tablet'],
  }),

  // ── PHỤ KIỆN & GEAR (ACCESSORIES)
  P({
    id: 'logitech-mx-master-3s',
    name: 'Chuột không dây công thái học Logitech MX Master 3S',
    brand: 'Logitech',
    brandId: 'logitech',
    category: 'Phụ kiện & Gear',
    categoryId: 'accessories',
    price: 2290000,
    originalPrice: 2690000,
    image: IMG.mouse,
    description: 'Chuột cao cấp cho lập trình viên & thiết kế — cảm biến 8000 DPI Darkfield, cuộn siêu tốc MagSpeed, click êm ái Quiet Click.',
    specs: { DPI: '8000 DPI', 'Cuộn': 'MagSpeed điện từ', Pin: '70 ngày', 'Kết nối': 'Bolt + Bluetooth' },
    stock: 45, rating: 4.9, isFeatured: true, tags: ['logitech', 'mx master 3s', 'chuot'],
  }),
  P({
    id: 'logitech-mx-mechanical',
    name: 'Bàn phím cơ không dây Logitech MX Mechanical Mini',
    brand: 'Logitech',
    brandId: 'logitech',
    category: 'Phụ kiện & Gear',
    categoryId: 'accessories',
    price: 3390000,
    originalPrice: 3890000,
    image: IMG.keyboard,
    description: 'Bàn phím cơ low-profile gọn gàng, switch Tactile Quiet êm ái, đèn nền thông minh, gõ thoải mái cả ngày.',
    specs: { Switch: 'Tactile Quiet', Pin: '15 ngày (10 tháng tắt đèn)', Layout: '75% Mini' },
    stock: 25, rating: 4.8, isFeatured: false, tags: ['logitech', 'mx mechanical', 'ban phim co'],
  }),
];

async function seed() {
  console.log(`🚀 Bắt đầu cập nhật Database Firestore (${firebaseConfig.projectId})...\n`);

  console.log(`🏷️ 1. Cập nhật ${brands.length} Thương hiệu toàn cầu có thật...`);
  for (const b of brands) {
    await setDoc(doc(db, 'brands', b.id), b);
    console.log(`   + Brand: ${b.name}`);
  }

  console.log(`\n📦 2. Cập nhật ${categories.length} Danh mục ngành hàng...`);
  for (const c of categories) {
    await setDoc(doc(db, 'categories', c.id), c);
    console.log(`   + Category: ${c.name}`);
  }

  console.log(`\n📱 3. Cập nhật ${products.length} Sản phẩm nổi tiếng chuẩn giá VNĐ...`);
  for (const p of products) {
    await setDoc(doc(db, 'products', p.id), p);
    console.log(`   + [${p.categoryName}] ${p.name} -> ${p.price.toLocaleString('vi-VN')}₫`);
  }

  console.log('\n🔍 Kiểm tra tổng kết Firestore:');
  const catSnap = await getDocs(collection(db, 'categories'));
  const brandSnap = await getDocs(collection(db, 'brands'));
  const prodSnap = await getDocs(collection(db, 'products'));

  console.log(`  + categories: ${catSnap.size} docs`);
  console.log(`  + brands: ${brandSnap.size} docs`);
  console.log(`  + products: ${prodSnap.size} docs`);

  console.log('\n🎉 [Seed Firestore] Hoàn tất 100% dữ liệu sản phẩm hãng nổi tiếng toàn cầu!');
  await terminate(db);
  process.exit(0);
}

seed().catch(async (err) => {
  console.error('❌ Lỗi khi seed dữ liệu:', err);
  try {
    await terminate(db);
  } catch {}
  process.exit(1);
});
