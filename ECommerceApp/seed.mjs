import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  connectFirestoreEmulator,
  collection,
  getDocs,
} from 'firebase/firestore';

// 0. Load .env manually if running via node without --env-file
const envPath = path.resolve('.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  });
}

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

// Check if --emulator flag passed
const isEmulator = process.argv.includes('--emulator');
if (isEmulator) {
  console.log('⚡ Kết nối tới Firebase Emulator tại localhost:8080...');
  connectFirestoreEmulator(db, 'localhost', 8080);
}

// 1. DANH MỤC (CATEGORIES)
const categories = [
  { id: 'audio', name: 'Âm thanh', icon: 'headset-outline' },
  { id: 'phones', name: 'Điện thoại', icon: 'phone-portrait-outline' },
  { id: 'laptops', name: 'Laptop & Máy tính', icon: 'laptop-outline' },
  { id: 'accessories', name: 'Phụ kiện', icon: 'hardware-chip-outline' },
  { id: 'watches', name: 'Đồng hồ thông minh', icon: 'watch-outline' },
  { id: 'tablets', name: 'Máy tính bảng', icon: 'tablet-portrait-outline' },
  { id: 'gaming', name: 'Gaming & Gear', icon: 'game-controller-outline' },
];

// 2. THƯƠNG HIỆU (BRANDS)
const brands = [
  { id: 'aurasound', name: 'AuraSound', shortName: 'AS' },
  { id: 'pulse', name: 'Pulse', shortName: 'PL' },
  { id: 'stratus', name: 'Stratus', shortName: 'ST' },
  { id: 'tempo', name: 'Tempo', shortName: 'TP' },
  { id: 'vortex', name: 'Vortex', shortName: 'VX' },
];

// 3. VẬN CHUYỂN (SHIPPING METHODS)
const shippingMethods = [
  {
    id: 'ship_standard',
    type: 'standard',
    name: 'Giao hàng tiêu chuẩn',
    description: 'Tiết kiệm chi phí, phù hợp đơn hàng thông thường',
    estimatedDays: '3 - 5 ngày',
    fee: 30000,
    freeOver: 500000,
  },
  {
    id: 'ship_express',
    type: 'express',
    name: 'Giao hàng nhanh',
    description: 'Vận chuyển ưu tiên, đóng gói cẩn thận',
    estimatedDays: '1 - 2 ngày',
    fee: 45000,
    freeOver: 1000000,
  },
  {
    id: 'ship_sameday',
    type: 'sameDay',
    name: 'Hỏa tốc nội thành 2H',
    description: 'Nhận hàng ngay trong 2 giờ tại nội thành',
    estimatedDays: '2 giờ',
    fee: 65000,
    freeOver: 2000000,
  },
];

// 4. MÃ KHUYẾN MÃI (VOUCHERS)
const vouchers = [
  {
    id: 'v_discount10',
    code: 'DISCOUNT10',
    title: 'Giảm 10% đơn từ 200.000đ',
    type: 'percent',
    value: 10,
    minOrderValue: 200000,
    maxDiscount: 100000,
    startsAt: '2026-01-01T00:00:00Z',
    expiresAt: '2027-12-31T23:59:59Z',
    usageLimit: 1000,
    usedCount: 142,
    isActive: true,
  },
  {
    id: 'v_freeship',
    code: 'FREESHIP',
    title: 'Miễn phí vận chuyển toàn quốc',
    type: 'freeShip',
    value: 0,
    minOrderValue: 300000,
    startsAt: '2026-01-01T00:00:00Z',
    expiresAt: '2027-12-31T23:59:59Z',
    usageLimit: 500,
    usedCount: 88,
    isActive: true,
  },
  {
    id: 'v_welcome50',
    code: 'WELCOME50',
    title: 'Giảm 50.000đ cho khách hàng mới',
    type: 'fixed',
    value: 50000,
    minOrderValue: 250000,
    startsAt: '2026-01-01T00:00:00Z',
    expiresAt: '2027-12-31T23:59:59Z',
    usageLimit: 2000,
    usedCount: 310,
    isActive: true,
  },
  {
    id: 'v_vip100',
    code: 'VIP100',
    title: 'Giảm 100.000đ cho đơn hàng giá trị cao',
    type: 'fixed',
    value: 100000,
    minOrderValue: 1500000,
    startsAt: '2026-01-01T00:00:00Z',
    expiresAt: '2027-12-31T23:59:59Z',
    usageLimit: 200,
    usedCount: 19,
    isActive: true,
  },
];

