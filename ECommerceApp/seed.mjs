import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCPkVyg1V7erOSe2KWUvp9pDfO5EgVsJs4",
  authDomain: "e-commerce-market-e2875.firebaseapp.com",
  projectId: "e-commerce-market-e2875",
  storageBucket: "e-commerce-market-e2875.firebasestorage.app",
  messagingSenderId: "794360087185",
  appId: "1:794360087185:web:ee816e20e5d8d6d1cb3530",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 1. DANH MỤC (CATEGORIES) - Tên field tiếng Anh, nội dung tiếng Việt
const categories = [
  {
    id: 'audio',
    name: 'Âm thanh',
    icon: 'headphones',
    productCount: 4,
  },
  {
    id: 'phones',
    name: 'Điện thoại',
    icon: 'smartphone',
    productCount: 3,
  },
  {
    id: 'laptops',
    name: 'Laptop & Máy tính',
    icon: 'laptop',
    productCount: 2,
  },
  {
    id: 'accessories',
    name: 'Phụ kiện & Đồng hồ',
    icon: 'watch',
    productCount: 3,
  },
];

// 2. THƯƠNG HIỆU (BRANDS) - Khớp 5 thương hiệu trong màn hình Filter
const brands = [
  { id: 'aurasound', name: 'AuraSound' },
  { id: 'pulse', name: 'Pulse' },
  { id: 'stratus', name: 'Stratus' },
  { id: 'tempo', name: 'Tempo' },
  { id: 'vortex', name: 'Vortex' },
];

