import { BRANDS } from './brands';
import { Product, ProductVariant } from '../types';

/* Ảnh minh hoạ từ Unsplash (đã kiểm tra) và picsum (seed cố định). */
const pic = (seed: string) => `https://picsum.photos/seed/${seed}/600/600`;

const U = {
  headphone:
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  watch:
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
  phone:
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
  laptop:
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
  gamingHeadset:
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80',
  sneaker:
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
  backpack:
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
};

type Badge = 'sale' | 'new' | 'hot';

interface ProductInput {
  id: string;
  name: string;
  brandId: string;
  categoryId: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  stock: number;
  description: string;
  images?: string[];
  specs: Record<string, string>;
  tags?: string[];
  badge?: Badge;
  variants?: ProductVariant[];
  soldCount?: number;
}

const PRODUCT_INPUTS: ProductInput[] = [
  /* ---------------------------- ÂM THANH ---------------------------- */
  {
    id: 'p-01', name: 'AuraBeats Pro Wireless', brandId: 'brand-aurasound', categoryId: 'cat-audio',
    price: 249, originalPrice: 299, rating: 4.8, reviewCount: 1284, stock: 24,
    description: 'Tai nghe chống ồn chủ động không dây, thời lượng pin 40 giờ, hỗ trợ sạc nhanh qua USB-C.',
    images: [U.headphone, pic('p-01-b'), pic('p-01-c')],
    specs: { 'Thời lượng pin': '40 giờ', 'Chống ồn': 'ANC chủ động', 'Kết nối': 'Bluetooth 5.4 / USB-C' },
    tags: ['tai nghe', 'chống ồn', 'bluetooth'], badge: 'sale',
    variants: [
      { id: 'v-carbon', name: 'Carbon Black', type: 'color', inStock: 5 },
      { id: 'v-silver', name: 'Moon Silver', type: 'color', inStock: 0 },
      { id: 'v-brown', name: 'Chestnut Brown', type: 'color', inStock: 8 },
    ],
    soldCount: 1892,
  },
  {
    id: 'p-02', name: 'Pulse Buds Pro', brandId: 'brand-pulse', categoryId: 'cat-audio',
    price: 129, originalPrice: 159, rating: 4.6, reviewCount: 876, stock: 40,
    description: 'Tai nghe true wireless nhỏ gọn, chống nước IPX5, phù hợp luyện tập thể thao.',
    images: [pic('p-02-a'), pic('p-02-b')],
    specs: { 'Chống nước': 'IPX5', 'Pin': '6 giờ (hộp 24 giờ)', 'Kết nối': 'Bluetooth 5.3' },
    tags: ['tai nghe', 'thể thao'], badge: 'sale',
    variants: [
      { id: 'v-white', name: 'Trắng', type: 'color', inStock: 0 },
      { id: 'v-black', name: 'Đen', type: 'color', inStock: 12 },
    ],
    soldCount: 1501,
  },
  {
    id: 'p-03', name: 'Vortex Gaming 7.1', brandId: 'brand-vortex', categoryId: 'cat-audio',
    price: 149, originalPrice: 199, rating: 4.7, reviewCount: 620, stock: 18,
    description: 'Tai nghe gaming 7.1 kênh, micro chống ồn, LED RGB đồng bộ theo nhạc.',
    images: [U.gamingHeadset, pic('p-03-b')],
    specs: { 'Âm thanh': '7.1 Surround', 'Micro': 'Chống ồn', 'Tương thích': 'PC / Console' },
    tags: ['gaming', 'rgb'], badge: 'sale', soldCount: 834,
  },
  {
    id: 'p-04', name: 'Stratus Studio ANC', brandId: 'brand-stratus', categoryId: 'cat-audio',
    price: 329, originalPrice: 399, rating: 4.9, reviewCount: 511, stock: 9,
    description: 'Tai nghe studio cao cấp cho producer, âm thanh chuẩn Hi-Res, chống ồn chủ động.',
    images: [pic('p-04-a'), pic('p-04-b'), pic('p-04-c')],
    specs: { 'Chuẩn âm thanh': 'Hi-Res Audio', 'Chống ồn': 'ANC 3 mức', 'Pin': '50 giờ' },
    tags: ['studio', 'hi-res'], badge: 'hot', soldCount: 412,
  },
  {
    id: 'p-05', name: 'Nova Sound Mini', brandId: 'brand-novatech', categoryId: 'cat-audio',
    price: 79, originalPrice: 99, rating: 4.4, reviewCount: 1105, stock: 55,
    description: 'Loa bluetooth mini chống nước, âm bass mạnh, dễ dàng mang theo mọi nơi.',
    images: [pic('p-05-a'), pic('p-05-b')],
    specs: { 'Công suất': '16W', 'Pin': '12 giờ', 'Chống nước': 'IPX6' },
    tags: ['loa', 'bluetooth'], badge: 'sale', soldCount: 2104,
  },
  {
    id: 'p-06', name: 'EchoBeats Air Lite', brandId: 'brand-echo', categoryId: 'cat-audio',
    price: 59, originalPrice: 59, rating: 4.2, reviewCount: 390, stock: 70,
    description: 'Tai nghe không dây giá rẻ, thiết kế gọn nhẹ, phù hợp học tập và làm việc.',
    images: [pic('p-06-a')],
    specs: { 'Pin': '20 giờ', 'Kết nối': 'Bluetooth 5.2', 'Trọng lượng': '190g' },
    tags: ['tai nghe', 'giá rẻ'], badge: 'new', soldCount: 670,
  },

  /* --------------------------- ĐIỆN THOẠI ---------------------------- */
  {
    id: 'p-07', name: 'NovaPhone 11 Ultra', brandId: 'brand-novatech', categoryId: 'cat-phones',
    price: 1099, originalPrice: 1199, rating: 4.9, reviewCount: 743, stock: 0,
    description: 'Điện thoại flagship màn hình 120Hz, camera 200MP, chip AI đời mới.',
    images: [U.phone, pic('p-07-b'), pic('p-07-c')],
    specs: { 'Màn hình': '6.8 inch AMOLED 120Hz', 'Camera': '200MP', 'Pin': '5000mAh' },
    tags: ['điện thoại', 'flagship'], badge: 'sale', soldCount: 936,
    variants: [
      { id: 'v-128', name: '128GB', type: 'storage', inStock: 0 },
      { id: 'v-256', name: '256GB', type: 'storage', inStock: 0 },
      { id: 'v-512', name: '512GB', type: 'storage', inStock: 4 },
    ],
  },
  {
    id: 'p-08', name: 'Stratus X Fold 2', brandId: 'brand-stratus', categoryId: 'cat-phones',
    price: 1399, originalPrice: 1499, rating: 4.7, reviewCount: 258, stock: 6,
    description: 'Điện thoại màn hình gập thế hệ mới, bản lề chắc chắn, mở ra máy tính bảng 8 inch.',
    images: [pic('p-08-a'), pic('p-08-b')],
    specs: { 'Màn hình gập': '8 inch LTPO', 'Chip': 'NextGen X2', 'Pin': '4600mAh' },
    tags: ['điện thoại', 'màn hình gập'], badge: 'new', soldCount: 174,
  },
  {
    id: 'p-09', name: 'ZenFone Z Ultra', brandId: 'brand-zenfone', categoryId: 'cat-phones',
    price: 899, originalPrice: 949, rating: 4.5, reviewCount: 624, stock: 15,
    description: 'Điện thoại camera chuyên chụp ảnh, ống kính tiềm vọng 10x, chống nước IP68.',
    images: [pic('p-09-a'), pic('p-09-b')],
    specs: { 'Camera': '50MP + kính tiềm vọng 10x', 'Chống nước': 'IP68', 'Sạc': '80W' },
    tags: ['điện thoại', 'camera'], badge: 'sale', soldCount: 810,
  },
  {
    id: 'p-10', name: 'Pulse 11 Lite', brandId: 'brand-pulse', categoryId: 'cat-phones',
    price: 299, originalPrice: 349, rating: 4.4, reviewCount: 980, stock: 32,
    description: 'Điện thoại tầm trung pin trâu, hiệu năng ổn định cho nhu cầu hằng ngày.',
    images: [pic('p-10-a')],
    specs: { 'Pin': '6000mAh', 'Màn hình': '6.6 inch 90Hz', 'Chip': 'MediaTek D7000' },
    tags: ['điện thoại', 'pin trâu'], badge: 'sale', soldCount: 2450,
  },
  {
    id: 'p-11', name: 'Atlas Note 5G', brandId: 'brand-atlas', categoryId: 'cat-phones',
    price: 399, originalPrice: 399, rating: 4.3, reviewCount: 356, stock: 21,
    description: 'Điện thoại 5G có bút stylus đi kèm, màn hình lớn tiện ghi chú.',
    images: [pic('p-11-a'), pic('p-11-b')],
    specs: { 'Màn hình': '6.9 inch', 'Bút': 'Stylus kèm theo', 'Hỗ trợ': '5G Dual SIM' },
    tags: ['điện thoại', '5g'], badge: 'new', soldCount: 298,
  },
  {
    id: 'p-12', name: 'Minova M6', brandId: 'brand-minova', categoryId: 'cat-phones',
    price: 249, originalPrice: 279, rating: 4.2, reviewCount: 1502, stock: 48,
    description: 'Điện thoại phổ thông hiệu năng tốt, camera AI xoá phông, pin dùng 2 ngày.',
    images: [pic('p-12-a')],
    specs: { 'Pin': '5500mAh', 'Camera': '50MP AI', 'Bộ nhớ': '256GB' },
    tags: ['điện thoại', 'giá rẻ'], badge: 'sale', soldCount: 3210,
  },

  /* ----------------------------- LAPTOP ------------------------------ */
  {
    id: 'p-13', name: 'NovaBook Air 13', brandId: 'brand-novatech', categoryId: 'cat-laptops',
    price: 1199, originalPrice: 1299, rating: 4.9, reviewCount: 418, stock: 10,
    description: 'Laptop siêu mỏng 1.1kg, màn hình 2.8K, hiệu năng đủ cho công việc văn phòng.',
    images: [U.laptop, pic('p-13-b')],
    specs: { 'Màn hình': '13.3 inch 2.8K', 'RAM': '16GB', 'SSD': '512GB' },
    tags: ['laptop', 'siêu mỏng'], badge: 'sale',
    variants: [
      { id: 'v-256', name: '256GB SSD', type: 'storage', inStock: 3 },
      { id: 'v-512', name: '512GB SSD', type: 'storage', inStock: 0 },
      { id: 'v-1t', name: '1TB SSD', type: 'storage', inStock: 7 },
    ],
    soldCount: 674,
  },
  {
    id: 'p-14', name: 'Atlas Gaming 15', brandId: 'brand-atlas', categoryId: 'cat-laptops',
    price: 1899, originalPrice: 2099, rating: 4.8, reviewCount: 312, stock: 5,
    description: 'Laptop gaming RTX 4070, màn hình 165Hz, tản nhiệt buồng hơi kép.',
    images: [pic('p-14-a'), pic('p-14-b')],
    specs: { 'GPU': 'RTX 4070', 'Màn hình': '15.6 inch 165Hz', 'RAM': '32GB' },
    tags: ['laptop', 'gaming'], badge: 'sale', soldCount: 289,
  },
  {
    id: 'p-15', name: 'Stratus UltraBook X', brandId: 'brand-stratus', categoryId: 'cat-laptops',
    price: 1499, originalPrice: 1599, rating: 4.7, reviewCount: 227, stock: 8,
    description: 'Ultrabook doanh nhân bảo mật vân tay, vỏ nhôm nguyên khối, pin 18 giờ.',
    images: [pic('p-15-a'), pic('p-15-b')],
    specs: { 'Pin': '18 giờ', 'Bảo mật': 'Vân tay + TPM', 'CPU': 'Core Ultra 7' },
    tags: ['laptop', 'doanh nhân'], badge: 'new', soldCount: 158,
  },
  {
    id: 'p-16', name: 'Minova Creator 16', brandId: 'brand-minova', categoryId: 'cat-laptops',
    price: 1699, originalPrice: 1699, rating: 4.7, reviewCount: 139, stock: 4,
    description: 'Laptop đồ hoạ màn OLED 100% DCI-P3 dành cho dựng phim và thiết kế.',
    images: [pic('p-16-a')],
    specs: { 'Màn hình': '16 inch OLED', 'Màu': '100% DCI-P3', 'GPU': 'RTX 4060' },
    tags: ['laptop', 'đồ hoạ'], badge: 'hot', soldCount: 96,
  },
  {
    id: 'p-17', name: 'Echo Book 14', brandId: 'brand-echo', categoryId: 'cat-laptops',
    price: 799, originalPrice: 899, rating: 4.3, reviewCount: 745, stock: 26,
    description: 'Laptop học tập - văn phòng đáng mua, cấu hình đủ mọi tác vụ cơ bản.',
    images: [pic('p-17-a'), pic('p-17-b')],
    specs: { 'Màn hình': '14 inch FullHD', 'RAM': '8GB', 'SSD': '256GB' },
    tags: ['laptop', 'học tập'], badge: 'sale', soldCount: 1823,
  },

  /* ---------------------------- PHỤ KIỆN ----------------------------- */
  {
    id: 'p-18', name: 'GridGear GaN 65W', brandId: 'brand-gridgear', categoryId: 'cat-accessories',
    price: 39, originalPrice: 49, rating: 4.6, reviewCount: 1320, stock: 100,
    description: 'Củ sạc nhanh GaN 65W nhỏ gọn, sạc được laptop, điện thoại và tablet.',
    images: [pic('p-18-a'), pic('p-18-b')],
    specs: { 'Công suất': '65W', 'Cổng': '2x USB-C + 1x USB-A', 'Chuẩn': 'PD 3.0 / QC 4+' },
    tags: ['sạc', 'gan'], badge: 'sale', soldCount: 3820,
  },
  {
    id: 'p-19', name: 'GridGear Hub 7-in-1', brandId: 'brand-gridgear', categoryId: 'cat-accessories',
    price: 69, originalPrice: 69, rating: 4.5, reviewCount: 640, stock: 35,
    description: 'Hub USB-C 7 cổng: HDMI 4K, thẻ nhớ, USB 3.0, truyền dữ liệu tốc độ cao.',
    images: [pic('p-19-a')],
    specs: { 'HDMI': '4K@60Hz', 'USB': '3x USB-A 3.0', 'Thẻ nhớ': 'SD / microSD' },
    tags: ['hub', 'usb-c'], badge: 'new', soldCount: 802,
  },
  {
    id: 'p-20', name: 'HyperX Mouse Pro', brandId: 'brand-hyperx', categoryId: 'cat-accessories',
    price: 89, originalPrice: 109, rating: 4.7, reviewCount: 933, stock: 22,
    description: 'Chuột không dây nhẹ 59g, cảm biến 26K DPI, switch tuổi thọ 80 triệu lần nhấn.',
    images: [pic('p-20-a'), pic('p-20-b')],
    specs: { 'DPI': '26,000', 'Trọng lượng': '59g', 'Pin': '90 giờ' },
    tags: ['chuột', 'gaming'], badge: 'sale', soldCount: 1140,
  },
  {
    id: 'p-21', name: 'HyperX Key TKL', brandId: 'brand-hyperx', categoryId: 'cat-accessories',
    price: 129, originalPrice: 149, rating: 4.8, reviewCount: 720, stock: 14,
    description: 'Bàn phím cơ TKL hotswap, switch linear mượt, keycap PBT bền đẹp.',
    images: [pic('p-21-a'), pic('p-21-b')],
    specs: { 'Layout': 'TKL 87 phím', 'Switch': 'Linear hotswap', 'Keycap': 'PBT' },
    tags: ['bàn phím', 'cơ'], badge: 'sale', soldCount: 567,
  },
  {
    id: 'p-22', name: 'UrbanX Backpack', brandId: 'brand-urbanx', categoryId: 'cat-accessories',
    price: 79, originalPrice: 99, rating: 4.4, reviewCount: 488, stock: 0,
    description: 'Balo chống nước ngăn laptop 15.6 inch, cổng sạc USB ngoài tiện lợi.',
    images: [U.backpack, pic('p-22-b')],
    specs: { 'Ngăn laptop': '15.6 inch', 'Chống nước': 'Có', 'Dung tích': '25L' },
    tags: ['balo', 'laptop'], badge: 'sale', soldCount: 1245,
  },
  {
    id: 'p-23', name: 'UrbanX Case Armor', brandId: 'brand-urbanx', categoryId: 'cat-accessories',
    price: 29, originalPrice: 29, rating: 4.2, reviewCount: 260, stock: 80,
    description: 'Ốp lưng chống sốc đa năng, đế kickstand xem phim tiện lợi.',
    images: [pic('p-23-a')],
    specs: { 'Chất liệu': 'TPU + PC', 'Chống sốc': 'Đạt chuẩn quân đội', 'Tương thích': '6.1 - 6.7 inch' },
    tags: ['ốp lưng'], badge: 'new', soldCount: 954,
  },

  /* -------------------------- ĐỒNG HỒ ---------------------------- */
  {
    id: 'p-24', name: 'Vision Watch S5', brandId: 'brand-visiontech', categoryId: 'cat-watches',
    price: 199, originalPrice: 249, rating: 4.7, reviewCount: 821, stock: 30,
    description: 'Đồng hồ thông minh màn AMOLED, theo dõi nhịp tim 24/7, chống nước 5ATM.',
    images: [U.watch, pic('p-24-b')],
    specs: { 'Màn hình': '1.43 inch AMOLED', 'Chống nước': '5ATM', 'Pin': '14 ngày' },
    tags: ['đồng hồ', 'sức khoẻ'], badge: 'sale',
    variants: [
      { id: 'v-42', name: 'Dây 42mm', type: 'size', inStock: 0 },
      { id: 'v-46', name: 'Dây 46mm', type: 'size', inStock: 15 },
    ],
    soldCount: 1674,
  },
  {
    id: 'p-25', name: 'Vision Watch Ultra', brandId: 'brand-visiontech', categoryId: 'cat-watches',
    price: 499, originalPrice: 549, rating: 4.9, reviewCount: 344, stock: 11,
    description: 'Đồng hồ thể thao ngoài trời, GPS 2 băng tần, vỏ titan, pin 36 ngày.',
    images: [pic('p-25-a'), pic('p-25-b')],
    specs: { 'GPS': '2 băng tần', 'Vỏ': 'Titan', 'Pin': '36 ngày' },
    tags: ['đồng hồ', 'thể thao'], badge: 'hot', soldCount: 201,
  },
  {
    id: 'p-26', name: 'Tempo Watch Active 2', brandId: 'brand-tempo', categoryId: 'cat-watches',
    price: 129, originalPrice: 159, rating: 4.5, reviewCount: 1102, stock: 44,
    description: 'Đồng hồ smartwatch giá tốt, hơn 120 chế độ tập luyện, đo giấc ngủ tự động.',
    images: [pic('p-26-a')],
    specs: { 'Màn hình': '1.3 inch', 'Chế độ tập': '120+', 'Chống nước': '3ATM' },
    tags: ['đồng hồ', 'giá rẻ'], badge: 'sale', soldCount: 2830,
  },
  {
    id: 'p-27', name: 'Tempo Band Sports', brandId: 'brand-tempo', categoryId: 'cat-watches',
    price: 59, originalPrice: 59, rating: 4.3, reviewCount: 610, stock: 60,
    description: 'Vòng đeo tay theo dõi vận động, nhịp tim và giấc ngủ, pin 10 ngày.',
    images: [pic('p-27-a')],
    specs: { 'Pin': '10 ngày', 'Chống nước': '5ATM', 'Kết nối': 'Bluetooth 5.1' },
    tags: ['vòng đeo', 'sức khoẻ'], badge: 'new', soldCount: 1309,
  },
  {
    id: 'p-28', name: 'Nova Watch Series 5', brandId: 'brand-novatech', categoryId: 'cat-watches',
    price: 189, originalPrice: 219, rating: 4.6, reviewCount: 892, stock: 19,
    description: 'Smartwatch tròn viền thép, gọi điện trực tiếp, hỗ trợ thanh toán NFC.',
    images: [pic('p-28-a'), pic('p-28-b')],
    specs: { 'Màn hình': '1.5 inch AMOLED', 'Gọi điện': 'eSIM', 'Pin': '7 ngày' },
    tags: ['đồng hồ', 'esim'], badge: 'sale', soldCount: 1040,
  },

  /* --------------------------- MÁY TÍNH BẢNG ------------------------- */
  {
    id: 'p-29', name: 'NovaPad Pro 11', brandId: 'brand-novatech', categoryId: 'cat-tablets',
    price: 799, originalPrice: 899, rating: 4.8, reviewCount: 276, stock: 13,
    description: 'Tablet màn hình 120Hz, chip mạnh, bút Nova Pencil đi kèm, pin 12 giờ.',
    images: [pic('p-29-a'), pic('p-29-b')],
    specs: { 'Màn hình': '11 inch 120Hz', 'Bút': 'Nova Pencil', 'Pin': '12 giờ' },
    tags: ['tablet', 'bút'], badge: 'sale',
    variants: [
      { id: 'v-128', name: '128GB', type: 'storage', inStock: 4 },
      { id: 'v-256', name: '256GB', type: 'storage', inStock: 0 },
    ],
    soldCount: 420,
  },
  {
    id: 'p-30', name: 'Stratus Tab S8', brandId: 'brand-stratus', categoryId: 'cat-tablets',
    price: 999, originalPrice: 999, rating: 4.7, reviewCount: 188, stock: 7,
    description: 'Tablet OLED 12.4 inch mỏng 5.5mm, loa 4 kênh Dolby Atmos.',
    images: [pic('p-30-a'), pic('p-30-b')],
    specs: { 'Màn hình': '12.4 inch OLED', 'Âm thanh': '4 loa Dolby Atmos', 'Pin': '11 giờ' },
    tags: ['tablet', 'oled'], badge: 'new', soldCount: 145,
  },
  {
    id: 'p-31', name: 'Echo Pad Mini', brandId: 'brand-echo', categoryId: 'cat-tablets',
    price: 349, originalPrice: 399, rating: 4.4, reviewCount: 520, stock: 38,
    description: 'Tablet mini 8.7 inch gọn nhẹ, lý tưởng để đọc sách và giải trí.',
    images: [pic('p-31-a')],
    specs: { 'Màn hình': '8.7 inch', 'Loa': 'Stereo kép', 'Pin': '10 giờ' },
    tags: ['tablet', 'mini'], badge: 'sale', soldCount: 1120,
  },
  {
    id: 'p-32', name: 'Atlas Tab Go', brandId: 'brand-atlas', categoryId: 'cat-tablets',
    price: 549, originalPrice: 549, rating: 4.2, reviewCount: 130, stock: 17,
    description: 'Tablet bền bỉ chuẩn quân đội, kèm bao da và chân đế tích hợp.',
    images: [pic('p-32-a'), pic('p-32-b')],
    specs: { 'Độ bền': 'MIL-STD-810H', 'Màn hình': '10.1 inch', 'Chống nước': 'IP52' },
    tags: ['tablet', 'bền bỉ'], badge: 'new', soldCount: 98,
  },

  /* ------------------------------ GAMING ----------------------------- */
  {
    id: 'p-33', name: 'HyperX Cloud Alpha', brandId: 'brand-hyperx', categoryId: 'cat-gaming',
    price: 119, originalPrice: 139, rating: 4.7, reviewCount: 774, stock: 27,
    description: 'Tai nghe gaming passive noise-cancelling, driver 50mm, micro rời.',
    images: [pic('p-33-a'), pic('p-33-b')],
    specs: { 'Driver': '50mm', 'Micro': 'Tháo rời', 'Tương thích': 'PC / PS5 / Xbox' },
    tags: ['gaming', 'tai nghe'], badge: 'sale', soldCount: 1056,
  },
  {
    id: 'p-34', name: 'HyperX Controller Elite', brandId: 'brand-hyperx', categoryId: 'cat-gaming',
    price: 159, originalPrice: 179, rating: 4.6, reviewCount: 310, stock: 20,
    description: 'Tay cầm không dây hall-effect chống drift, phím bấm back tùy chỉnh.',
    images: [pic('p-34-a'), pic('p-34-b')],
    specs: { 'Analog': 'Hall-effect', 'Kết nối': '2.4G / Bluetooth', 'Pin': '30 giờ' },
    tags: ['tay cầm', 'không dây'], badge: 'new', soldCount: 388,
  },
  {
    id: 'p-35', name: 'Vortex Gaming Chair X', brandId: 'brand-vortex', categoryId: 'cat-gaming',
    price: 399, originalPrice: 499, rating: 4.5, reviewCount: 265, stock: 6,
    description: 'Ghế gaming công thái học, đệm mút hoạt tính, ngả lưng 180 độ.',
    images: [pic('p-35-a'), pic('p-35-b')],
    specs: { 'Ngả lưng': '180°', 'Chất liệu': 'Da PU + mesh', 'Tải trọng': '150kg' },
    tags: ['ghế', 'gaming'], badge: 'sale', soldCount: 214,
  },
  {
    id: 'p-36', name: 'Nova Game Deck', brandId: 'brand-novatech', categoryId: 'cat-gaming',
    price: 699, originalPrice: 699, rating: 4.8, reviewCount: 430, stock: 9,
    description: 'Máy chơi game cầm tay màn hình 7 inch, thư viện game lớn, pin 8 giờ.',
    images: [pic('p-36-a'), pic('p-36-b')],
    specs: { 'Màn hình': '7 inch 120Hz', 'Pin': '8 giờ', 'Bộ nhớ': '1TB' },
    tags: ['console', 'cầm tay'], badge: 'hot', soldCount: 512,
  },
  {
    id: 'p-37', name: 'Stratus Game Monitor 27', brandId: 'brand-stratus', categoryId: 'cat-gaming',
    price: 449, originalPrice: 549, rating: 4.7, reviewCount: 158, stock: 12,
    description: 'Màn hình gaming QHD 180Hz, hỗ trợ G-Sync/FreeSync, màu 95% DCI-P3.',
    images: [pic('p-37-a'), pic('p-37-b')],
    specs: { 'Độ phân giải': 'QHD 1440p', 'Tần số': '180Hz', 'Tấm nền': 'IPS' },
    tags: ['màn hình', 'gaming'], badge: 'sale', soldCount: 136,
  },

  /* ------------------------- MÁY ẢNH & FLYCAM ------------------------ */
  {
    id: 'p-38', name: 'Lumina Cam Vlog', brandId: 'brand-lumina', categoryId: 'cat-cameras',
    price: 649, originalPrice: 699, rating: 4.6, reviewCount: 210, stock: 8,
    description: 'Máy ảnh vlog 4K lật màn hình, lấy nét theo mắt, thu âm 2 kênh.',
    images: [pic('p-38-a'), pic('p-38-b')],
    specs: { 'Quay phim': '4K 60fps', 'Màn hình': 'Lật 180°', 'Micro': '2 kênh' },
    tags: ['máy ảnh', 'vlog'], badge: 'sale', soldCount: 174,
  },
  {
    id: 'p-39', name: 'Lumina Action 4K', brandId: 'brand-lumina', categoryId: 'cat-cameras',
    price: 299, originalPrice: 349, rating: 4.5, reviewCount: 460, stock: 16,
    description: 'Action camera chống rung FlowState, quay 4K/120fps, chống nước 10m.',
    images: [pic('p-39-a')],
    specs: { 'Quay phim': '4K 120fps', 'Chống nước': '10m', 'Chống rung': 'FlowState' },
    tags: ['action camera', '4k'], badge: 'sale', soldCount: 688,
  },
  {
    id: 'p-40', name: 'Atlas Drone Mini', brandId: 'brand-atlas', categoryId: 'cat-cameras',
    price: 499, originalPrice: 599, rating: 4.7, reviewCount: 125, stock: 0,
    description: 'Flycam mini dưới 249g, quay 4K, bay 34 phút, tự tránh vật cản.',
    images: [pic('p-40-a'), pic('p-40-b')],
    specs: { 'Trọng lượng': '249g', 'Pin': '34 phút', 'Cảm biến': 'Tránh vật cản 3 hướng' },
    tags: ['flycam', '4k'], badge: 'hot', soldCount: 304,
  },
  {
    id: 'p-41', name: 'ZenFone Cam Pro', brandId: 'brand-zenfone', categoryId: 'cat-cameras',
    price: 899, originalPrice: 899, rating: 4.4, reviewCount: 74, stock: 5,
    description: 'Máy ảnh mirrorless cảm biến APS-C, quay 6K, chống rung 5 trục.',
    images: [pic('p-41-a'), pic('p-41-b')],
    specs: { 'Cảm biến': 'APS-C 26MP', 'Quay phim': '6K 30fps', 'Chống rung': '5 trục' },
    tags: ['máy ảnh', 'mirrorless'], badge: 'new', soldCount: 62,
  },

  /* -------------------------- THIẾT BỊ MẠNG -------------------------- */
  {
    id: 'p-42', name: 'Echo Mesh WiFi 3', brandId: 'brand-echo', categoryId: 'cat-network',
    price: 249, originalPrice: 299, rating: 4.6, reviewCount: 340, stock: 25,
    description: 'Bộ 3 node mesh phủ sóng 600m², WiFi 6 tốc độ 3Gbps, cài đặt qua app.',
    images: [pic('p-42-a'), pic('p-42-b')],
    specs: { 'Chuẩn WiFi': 'WiFi 6', 'Tốc độ': '3,000Mbps', 'Phủ sóng': '600m² / 3 node' },
    tags: ['wifi', 'mesh'], badge: 'sale', soldCount: 540,
  },
  {
    id: 'p-43', name: 'Echo Router AX3000', brandId: 'brand-echo', categoryId: 'cat-network',
    price: 129, originalPrice: 149, rating: 4.5, reviewCount: 524, stock: 33,
    description: 'Router WiFi 6 AX3000 có bảo mật WPA3, 4 ăng-ten khuếch đại, độ trễ thấp.',
    images: [pic('p-43-a')],
    specs: { 'Chuẩn WiFi': 'WiFi 6 AX3000', 'Bảo mật': 'WPA3', 'Cổng': '4x Gigabit' },
    tags: ['router', 'wifi 6'], badge: 'sale', soldCount: 1120,
  },
  {
    id: 'p-44', name: 'Minova Smart Hub', brandId: 'brand-minova', categoryId: 'cat-network',
    price: 79, originalPrice: 79, rating: 4.3, reviewCount: 282, stock: 42,
    description: 'Hub điều khiển trung tâm cho nhà thông minh, tương thích Zigbee + Matter.',
    images: [pic('p-44-a'), pic('p-44-b')],
    specs: { 'Giao thức': 'Zigbee / Matter', 'Kết nối': 'Không dây', 'Số thiết bị': '128' },
    tags: ['smarthome', 'hub'], badge: 'new', soldCount: 405,
  },
  {
    id: 'p-45', name: 'GridGear WiFi Extender', brandId: 'brand-gridgear', categoryId: 'cat-network',
    price: 45, originalPrice: 59, rating: 4.1, reviewCount: 780, stock: 58,
    description: 'Bộ mở rộng sóng WiFi rẻ và dễ dùng, phủ thêm 80m² chỉ với một nút bấm.',
    images: [pic('p-45-a')],
    specs: { 'Băng tần': '2.4GHz + 5GHz', 'Phủ sóng': '80m²', 'Cài đặt': '1 chạm' },
    tags: ['wifi', 'mở rộng sóng'], badge: 'sale', soldCount: 2100,
  },

  /* ------------------------ GIA DỤNG THÔNG MINH ----------------------- */
  {
    id: 'p-46', name: 'Minova Smart Bulb', brandId: 'brand-minova', categoryId: 'cat-smart-home',
    price: 25, originalPrice: 25, rating: 4.4, reviewCount: 920, stock: 90,
    description: 'Bóng đèn thông minh 16 triệu màu, hẹn giờ và điều khiển bằng giọng nói.',
    images: [pic('p-46-a'), pic('p-46-b')],
    specs: { 'Màu sắc': '16 triệu màu', 'Công suất': '9W', 'Tương thích': 'Google / Alexa' },
    tags: ['đèn', 'smarthome'], badge: 'new', soldCount: 2600,
  },
  {
    id: 'p-47', name: 'Minova Smart Plug', brandId: 'brand-minova', categoryId: 'cat-smart-home',
    price: 19, originalPrice: 29, rating: 4.3, reviewCount: 1120, stock: 120,
    description: 'Ổ cắm thông minh điều khiển từ xa, theo dõi điện năng, hẹn giờ linh hoạt.',
    images: [pic('p-47-a')],
    specs: { 'Tải tối đa': '2500W', 'Theo dõi': 'Điện năng tiêu thụ', 'Hẹn giờ': 'Trong app' },
    tags: ['ổ cắm', 'smarthome'], badge: 'sale', soldCount: 4300,
  },
  {
    id: 'p-48', name: 'Echo Smart Speaker', brandId: 'brand-echo', categoryId: 'cat-smart-home',
    price: 99, originalPrice: 129, rating: 4.6, reviewCount: 610, stock: 28,
    description: 'Loa thông minh âm thanh 360°, trợ lý ảo tiếng Việt, điều khiển nhà thông minh.',
    images: [pic('p-48-a'), pic('p-48-b')],
    specs: { 'Âm thanh': '360°', 'Trợ lý ảo': 'Tiếng Việt', 'Kết nối': 'WiFi + Bluetooth' },
    tags: ['loa', 'trợ lý ảo'], badge: 'sale', soldCount: 890,
  },
  {
    id: 'p-49', name: 'Echo Security Cam', brandId: 'brand-echo', categoryId: 'cat-smart-home',
    price: 89, originalPrice: 89, rating: 4.5, reviewCount: 445, stock: 22,
    description: 'Camera an ninh 2K, nhận diện người, quay đêm màu, lưu trữ cloud miễn phí 7 ngày.',
    images: [pic('p-49-a'), pic('p-49-b')],
    specs: { 'Độ phân giải': '2K', 'Quay đêm': 'Màu', 'Cloud': 'Miễn phí 7 ngày' },
    tags: ['camera', 'an ninh'], badge: 'new', soldCount: 720,
  },
  {
    id: 'p-50', name: 'Nova Smart Lock', brandId: 'brand-novatech', categoryId: 'cat-smart-home',
    price: 199, originalPrice: 249, rating: 4.7, reviewCount: 310, stock: 15,
    description: 'Khoá cửa thông minh vân tay, mã số, thẻ từ và mở bằng điện thoại.',
    images: [pic('p-50-a'), pic('p-50-b')],
    specs: { 'Vân tay': '0.2 giây', 'Mở khoá': 'App / vân tay / mã / thẻ', 'Pin': '12 tháng' },
    tags: ['khoá cửa', 'an ninh'], badge: 'sale', soldCount: 478,
  },
];