// 5. SẢN PHẨM (PRODUCTS)
const products = [
  {
    id: 'prod_aurabeats_pro',
    name: 'Tai nghe Bluetooth AuraSound Studio Pro Active Noise Cancelling',
    price: 3200000,
    originalPrice: 4000000,
    description: 'Âm thanh Hi-Res Audio chuẩn phòng thu, chống ồn chủ động ANC thế hệ mới, pin bền bỉ 40 giờ liên tục, đệm tai mút hoạt tính êm ái.',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80',
    category: 'Âm thanh',
    categoryId: 'audio',
    brandId: 'aurasound',
    brandName: 'AuraSound',
    rating: 4.8,
    reviewCount: 356,
    soldCount: 840,
    stock: 50,
    badge: 'hot',
    tags: ['tainghe', 'bluetooth', 'chongon', 'anc', 'aurasound'],
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=700&auto=format&fit=crop&q=80',
    ],
    variants: [
      { id: 'black', name: 'Đen Huyền Bí', type: 'color', inStock: 30 },
      { id: 'silver', name: 'Bạc Ánh Kim', type: 'color', inStock: 20 },
    ],
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'prod_tempo_watch_pro',
    name: 'Đồng hồ thông minh Tempo Watch Ultra Titan thể thao chuyên sâu',
    price: 8500000,
    originalPrice: 9900000,
    description: 'Vỏ titan chuẩn quân đội, màn hình sapphire siêu sáng 2000 nits, định vị GPS tần số kép chuyên sâu cho chạy bộ, leo núi và bơi lội.',
    imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=700&auto=format&fit=crop&q=80',
    category: 'Đồng hồ thông minh',
    categoryId: 'watches',
    brandId: 'tempo',
    brandName: 'Tempo',
    rating: 4.9,
    reviewCount: 420,
    soldCount: 650,
    stock: 25,
    badge: 'sale',
    tags: ['dongho', 'smartwatch', 'tempo', 'thethao', 'gps'],
    images: [
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=700&auto=format&fit=crop&q=80',
    ],
    variants: [
      { id: 'titanium_gray', name: 'Titan Tự Nhiên', type: 'color', inStock: 15 },
      { id: 'titanium_black', name: 'Đen Titan', type: 'color', inStock: 10 },
    ],
    createdAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'prod_pulse_11_ultra',
    name: 'Điện thoại flagship Pulse 11 Ultra 5G camera tiềm vọng 100x',
    price: 21990000,
    originalPrice: 24990000,
    description: 'Vi xử lý 3nm đỉnh cao, màn hình Dynamic AMOLED 2K 120Hz mượt mà, cụm 4 camera Zeiss 200MP chống rung OIS kép, sạc nhanh 120W.',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700&auto=format&fit=crop&q=80',
    category: 'Điện thoại',
    categoryId: 'phones',
    brandId: 'pulse',
    brandName: 'Pulse',
    rating: 4.9,
    reviewCount: 512,
    soldCount: 920,
    stock: 40,
    badge: 'hot',
    tags: ['dienthoai', 'smartphone', '5g', 'pulse', 'flagship'],
    images: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700&auto=format&fit=crop&q=80',
    ],
    variants: [
      { id: 'blue_titan', name: 'Xanh Titan 256GB', type: 'storage', inStock: 25 },
      { id: 'black_shadow', name: 'Đen Huyền Bí 512GB', type: 'storage', inStock: 15 },
    ],
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'prod_stratus_pro_14',
    name: 'Laptop cao cấp Stratus Pro 14 Màn hình OLED 3K 120Hz',
    price: 28500000,
    originalPrice: 32000000,
    description: 'Trọng lượng chỉ 1.2kg siêu nhẹ, vỏ hợp kim magie nguyên khối, thời lượng pin 18 giờ, chip AI NPU thế hệ mới tối ưu đồ họa lập trình.',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=700&auto=format&fit=crop&q=80',
    category: 'Laptop & Máy tính',
    categoryId: 'laptops',
    brandId: 'stratus',
    brandName: 'Stratus',
    rating: 4.7,
    reviewCount: 198,
    soldCount: 340,
    stock: 18,
    badge: 'new',
    tags: ['laptop', 'maytinh', 'stratus', 'oled', 'ultrabook'],
    images: [
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=700&auto=format&fit=crop&q=80',
    ],
    variants: [
      { id: 'ram16_512', name: '16GB RAM / 512GB SSD', type: 'storage', inStock: 10 },
      { id: 'ram32_1tb', name: '32GB RAM / 1TB SSD', type: 'storage', inStock: 8 },
    ],
    createdAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'prod_vortex_gaming',
    name: 'Tai nghe gaming âm thanh vòm Vortex Surround Sound 7.1',
    price: 1850000,
    originalPrice: 2300000,
    description: 'Định vị bước chân chuẩn xác, củ loa Neodymium 50mm, micro lọc tiếng ồn chuẩn eSports, đèn LED RGB Chroma 16.8 triệu màu.',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=700&auto=format&fit=crop&q=80',
    category: 'Gaming & Gear',
    categoryId: 'gaming',
    brandId: 'vortex',
    brandName: 'Vortex',
    rating: 4.6,
    reviewCount: 230,
    soldCount: 710,
    stock: 60,
    badge: 'sale',
    tags: ['gaming', 'tainghe', 'vortex', 'rgb', 'esports'],
    images: [
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=700&auto=format&fit=crop&q=80',
    ],
    variants: [
      { id: 'black_rgb', name: 'Đen RGB', type: 'color', inStock: 40 },
      { id: 'white_rgb', name: 'Trắng Tuyết RGB', type: 'color', inStock: 20 },
    ],
    createdAt: '2026-02-05T09:00:00Z',
  },
  {
    id: 'prod_stratus_band',
    name: 'Vòng đeo tay thông minh theo dõi sức khoẻ Stratus Fit 3',
    price: 990000,
    originalPrice: 1290000,
    description: 'Màn hình AMOLED cong, đo nhịp tim liên tục 24/7, SpO2, theo dõi giấc ngủ chuẩn y khoa, chống nước 5ATM đi bơi thoải mái.',
    imageUrl: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=700&auto=format&fit=crop&q=80',
    category: 'Đồng hồ thông minh',
    categoryId: 'watches',
    brandId: 'stratus',
    brandName: 'Stratus',
    rating: 4.5,
    reviewCount: 310,
    soldCount: 1200,
    stock: 100,
    badge: 'hot',
    tags: ['vongtay', 'fitness', 'stratus', 'thethao', 'spo2'],
    images: [
      'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=700&auto=format&fit=crop&q=80',
    ],
    variants: [
      { id: 'black', name: 'Đen Thể Thao', type: 'color', inStock: 60 },
      { id: 'pink', name: 'Hồng Pastel', type: 'color', inStock: 40 },
    ],
    createdAt: '2026-02-10T10:00:00Z',
  },
  {
    id: 'prod_aurasound_mini',
    name: 'Loa di động không dây chống nước AuraSound BassGo 2',
    price: 1450000,
    originalPrice: 1790000,
    description: 'Công suất 30W uy lực, màng loa bass thụ động kép, chuẩn kháng nước kháng bụi IP67, kết nối đa loa PartySync khuấy động không gian.',
    imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=700&auto=format&fit=crop&q=80',
    category: 'Âm thanh',
    categoryId: 'audio',
    brandId: 'aurasound',
    brandName: 'AuraSound',
    rating: 4.8,
    reviewCount: 180,
    soldCount: 560,
    stock: 45,
    badge: 'sale',
    tags: ['loa', 'bluetooth', 'aurasound', 'bassgo', 'chongnuoc'],
    images: [
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=700&auto=format&fit=crop&q=80',
    ],
    variants: [
      { id: 'blue', name: 'Xanh Biển Sâu', type: 'color', inStock: 25 },
      { id: 'camo', name: 'Rằn Ri Quân Đội', type: 'color', inStock: 20 },
    ],
    createdAt: '2026-02-15T11:00:00Z',
  },
  {
    id: 'prod_pulse_pad_12',
    name: 'Máy tính bảng đồ họa Pulse Tab Pro 12 kèm bút cảm ứng',
    price: 15990000,
    originalPrice: 17990000,
    description: 'Màn hình 120Hz chống chói viền siêu mỏng, nhận diện lực 4096 mức độ, hỗ trợ chế độ PC đa nhiệm, pin khủng 10.000 mAh.',
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=700&auto=format&fit=crop&q=80',
    category: 'Máy tính bảng',
    categoryId: 'tablets',
    brandId: 'pulse',
    brandName: 'Pulse',
    rating: 4.8,
    reviewCount: 145,
    soldCount: 390,
    stock: 22,
    badge: 'new',
    tags: ['tablet', 'maytinhbang', 'pulse', 'butcamung', 'pro'],
    images: [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=700&auto=format&fit=crop&q=80',
    ],
    variants: [
      { id: 'wifi_128', name: 'Wi-Fi 128GB', type: 'storage', inStock: 12 },
      { id: '5g_256', name: '5G + Wi-Fi 256GB', type: 'storage', inStock: 10 },
    ],
    createdAt: '2026-02-20T14:00:00Z',
  },
];