// 3. DANH SÁCH SẢN PHẨM (PRODUCTS) - Nội dung 100% tiếng Việt
const products = [
  // --- ÂM THANH ---
  {
    id: 'prod_aurabeats_pro',
    name: 'Tai nghe chống ồn không dây AuraBeats Pro',
    brand: 'AuraSound',
    category: 'Âm thanh',
    categoryId: 'audio',
    price: 249,
    originalPrice: 299,
    discountPercent: 17,
    rating: 4.8,
    reviewCount: 1284,
    stock: 24,
    inStock: true,
    description: 'Tai nghe trùm đầu chống ồn chủ động đỉnh cao với thời lượng pin 40 giờ. Hỗ trợ âm thanh vòm không gian đa chiều, đệm tai bọc da êm ái thoáng khí suốt ngày dài.',
    colors: [
      { name: 'Đen Carbon', hex: '#1C1C1E' },
      { name: 'Xám Bạc', hex: '#D1D5DB' },
      { name: 'Nâu Đồng', hex: '#9A5B42' },
    ],
    variants: ['Bản Tiêu Chuẩn', 'Kèm Hộp Đựng Cao Cấp'],
    imageUrls: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=700&auto=format&fit=crop&q=80',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80',
    isFeatured: true,
    isFlashSale: true,
  },
  {
    id: 'prod_vortex_gaming',
    name: 'Tai nghe gaming âm thanh vòm Vortex 7.1',
    brand: 'Vortex',
    category: 'Âm thanh',
    categoryId: 'audio',
    price: 149,
    originalPrice: 199,
    discountPercent: 25,
    rating: 4.6,
    reviewCount: 320,
    stock: 30,
    inStock: true,
    description: 'Tai nghe thi đấu chuyên nghiệp tích hợp giả lập âm thanh vòm 7.1, mic đàm thoại lọc tạp âm chống ồn và dải đèn LED RGB nổi bật.',
    colors: [
      { name: 'Đen Huyền Bí', hex: '#000000' },
      { name: 'Trắng Neon', hex: '#FFFFFF' },
    ],
    variants: ['Cổng Cắm USB', 'Không Dây 2.4GHz'],
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=700&auto=format&fit=crop&q=80',
    isFeatured: true,
    isFlashSale: false,
  },
  {
    id: 'prod_aurasound_earbuds',
    name: 'Tai nghe nhét tai không dây AuraSound ANC',
    brand: 'AuraSound',
    category: 'Âm thanh',
    categoryId: 'audio',
    price: 129,
    originalPrice: 159,
    discountPercent: 19,
    rating: 4.7,
    reviewCount: 560,
    stock: 45,
    inStock: true,
    description: 'Thiết kế nhét tai siêu nhỏ gọn bám chắc hốc tai, chuẩn kháng nước IPX5 và hộp sạc hỗ trợ sạc nhanh không dây chuẩn Qi.',
    colors: [
      { name: 'Trắng Ngọc Trai', hex: '#F9FAFB' },
      { name: 'Đen Nhám', hex: '#111827' },
    ],
    variants: ['Bản Tiêu Chuẩn'],
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=700&auto=format&fit=crop&q=80',
    isFeatured: false,
    isFlashSale: true,
  },
  {
    id: 'prod_tempo_soundbar',
    name: 'Loa thanh rạp hát gia đình Tempo Soundbar Dolby Atmos',
    brand: 'Tempo',
    category: 'Âm thanh',
    categoryId: 'audio',
    price: 399,
    originalPrice: 499,
    discountPercent: 20,
    rating: 4.9,
    reviewCount: 140,
    stock: 12,
    inStock: true,
    description: 'Tái tạo không gian âm thanh rạp chiếu phim 3D chân thực với loa siêu trầm sub-woofer không dây uy lực và kết nối HDMI eARC.',
    colors: [{ name: 'Đen Tuyền', hex: '#111827' }],
    variants: ['Bản Tiêu Chuẩn'],
    imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=700&auto=format&fit=crop&q=80',
    isFeatured: false,
    isFlashSale: false,
  },

  // --- ĐIỆN THOẠI ---
  {
    id: 'prod_pulse_11_ultra',
    name: 'Điện thoại thông minh Pulse 11 Ultra 5G',
    brand: 'Pulse',
    category: 'Điện thoại',
    categoryId: 'phones',
    price: 899,
    originalPrice: 1099,
    discountPercent: 18,
    rating: 4.9,
    reviewCount: 850,
    stock: 15,
    inStock: true,
    description: 'Siêu phẩm flagship trang bị màn hình AMOLED 120Hz mượt mà, camera tiềm vọng zoom xa 100x và vi xử lý hàng đầu xử lý tác vụ cực nhanh.',
    colors: [
      { name: 'Xanh Titan', hex: '#3B82F6' },
      { name: 'Đen Huyền Bí', hex: '#000000' },
      { name: 'Trắng Gốm', hex: '#FFFFFF' },
    ],
    variants: ['256GB / 12GB RAM', '512GB / 16GB RAM', '1TB / 16GB RAM'],
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700&auto=format&fit=crop&q=80',
    isFeatured: true,
    isFlashSale: true,
  },
  {
    id: 'prod_pulse_note_12',
    name: 'Điện thoại màn hình lớn Pulse Note 12 Pro',
    brand: 'Pulse',
    category: 'Điện thoại',
    categoryId: 'phones',
    price: 699,
    originalPrice: 799,
    discountPercent: 12,
    rating: 4.7,
    reviewCount: 290,
    stock: 22,
    inStock: true,
    description: 'Tích hợp sẵn bút cảm ứng kỹ thuật số, màn hình cong tràn viền 6.8 inch và viên pin dung lượng lớn 6000mAh hỗ trợ sạc siêu tốc.',
    colors: [
      { name: 'Xanh Rừng Sâu', hex: '#065F46' },
      { name: 'Đen Thạch Anh', hex: '#18181B' },
    ],
    variants: ['128GB / 8GB RAM', '256GB / 8GB RAM'],
    imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=700&auto=format&fit=crop&q=80',
    isFeatured: true,
    isFlashSale: false,
  },
  {
    id: 'prod_vortex_phone',
    name: 'Điện thoại chuyên game Vortex Phone Z5',
    brand: 'Vortex',
    category: 'Điện thoại',
    categoryId: 'phones',
    price: 799,
    originalPrice: 949,
    discountPercent: 16,
    rating: 4.8,
    reviewCount: 175,
    stock: 18,
    inStock: true,
    description: 'Nút trigger cảm ứng lực ở hai cạnh viền, hệ thống tản nhiệt buồng hơi kép và màn hình siêu mượt với tần số quét 165Hz.',
    colors: [{ name: 'Đen Cam Thể Thao', hex: '#18181B' }],
    variants: ['256GB / 16GB RAM', '512GB / 24GB RAM'],
    imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=700&auto=format&fit=crop&q=80',
    isFeatured: false,
    isFlashSale: false,
  },

  // --- LAPTOP & MÁY TÍNH ---
  {
    id: 'prod_stratusbook_14',
    name: 'Laptop siêu mỏng nhẹ StratusBook Pro 14 M3',
    brand: 'Stratus',
    category: 'Laptop & Máy tính',
    categoryId: 'laptops',
    price: 1299,
    originalPrice: 1499,
    discountPercent: 13,
    rating: 4.9,
    reviewCount: 420,
    stock: 10,
    inStock: true,
    description: 'Vỏ nhôm nguyên khối hàng không sang trọng, màn hình Liquid Retina 120Hz siêu nét và thời lượng pin cả ngày dài lên tới 22 tiếng.',
    colors: [
      { name: 'Xám Không Gian', hex: '#4B5563' },
      { name: 'Bạc Ánh Kim', hex: '#E5E7EB' },
    ],
    variants: ['16GB RAM / 512GB SSD', '32GB RAM / 1TB SSD'],
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=700&auto=format&fit=crop&q=80',
    isFeatured: true,
    isFlashSale: false,
  },
  {
    id: 'prod_stratus_gaming_16',
    name: 'Laptop gaming hiệu năng cao Stratus Titan 16',
    brand: 'Stratus',
    category: 'Laptop & Máy tính',
    categoryId: 'laptops',
    price: 1699,
    originalPrice: 1899,
    discountPercent: 10,
    rating: 4.8,
    reviewCount: 150,
    stock: 8,
    inStock: true,
    description: 'Sức mạnh đồ họa đỉnh cao với card RTX 4080, vi xử lý Core i9, bàn phím cơ quang học RGB và màn hình chuẩn màu eSports 240Hz.',
    colors: [{ name: 'Đen Nhám Titan', hex: '#09090B' }],
    variants: ['32GB RAM / 1TB SSD', '64GB RAM / 2TB SSD'],
    imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=700&auto=format&fit=crop&q=80',
    isFeatured: false,
    isFlashSale: false,
  },

  // --- PHỤ KIỆN & ĐỒNG HỒ ---
  {
    id: 'prod_tempo_watch',
    name: 'Đồng hồ thông minh thể thao Tempo Watch Active 2',
    brand: 'Tempo',
    category: 'Phụ kiện & Đồng hồ',
    categoryId: 'accessories',
    price: 199,
    originalPrice: 249,
    discountPercent: 20,
    rating: 4.7,
    reviewCount: 310,
    stock: 30,
    inStock: true,
    description: 'Màn hình AMOLED sắc nét, đo điện tâm đồ ECG, định vị GPS kép độc lập, chuẩn chống nước 5ATM và pin dùng 14 ngày.',
    colors: [
      { name: 'Đen Midnight', hex: '#18181B' },
      { name: 'Hồng Vàng', hex: '#FB7185' },
      { name: 'Bạc Trắng', hex: '#E2E8F0' },
    ],
    variants: ['Mặt 40mm', 'Mặt 44mm'],
    imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=700&auto=format&fit=crop&q=80',
    isFeatured: true,
    isFlashSale: true,
  },
  {
    id: 'prod_vortex_keyboard',
    name: 'Bàn phím cơ tuỳ biến Vortex K8 Hot-swap',
    brand: 'Vortex',
    category: 'Phụ kiện & Đồng hồ',
    categoryId: 'accessories',
    price: 119,
    originalPrice: 149,
    discountPercent: 20,
    rating: 4.8,
    reviewCount: 430,
    stock: 35,
    inStock: true,
    description: 'Cấu trúc đệm Gasket-mount gõ cực êm, switch đã bôi trơn sẵn mượt mà, lót foam tiêu âm cao cấp và kết nối đa thiết bị.',
    colors: [
      { name: 'Xám Cổ Điển', hex: '#6B7280' },
      { name: 'Tím Cyberpunk', hex: '#8B5CF6' },
    ],
    variants: ['Switch Đỏ (Êm mượt)', 'Switch Nâu (Khấc nhẹ)'],
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&auto=format&fit=crop&q=80',
    isFeatured: false,
    isFlashSale: false,
  },
  {
    id: 'prod_tempo_ring',
    name: 'Nhẫn sức khoẻ thông minh Tempo Health Ring Gen 3',
    brand: 'Tempo',
    category: 'Phụ kiện & Đồng hồ',
    categoryId: 'accessories',
    price: 299,
    originalPrice: 349,
    discountPercent: 14,
    rating: 4.5,
    reviewCount: 95,
    stock: 12,
    inStock: true,
    description: 'Chất liệu Titanium siêu nhẹ chỉ 3g, cảm biến đo nhiệt độ da, chỉ số hồi phục thể lực và theo dõi các giai đoạn giấc ngủ chuyên sâu.',
    colors: [
      { name: 'Đen Tàng Hình', hex: '#18181B' },
      { name: 'Bạc Tráng Gương', hex: '#E5E7EB' },
      { name: 'Vàng Hoàng Gia', hex: '#FBBF24' },
    ],
    variants: ['Size 8', 'Size 9', 'Size 10', 'Size 11'],
    imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=700&auto=format&fit=crop&q=80',
    isFeatured: false,
    isFlashSale: false,
  },
];