function toProduct(input: ProductInput, index: number): Product {
  const brand = BRANDS.find((b: { id: string }) => b.id === input.brandId);
  const price = input.price;
  const originalPrice = input.originalPrice ?? input.price;

  return {
    id: input.id,
    name: input.name,
    price,
    originalPrice,
    description: input.description,
    imageUrl: input.images?.[0] ?? pic(input.id),
    images: input.images ?? [pic(input.id)],
    category: input.categoryId,
    rating: input.rating,
    reviewCount: input.reviewCount,
    stock: input.stock,
    soldCount: input.soldCount ?? 0,
    brandId: input.brandId,
    brandName: brand?.name,
    specs: input.specs,
    tags: input.tags ?? [],
    badge: input.badge,
    variants: input.variants ?? [],
    createdAt: input.badge === 'new'
      ? `2026-11-${String(((index * 5) % 28) + 1).padStart(2, '0')}T09:00:00Z`
      : `2026-01-${String(((index * 7) % 28) + 1).padStart(2, '0')}T09:00:00Z`,
  };
}

/** 50 sản phẩm, 10 danh mục, 15 thương hiệu. */
export const MOCK_PRODUCTS: Product[] = PRODUCT_INPUTS.map(toProduct);

/** Có một số sản phẩm hết hàng: p-07, p-13 (biến thể 512GB), p-18 etc. */
export const OUT_OF_STOCK_PRODUCT_IDS = MOCK_PRODUCTS.filter((p) => p.stock === 0).map((p) => p.id);