// 6. NGƯỜI DÙNG MẪU & SUBCOLLECTIONS (USERS)
const users = [
  {
    uid: 'user_alex_carter',
    email: 'alex.carter@example.com',
    fullName: 'Trần Minh Alex',
    displayName: 'Alex Carter',
    phoneNumber: '0901284920',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    isGuest: false,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    uid: 'user_thanh_toan',
    email: 'thanhtoan@example.com',
    fullName: 'Trần Thanh Toàn',
    displayName: 'Thanh Toan',
    phoneNumber: '0912345678',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    isGuest: false,
    createdAt: '2026-01-02T00:00:00Z',
  },
];

// 7. ĐƠN HÀNG MẪU (ORDERS)
const orders = [
  {
    id: 'ORD-21530',
    userId: 'user_alex_carter',
    customerName: 'Trần Minh Alex',
    phoneNumber: '0901284920',
    shippingAddress: 'Tòa nhà Landmark 81, 720A Điện Biên Phủ, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh',
    items: [
      {
        productId: 'prod_aurabeats_pro',
        name: 'Tai nghe Bluetooth AuraSound Studio Pro Active Noise Cancelling',
        price: 3200000,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80',
        variantName: 'Đen Huyền Bí',
      },
    ],
    subtotal: 3200000,
    shippingFee: 30000,
    tax: 256000,
    discount: 320000,
    voucherCode: 'DISCOUNT10',
    totalAmount: 3166000,
    status: 'pending',
    currentStep: 1,
    canCancel: true,
    paymentMethodName: 'Thẻ Visa •••• 4242',
    shippingMethodName: 'Giao hàng tiêu chuẩn',
    timeline: [
      {
        key: 'created',
        label: 'Đặt hàng thành công',
        icon: 'checkmark-circle',
        date: '2026-03-01T10:30:00Z',
        completed: true,
      },
      {
        key: 'processing',
        label: 'Đang chuẩn bị kiện hàng',
        icon: 'cube',
        date: '2026-03-01T11:00:00Z',
        completed: false,
      },
    ],
    createdAt: '2026-03-01T10:30:00Z',
  },
];