// 4. DANH SÁCH NGƯỜI DÙNG TEST (USERS) - Tên field tiếng Anh, thông tin tiếng Việt
const users = [
  {
    id: 'user_alex_carter',
    fullName: 'Trần Minh Alex',
    email: 'alex.carter@novatech.io',
    phoneNumber: '+84 901 284 920',
    membershipBadge: 'THÀNH VIÊN PRO',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    role: 'customer',
    orderCount: 1,
    wishlistCount: 1,
    shippingAddresses: [
      {
        id: 'addr_home',
        type: 'Nhà riêng',
        isDefault: true,
        recipientName: 'Trần Minh Alex',
        phoneNumber: '+84 901 284 920',
        fullAddress: '248 Đường Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh',
      },
      {
        id: 'addr_work',
        type: 'Văn phòng',
        isDefault: false,
        recipientName: 'Trần Minh Alex',
        phoneNumber: '+84 901 284 920',
        fullAddress: 'Tòa nhà Bitexco, Tầng 12, Số 2 Hải Triều, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      },
    ],
    paymentMethods: [
      {
        id: 'pay_visa_4290',
        type: 'Thẻ Visa',
        isDefault: true,
        last4: '4290',
      },
      {
        id: 'pay_momo',
        type: 'Ví MoMo',
        isDefault: false,
        accountName: 'alex.carter@novatech',
      },
    ],
    notifications: {
      orderUpdates: true,
      promotionsOffers: true,
      newArrivals: false,
      reviewReminders: true,
    },
    favouriteProductIds: ['prod_aurabeats_pro'],
  },
  {
    id: 'user_toan_tran',
    fullName: 'Trần Văn Toàn',
    email: 'toan.tran172005@gmail.com',
    phoneNumber: '+84 901 234 567',
    membershipBadge: 'THÀNH VIÊN PRO',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
    role: 'customer',
    orderCount: 2,
    wishlistCount: 3,
    shippingAddresses: [
      {
        id: 'addr_toan_home',
        type: 'Nhà riêng',
        isDefault: true,
        recipientName: 'Trần Văn Toàn',
        phoneNumber: '+84 901 234 567',
        fullAddress: 'Số 12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh',
      },
    ],
    paymentMethods: [
      {
        id: 'pay_toan_visa',
        type: 'Thẻ Visa',
        isDefault: true,
        last4: '8834',
      },
    ],
    notifications: {
      orderUpdates: true,
      promotionsOffers: true,
      newArrivals: true,
      reviewReminders: true,
    },
    favouriteProductIds: ['prod_pulse_11_ultra', 'prod_stratusbook_14'],
  },
  {
    id: 'user_phuong_dev',
    fullName: 'Nguyễn Thu Phương',
    email: 'phuong.nguyen@novatech.io',
    phoneNumber: '+84 912 345 678',
    membershipBadge: 'THÀNH VIÊN VÀNG',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    role: 'customer',
    orderCount: 0,
    wishlistCount: 2,
    shippingAddresses: [
      {
        id: 'addr_phuong_home',
        type: 'Nhà riêng',
        isDefault: true,
        recipientName: 'Nguyễn Thu Phương',
        phoneNumber: '+84 912 345 678',
        fullAddress: 'Số 88 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      },
    ],
    paymentMethods: [],
    notifications: {
      orderUpdates: true,
      promotionsOffers: false,
      newArrivals: true,
      reviewReminders: false,
    },
    favouriteProductIds: ['prod_tempo_watch'],
  },
  {
    id: 'user_admin',
    fullName: 'Quản Trị Viên Hệ Thống',
    email: 'admin@novatech.io',
    phoneNumber: '+84 900 001 111',
    membershipBadge: 'QUẢN TRỊ VIÊN',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    role: 'admin',
    orderCount: 0,
    wishlistCount: 0,
    shippingAddresses: [],
    paymentMethods: [],
    notifications: {
      orderUpdates: true,
      promotionsOffers: true,
      newArrivals: true,
      reviewReminders: true,
    },
    favouriteProductIds: [],
  },
];

// 5. ĐƠN HÀNG (ORDERS) - Khớp 100% đơn #ORD-21530, hỗ trợ quy trình Hủy đơn hàng
const orders = [
  {
    id: 'ORD-21530',
    userId: 'user_alex_carter',
    customerName: 'Trần Minh Alex',
    phoneNumber: '+84 901 284 920',
    shippingAddress: '248 Đường Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh',
    date: '27/10/2026',
    itemCount: 1,
    subtotal: 249.00,
    shippingFee: 5.00,
    discountAmount: 0.00,
    totalAmount: 249.00,
    status: 'Đang xử lý', // Tiến trình: Đã đặt hàng -> Đang đóng gói -> Đang giao hàng -> Đã giao thành công / Đã hủy
    currentStep: 2, // 1: Đã đặt, 2: Đóng gói, 3: Vận chuyển, 4: Đã giao
    canCancel: true, // Đang xử lý nên được phép Hủy đơn
    cancelReason: '',
    cancelledAt: '',
    paymentMethod: 'Thẻ Visa ···· 4290',
    items: [
      {
        productId: 'prod_aurabeats_pro',
        brand: 'AuraSound',
        name: 'Tai nghe chống ồn không dây AuraBeats Pro',
        variant: 'Đen Carbon · Bản Tiêu Chuẩn',
        price: 249.00,
        originalPrice: 299.00,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'ORD-19842',
    userId: 'user_toan_tran',
    customerName: 'Trần Văn Toàn',
    phoneNumber: '+84 901 234 567',
    shippingAddress: 'Số 12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh',
    date: '20/10/2026',
    itemCount: 2,
    subtotal: 1098.00,
    shippingFee: 0.00,
    discountAmount: 50.00,
    totalAmount: 1048.00,
    status: 'Đã giao thành công',
    currentStep: 4,
    canCancel: false, // Đã giao rồi thì không được hủy
    cancelReason: '',
    cancelledAt: '',
    paymentMethod: 'Thẻ Visa ···· 8834',
    items: [
      {
        productId: 'prod_pulse_11_ultra',
        brand: 'Pulse',
        name: 'Điện thoại thông minh Pulse 11 Ultra 5G',
        variant: 'Xanh Titan · 256GB',
        price: 899.00,
        originalPrice: 1099.00,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700&auto=format&fit=crop&q=80',
      },
      {
        productId: 'prod_tempo_watch',
        brand: 'Tempo',
        name: 'Đồng hồ thông minh thể thao Tempo Watch Active 2',
        variant: 'Đen Midnight · Mặt 44mm',
        price: 199.00,
        originalPrice: 249.00,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=700&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'ORD-16504',
    userId: 'user_alex_carter',
    customerName: 'Trần Minh Alex',
    phoneNumber: '+84 901 284 920',
    shippingAddress: '248 Đường Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh',
    date: '22/10/2026',
    itemCount: 1,
    subtotal: 149.00,
    shippingFee: 5.00,
    discountAmount: 0.00,
    totalAmount: 154.00,
    status: 'Đã hủy',
    currentStep: 0,
    canCancel: false,
    cancelReason: 'Đổi ý, muốn đổi sang sản phẩm khác',
    cancelledAt: '22/10/2026 14:35',
    paymentMethod: 'Thẻ Visa ···· 4290',
    items: [
      {
        productId: 'prod_vortex_gaming',
        brand: 'Vortex',
        name: 'Tai nghe gaming âm thanh vòm Vortex 7.1',
        variant: 'Đen Huyền Bí · Cổng Cắm USB',
        price: 149.00,
        originalPrice: 199.00,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=700&auto=format&fit=crop&q=80',
      },
    ],
  },
];

// 6. MÃ GIẢM GIÁ (PROMOS)
const promoCodes = [
  {
    code: 'NOVA10',
    discountPercent: 10,
    description: 'Giảm 10% cho toàn bộ phụ kiện công nghệ',
  },
  {
    code: 'FLASH20',
    discountPercent: 20,
    description: 'Giảm 20% cho đợt Flash Sale thiết bị âm thanh',
  },
  {
    code: 'WELCOME15',
    discountPercent: 15,
    description: 'Giảm 15% cho thành viên mới lần đầu mua sắm',
  },
];

async function seedFinalVietnameseDatabase() {
  console.log('🚀 Bắt đầu nạp dữ liệu tiếng Việt chuẩn vào Firebase Firestore...\n');

  // 1. Categories
  console.log('📦 1. Nạp Categories (Âm thanh, Điện thoại, Laptop & Máy tính, Phụ kiện & Đồng hồ)...');
  for (const cat of categories) {
    await setDoc(doc(db, 'categories', cat.id), cat);
    console.log(`   + Danh mục: ${cat.name}`);
  }

  // 2. Brands
  console.log('\n🏷️ 2. Nạp Brands (AuraSound, Pulse, Stratus, Tempo, Vortex)...');
  for (const b of brands) {
    await setDoc(doc(db, 'brands', b.id), b);
    console.log(`   + Hãng: ${b.name}`);
  }

  // 3. Products
  console.log('\n📱 3. Nạp Products (12 sản phẩm công nghệ tiếng Việt chuẩn)...');
  for (const p of products) {
    await setDoc(doc(db, 'products', p.id), p);
    console.log(`   + [${p.brand}] ${p.name} - $${p.price}`);
  }

  // 4. Users
  console.log('\n👤 4. Nạp Users (Trần Minh Alex, Trần Văn Toàn, Nguyễn Thu Phương, Quản trị viên)...');
  for (const u of users) {
    await setDoc(doc(db, 'users', u.id), u);
    console.log(`   + Người dùng: ${u.fullName} (${u.email}) - ${u.membershipBadge}`);
  }

  // 5. Orders
  console.log('\n🧾 5. Nạp Orders (Đơn hàng #ORD-21530 & #ORD-19842 bằng tiếng Việt)...');
  for (const o of orders) {
    await setDoc(doc(db, 'orders', o.id), o);
    console.log(`   + Đơn hàng #${o.id} - Tổng tiền: $${o.totalAmount} (${o.status})`);
  }

  // 6. Promos
  console.log('\n🎟️ 6. Nạp Promo Codes (NOVA10, FLASH20, WELCOME15)...');
  for (const promo of promoCodes) {
    await setDoc(doc(db, 'promos', promo.code), promo);
    console.log(`   + Mã giảm giá: ${promo.code} (-${promo.discountPercent}%) - ${promo.description}`);
  }

  console.log('\n🎉🎉🎉 HOÀN TẤT 100%! Toàn bộ 6 collections đã được chuyển sang Tiếng Việt chuẩn chỉnh!');
  process.exit(0);
}

seedFinalVietnameseDatabase().catch((err) => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