// 8. FAQS & SUPPORT
const faqGroups = [
  { id: 'order', name: 'Đơn hàng & Thanh toán' },
  { id: 'shipping', name: 'Vận chuyển & Giao nhận' },
  { id: 'returns', name: 'Đổi trả & Bảo hành' },
];

const faqs = [
  {
    id: 'faq_1',
    groupId: 'order',
    question: 'Tôi có thể huỷ đơn hàng sau khi đặt không?',
    answer: 'Bạn có thể huỷ đơn hàng khi đơn ở trạng thái Chờ xử lý hoặc Đang chuẩn bị bằng cách vào Chi tiết đơn hàng và bấm nút Huỷ đơn.',
  },
  {
    id: 'faq_2',
    groupId: 'shipping',
    question: 'Thời gian giao hàng mất bao lâu?',
    answer: 'Giao tiêu chuẩn từ 3-5 ngày, giao nhanh từ 1-2 ngày và hỏa tốc nội thành trong 2 giờ.',
  },
];

const popularSearches = [
  { id: 'ps_1', keyword: 'Tai nghe chống ồn', count: 1250 },
  { id: 'ps_2', keyword: 'Đồng hồ thông minh', count: 980 },
  { id: 'ps_3', keyword: 'Laptop OLED', count: 740 },
  { id: 'ps_4', keyword: 'Điện thoại 5G', count: 620 },
];

async function seedDatabase() {
  console.log('🚀 Bắt đầu seed dữ liệu Firestore chuẩn sản phẩm...\n');

  // Categories
  console.log(`📦 1. Seeding ${categories.length} categories...`);
  for (const item of categories) {
    await setDoc(doc(db, 'categories', item.id), item);
  }

  // Brands
  console.log(`🏷️ 2. Seeding ${brands.length} brands...`);
  for (const item of brands) {
    await setDoc(doc(db, 'brands', item.id), item);
  }

  // Shipping Methods
  console.log(`🚚 3. Seeding ${shippingMethods.length} shipping methods...`);
  for (const item of shippingMethods) {
    await setDoc(doc(db, 'shippingMethods', item.id), item);
  }

  // Vouchers
  console.log(`🎟️ 4. Seeding ${vouchers.length} vouchers (and sync promos)...`);
  for (const item of vouchers) {
    await setDoc(doc(db, 'vouchers', item.code), item);
    // Also sync to promos for backwards compatibility
    await setDoc(doc(db, 'promos', item.code), {
      code: item.code,
      discountPercent: item.type === 'percent' ? item.value : 0,
      description: item.title,
    });
  }

  // Products
  console.log(`📱 5. Seeding ${products.length} products...`);
  for (const item of products) {
    await setDoc(doc(db, 'products', item.id), item);
  }

  // Users & Subcollections
  console.log(`👤 6. Seeding ${users.length} users with addresses, cards & settings...`);
  for (const user of users) {
    await setDoc(doc(db, 'users', user.uid), user);

    // Seed default address
    await setDoc(doc(db, 'users', user.uid, 'addresses', 'addr_home'), {
      id: 'addr_home',
      label: 'Nhà riêng',
      fullName: user.fullName,
      phone: user.phoneNumber,
      address: '248 Đường Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh',
      isDefault: true,
    });

    // Seed default payment method
    await setDoc(doc(db, 'users', user.uid, 'paymentMethods', 'card_visa_default'), {
      id: 'card_visa_default',
      type: 'card',
      name: 'Visa Platinum',
      detail: 'Visa •••• 4242',
      expiry: '12/28',
      isDefault: true,
      color: '#1E3A8A',
    });

    // Seed user settings
    await setDoc(doc(db, 'users', user.uid, 'settings', 'app'), {
      language: 'vi',
      currency: 'VND',
      darkMode: false,
      pushEnabled: true,
      emailEnabled: true,
      biometricEnabled: false,
    });
  }

  // Orders
  console.log(`🧾 7. Seeding ${orders.length} orders...`);
  for (const order of orders) {
    await setDoc(doc(db, 'orders', order.id), order);
  }

  // FAQs
  console.log(`❓ 8. Seeding FAQs & Support...`);
  for (const g of faqGroups) {
    await setDoc(doc(db, 'faqGroups', g.id), g);
  }
  for (const f of faqs) {
    await setDoc(doc(db, 'faqs', f.id), f);
  }
  for (const ps of popularSearches) {
    await setDoc(doc(db, 'popularSearches', ps.id), ps);
  }

  console.log('\n🔍 Kiểm tra xác minh số lượng document sau seed:');
  const catSnap = await getDocs(collection(db, 'categories'));
  const brandSnap = await getDocs(collection(db, 'brands'));
  const prodSnap = await getDocs(collection(db, 'products'));
  const voucherSnap = await getDocs(collection(db, 'vouchers'));
  const shipSnap = await getDocs(collection(db, 'shippingMethods'));
  const orderSnap = await getDocs(collection(db, 'orders'));

  console.log(`  + categories: ${catSnap.size} docs`);
  console.log(`  + brands: ${brandSnap.size} docs`);
  console.log(`  + products: ${prodSnap.size} docs`);
  console.log(`  + vouchers: ${voucherSnap.size} docs`);
  console.log(`  + shippingMethods: ${shipSnap.size} docs`);
  console.log(`  + orders: ${orderSnap.size} docs`);

  console.log('\n🎉 [Seed Firestore] Hoàn tất 100% dữ liệu!');
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('❌ Lỗi seed database:', err);
  process.exit(1);
});
