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
        categoryPath: ["Trang chủ", "Âm thanh", "Tai nghe Bluetooth", "Tai nghe chụp tai"],
    details: [{"label": "Thương hiệu", "value": "AuraSound"}, {"label": "Model", "value": "Studio Pro Active Noise Cancelling"}, {"label": "Kiểu tai nghe", "value": "Chụp tai over-ear, gập gọn"}, {"label": "Kết nối", "value": "Bluetooth 5.3; jack 3.5 mm"}, {"label": "Driver", "value": "40 mm, màng loa composite"}, {"label": "Chống ồn", "value": "ANC chủ động, có chế độ xuyên âm"}, {"label": "Thời lượng pin", "value": "Khoảng 40 giờ khi tắt ANC; khoảng 30 giờ khi bật ANC"}, {"label": "Sạc", "value": "USB-C, sạc nhanh 10 phút dùng khoảng 4 giờ"}, {"label": "Micro", "value": "4 micro đàm thoại, hỗ trợ giảm tiếng ồn môi trường"}, {"label": "Trọng lượng", "value": "Khoảng 260 g"}, {"label": "Kích thước", "value": "Khoảng 180 x 160 x 80 mm khi gập gọn"}, {"label": "Chất liệu", "value": "Da PU, khung kim loại và nhựa ABS"}, {"label": "Chống nước", "value": "Không thiết kế chống nước; tránh mồ hôi và độ ẩm cao"}, {"label": "Phụ kiện", "value": "Tai nghe, cáp USB-C, cáp audio 3.5 mm, túi đựng, sách hướng dẫn"}, {"label": "Bảo hành", "value": "12 tháng"}, {"label": "Xuất xứ", "value": "Trung Quốc"}],
    highlights: ["Chống ồn chủ động ANC giúp giảm tiếng ồn xe cộ, văn phòng và máy bay", "Thời lượng pin khoảng 40 giờ khi tắt ANC, phù hợp làm việc và du lịch dài ngày", "Đệm tai da PU êm, đeo thoải mái trong nhiều giờ", "Bluetooth 5.3 kết nối ổn định, hỗ trợ đàm thoại rõ với 4 micro", "Thiết kế gập gọn, có túi đựng tiện mang theo"],
    longDescription: "AuraSound Studio Pro Active Noise Cancelling là tai nghe chụp tai không dây hướng đến người dùng cần không gian nghe tập trung. Tai nghe sử dụng driver 40 mm, kết nối Bluetooth 5.3 và có chế độ chống ồn chủ động ANC để giảm bớt tiếng ồn xung quanh khi làm việc, học tập hoặc di chuyển. Chế độ xuyên âm giúp bạn vẫn nghe được thông báo quan trọng mà không cần tháo tai nghe.\n\nThời lượng pin công bố khoảng 40 giờ khi tắt ANC và khoảng 30 giờ khi bật ANC, tùy mức âm lượng và nội dung sử dụng. Tai nghe có thể dùng có dây qua jack 3.5 mm khi hết pin. Phần đệm tai da PU và khung gập gọn giúp việc mang theo thuận tiện hơn; sản phẩm không thiết kế chống nước nên cần tránh mưa, mồ hôi nhiều và môi trường ẩm ướt.\n\nSản phẩm phù hợp cho nhu cầu nghe nhạc, họp online và giải trí hằng ngày. Các thông số như thời lượng pin, khả năng chống ồn và khoảng cách kết nối có thể thay đổi theo thiết bị, môi trường và cách sử dụng thực tế.",
    usageGuide: "Sạc tai nghe bằng cáp USB-C đi kèm; nên sạc khi pin dưới 20% và tránh sạc qua đêm thường xuyên. Ghép nối: bật tai nghe, giữ nút nguồn/Bluetooth đến khi đèn báo nhấp nháy, mở Bluetooth trên điện thoại hoặc laptop và chọn AuraSound Studio Pro. Khi không dùng, gập tai nghe và cất trong túi đựng; lau nhẹ đệm tai bằng khăn khô mềm, không dùng cồn mạnh hoặc ngâm nước. Bảo quản nơi khô ráo, tránh nhiệt độ cao và vật sắc nhọn.",
    warrantyPolicy: "Bảo hành 12 tháng cho lỗi kỹ thuật do nhà sản xuất. 1 đổi 1 trong 30 ngày đầu nếu sản phẩm có lỗi sản xuất được xác nhận. Không áp dụng bảo hành cho hư hỏng do rơi vỡ, ngấm nước, tự tháo lắp, dùng sai nguồn sạc hoặc hao mòn tự nhiên của phụ kiện.",
    origin: "Kho tổng E-Commerce, Hà Nội",
    promotionQuantity: 50,
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
        categoryPath: ["Trang chủ", "Thiết bị đeo thông minh", "Đồng hồ thông minh"],
    details: [{"label": "Thương hiệu", "value": "Tempo"}, {"label": "Model", "value": "Watch Ultra Titan"}, {"label": "Kiểu đồng hồ", "value": "Thể thao, mặt tròn 46 mm"}, {"label": "Màn hình", "value": "AMOLED 1.43 inch, độ phân giải 466 x 466"}, {"label": "Chất liệu", "value": "Vỏ titan, dây silicone"}, {"label": "Cảm biến", "value": "Nhịp tim quang học, SpO2, gia tốc, con quay hồi chuyển"}, {"label": "Định vị", "value": "GPS tích hợp"}, {"label": "Thể thao", "value": "Hơn 100 chế độ, theo dõi quãng đường, calo, nhịp tim"}, {"label": "Kết nối", "value": "Bluetooth 5.2, tương thích iOS và Android"}, {"label": "Thời lượng pin", "value": "Khoảng 14 ngày với mức sử dụng thông thường; giảm khi bật GPS liên tục"}, {"label": "Sạc", "value": "Sạc nam châm, khoảng 2 giờ"}, {"label": "Chống nước", "value": "5ATM, phù hợp bơi lội nhẹ; không dùng khi lặn"}, {"label": "Kích thước", "value": "Khoảng 46 x 46 x 12 mm"}, {"label": "Trọng lượng", "value": "Khoảng 50 g"}, {"label": "Bảo hành", "value": "12 tháng"}, {"label": "Xuất xứ", "value": "Trung Quốc"}],
    highlights: ["Vỏ titan nhẹ, bền, phù hợp thể thao và sử dụng hằng ngày", "Màn hình AMOLED 1.43 inch sáng rõ, dễ quan sát ngoài trời", "GPS tích hợp và hơn 100 chế độ thể thao", "Theo dõi nhịp tim, SpO2, giấc ngủ; không thay thế thiết bị y tế", "Pin khoảng 14 ngày với mức sử dụng thông thường", "Chống nước 5ATM, dùng được khi rửa tay và bơi lội nhẹ"],
    longDescription: "Tempo Watch Ultra Titan là đồng hồ thông minh thể thao với vỏ titan và màn hình AMOLED 1.43 inch. Sản phẩm hỗ trợ GPS tích hợp, hơn 100 chế độ thể thao và các chỉ số vận động cơ bản như quãng đường, calo, nhịp tim. Thiết kế mặt tròn 46 mm cùng dây silicone phù hợp cả khi tập luyện lẫn sử dụng hằng ngày.\n\nĐồng hồ có cảm biến nhịp tim quang học và SpO2 để theo dõi các chỉ số tham khảo, đồng thời hỗ trợ theo dõi giấc ngủ và nhắc nhở vận động. Các tính năng sức khỏe chỉ mang tính tham khảo, không dùng để chẩn đoán, điều trị hoặc thay thế thiết bị y tế chuyên dụng.\n\nThời lượng pin khoảng 14 ngày ở chế độ thường và sẽ giảm khi bật GPS liên tục hoặc sử dụng nhiều thông báo. Sản phẩm tương thích iOS và Android qua ứng dụng đồng bộ; khả năng chống nước 5ATM phù hợp bơi lội nhẹ nhưng không dành cho lặn hoặc môi trường nước nóng.",
    usageGuide: "Sạc đồng hồ bằng đế nam châm đi kèm, nên sạc ở nơi khô ráo và tháo đồng hồ khỏi cổ tay khi sạc. Ghép nối: bật Bluetooth trên điện thoại, mở ứng dụng quản lý của Tempo, chọn Watch Ultra Titan và làm theo hướng dẫn trên màn hình. Đeo đồng hồ vừa tay, cách xương cổ tay khoảng một ngón tay để cảm biến hoạt động ổn định hơn. Vệ sinh bằng khăn mềm ẩm, tránh xà phòng mạnh, nước nóng, xông hơi và hóa chất; tháo dây và làm khô sau khi bơi hoặc ra mồ hôi nhiều.",
    warrantyPolicy: "Bảo hành 12 tháng cho lỗi kỹ thuật do nhà sản xuất. 1 đổi 1 trong 30 ngày đầu nếu lỗi sản xuất được xác nhận. Không bảo hành hư hỏng do rơi vỡ, va đập, ngấm nước sai cách, dùng trong môi trường nước nóng, tự tháo lắp hoặc hao mòn tự nhiên của dây đeo và pin.",
    origin: "Kho tổng E-Commerce, Hà Nội",
    promotionQuantity: 35,
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
        categoryPath: ["Trang chủ", "Điện thoại - Máy tính bảng", "Điện thoại smartphone"],
    details: [{"label": "Thương hiệu", "value": "Pulse"}, {"label": "Model", "value": "Pulse 11 Ultra 5G"}, {"label": "Màn hình", "value": "6.8 inch AMOLED, tần số quét 120Hz"}, {"label": "Chip xử lý", "value": "8 nhân hiệu năng cao"}, {"label": "RAM", "value": "12 GB"}, {"label": "Bộ nhớ trong", "value": "512 GB"}, {"label": "Camera sau", "value": "50 MP chính OIS + 48 MP tiềm vọng + 12 MP siêu rộng"}, {"label": "Zoom", "value": "Zoom quang 5x; zoom số tối đa 100x"}, {"label": "Camera trước", "value": "32 MP"}, {"label": "Pin", "value": "5000 mAh, sạc nhanh 67W"}, {"label": "Kết nối", "value": "5G, Wi-Fi 6, Bluetooth 5.3, NFC"}, {"label": "Hệ điều hành", "value": "Android 14"}, {"label": "Chống nước", "value": "IP68 theo thiết kế; không bảo hành ngấm nước"}, {"label": "Kích thước", "value": "Khoảng 163 x 75 x 8.8 mm"}, {"label": "Trọng lượng", "value": "Khoảng 225 g"}, {"label": "Bảo hành", "value": "12 tháng"}, {"label": "Xuất xứ", "value": "Trung Quốc"}],
    highlights: ["Camera tiềm vọng zoom quang 5x, zoom số tối đa 100x", "Màn hình AMOLED 6.8 inch 120Hz hiển thị mượt", "Hiệu năng cao với chip 8 nhân, RAM 12 GB, bộ nhớ 512 GB", "Pin 5000 mAh, hỗ trợ sạc nhanh 67W", "Kết nối 5G, Wi-Fi 6, Bluetooth 5.3 và NFC", "Thiết kế khung kim loại, mặt kính cường lực"],
    longDescription: "Pulse 11 Ultra 5G là mẫu điện thoại flagship hướng đến người dùng cần camera linh hoạt và hiệu năng cao. Máy trang bị cụm ba camera sau gồm 50 MP chính có OIS, 48 MP tiềm vọng và 12 MP siêu rộng, hỗ trợ zoom quang 5x và zoom số tối đa 100x. Màn hình AMOLED 6.8 inch tần số quét 120Hz giúp thao tác vuốt chạm và xem nội dung chuyển động mượt hơn.\n\nCấu hình gồm chip 8 nhân hiệu năng cao, RAM 12 GB và bộ nhớ trong 512 GB, phù hợp cho đa nhiệm, chỉnh ảnh, quay video và chơi game. Pin 5000 mAh hỗ trợ sạc nhanh 67W giúp rút ngắn thời gian sạc; thời lượng sử dụng thực tế phụ thuộc vào cường độ dùng, ứng dụng và cài đặt màn hình.\n\nMáy hỗ trợ 5G, Wi-Fi 6, Bluetooth 5.3 và NFC. Khả năng chống nước IP68 được thiết kế cho tình huống vô tình gặp nước nhưng không bảo hành ngấm nước; không nên dùng máy khi đang sạc trong môi trường ẩm ướt hoặc ngâm nước.",
    usageGuide: "Sạc máy bằng củ sạc và cáp tương thích công suất 67W; nên dùng sạc chính hãng hoặc sạc đạt chuẩn để đảm bảo an toàn. Lần đầu sử dụng, lắp SIM và kích hoạt 5G theo hướng dẫn của nhà mạng, kết nối Wi-Fi để cập nhật phần mềm và sao lưu dữ liệu. Để bảo vệ pin, tránh sạc khi máy quá nóng, không dùng máy khi đang sạc ở nơi ẩm ướt và không ngâm nước. Vệ sinh máy bằng khăn mềm, tránh dung dịch tẩy mạnh; bảo quản nơi khô ráo, tránh nhiệt độ cao và vật sắc nhọn.",
    warrantyPolicy: "Bảo hành 12 tháng cho lỗi kỹ thuật do nhà sản xuất. 1 đổi 1 trong 30 ngày đầu nếu lỗi sản xuất được xác nhận. Không bảo hành hư hỏng do rơi vỡ, vào nước, tự tháo lắp, dùng sạc không tương thích, cháy nổ do nguồn điện bất thường hoặc hao mòn tự nhiên của pin và phụ kiện.",
    origin: "Kho tổng E-Commerce, Hà Nội",
    promotionQuantity: 20,
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
        categoryPath: ["Trang chủ", "Laptop", "Laptop cao cấp"],
    details: [{"label": "Thương hiệu", "value": "Stratus"}, {"label": "Model", "value": "Pro 14"}, {"label": "CPU", "value": "Intel Core Ultra 7"}, {"label": "RAM", "value": "16 GB LPDDR5; có phiên bản 32 GB"}, {"label": "Bộ nhớ trong", "value": "1 TB SSD NVMe"}, {"label": "Màn hình", "value": "14 inch OLED 3K, tần số quét 120Hz"}, {"label": "Đồ họa", "value": "Intel Arc tích hợp"}, {"label": "Bàn phím", "value": "Có đèn nền, hành trình phím êm"}, {"label": "Kết nối", "value": "Wi-Fi 6E, Bluetooth 5.3; 2x Thunderbolt 4, 1x USB-A, HDMI 2.1, jack 3.5 mm"}, {"label": "Pin", "value": "70 Wh, sạc 100W USB-C"}, {"label": "Trọng lượng", "value": "Khoảng 1.4 kg"}, {"label": "Chất liệu", "value": "Vỏ nhôm nguyên khối"}, {"label": "Hệ điều hành", "value": "Windows 11 Home"}, {"label": "Bảo mật", "value": "Cảm biến vân tay tích hợp nút nguồn"}, {"label": "Bảo hành", "value": "12 tháng"}, {"label": "Xuất xứ", "value": "Trung Quốc"}],
    highlights: ["Màn hình OLED 3K 120Hz sắc nét, phù hợp đồ họa và giải trí", "CPU Intel Core Ultra 7, RAM 16 GB, SSD 1 TB", "Thiết kế nhôm nguyên khối, trọng lượng khoảng 1.4 kg", "Sạc USB-C 100W, thuận tiện khi di chuyển", "Bàn phím có đèn nền và cảm biến vân tay", "Cổng kết nối đa dạng gồm Thunderbolt 4, USB-A và HDMI 2.1"],
    longDescription: "Stratus Pro 14 là laptop cao cấp dành cho người dùng cần màn hình đẹp, hiệu năng ổn định và thiết kế gọn nhẹ. Máy trang bị màn hình 14 inch OLED 3K tần số quét 120Hz, CPU Intel Core Ultra 7, RAM 16 GB LPDDR5 và SSD 1 TB NVMe. Cấu hình này phù hợp cho công việc văn phòng, thiết kế đồ họa cơ bản, chỉnh sửa ảnh và giải trí hằng ngày.\n\nVỏ nhôm nguyên khối giúp máy chắc chắn và có trọng lượng khoảng 1.4 kg. Bàn phím có đèn nền, cảm biến vân tay tích hợp nút nguồn và hệ thống cổng kết nối gồm Thunderbolt 4, USB-A, HDMI 2.1 và jack tai nghe. Pin 70 Wh hỗ trợ sạc USB-C 100W, thuận tiện khi làm việc tại quán cà phê hoặc di chuyển.\n\nHiệu năng thực tế có thể thay đổi tùy tác vụ, nhiệt độ môi trường và cài đặt nguồn. Máy không thiết kế chống nước; cần tránh để chất lỏng tràn vào bàn phím và cổng kết nối.",
    usageGuide: "Sạc laptop bằng củ sạc USB-C 100W tương thích; nên sạc khi pin dưới 20% và tránh để máy sạc trong túi kín. Lần đầu sử dụng, kết nối Wi-Fi, hoàn tất thiết lập Windows, cập nhật driver và bật sao lưu dữ liệu. Khi di chuyển, tắt máy hoặc gập máy nhẹ nhàng, không đặt vật nặng lên nắp. Vệ sinh màn hình bằng khăn microfiber khô hoặc ẩm nhẹ; không xịt nước trực tiếp lên máy. Bảo quản nơi khô ráo, tránh nhiệt độ cao và tránh để máy trong cốp xe.",
    warrantyPolicy: "Bảo hành 12 tháng cho lỗi kỹ thuật do nhà sản xuất. 1 đổi 1 trong 30 ngày đầu nếu lỗi sản xuất được xác nhận. Không bảo hành hư hỏng do rơi vỡ, tràn chất lỏng, tự tháo lắp, dùng sạc không tương thích, cháy nổ do nguồn điện bất thường hoặc hao mòn tự nhiên của pin.",
    origin: "Kho tổng E-Commerce, Hà Nội",
    promotionQuantity: 15,
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
        categoryPath: ["Trang chủ", "Âm thanh", "Tai nghe gaming"],
    details: [{"label": "Thương hiệu", "value": "Vortex"}, {"label": "Model", "value": "Surround Sound 7.1"}, {"label": "Kiểu tai nghe", "value": "Chụp tai gaming"}, {"label": "Kết nối", "value": "USB-A; jack 3.5 mm"}, {"label": "Âm thanh", "value": "Vòm 7.1 ảo qua USB, có phần mềm tùy chỉnh khi dùng USB"}, {"label": "Driver", "value": "50 mm"}, {"label": "Micro", "value": "Micro rời có khử ồn, có công tắc tắt/mở"}, {"label": "Dây", "value": "Dài khoảng 2.2 m"}, {"label": "Trọng lượng", "value": "Khoảng 320 g"}, {"label": "Chất liệu", "value": "Da PU, khung nhựa"}, {"label": "Tương thích", "value": "PC, laptop; thiết bị có cổng USB-A hoặc jack 3.5 mm"}, {"label": "Chống nước", "value": "Không chống nước"}, {"label": "Phụ kiện", "value": "Tai nghe, micro rời, cáp chuyển, sách hướng dẫn"}, {"label": "Bảo hành", "value": "12 tháng"}, {"label": "Xuất xứ", "value": "Trung Quốc"}],
    highlights: ["Âm thanh vòm 7.1 ảo qua USB, tăng cảm giác định hướng khi chơi game", "Driver 50 mm cho âm bass rõ và âm lượng lớn", "Micro rời có khử ồn, thuận tiện giao tiếp khi chơi game", "Đệm tai da PU êm, phù hợp sử dụng trong nhiều giờ", "Dây dài khoảng 2.2 m, dễ bố trí với PC hoặc laptop", "Tương thích PC, laptop qua USB-A hoặc jack 3.5 mm"],
    longDescription: "Vortex Surround Sound 7.1 là tai nghe gaming chụp tai sử dụng driver 50 mm và hỗ trợ âm thanh vòm 7.1 ảo khi kết nối qua USB. Hiệu ứng vòm 7.1 giúp tăng cảm giác định hướng âm thanh trong game, nhưng đây là hiệu ứng xử lý kỹ thuật số, không phải hệ thống 7.1 vật lý. Khi dùng jack 3.5 mm, tai nghe hoạt động ở chế độ âm thanh stereo thông thường.\n\nMicro rời có khử ồn và công tắc tắt/mở, thuận tiện cho giao tiếp nhóm. Phần đệm tai da PU cùng khung nhựa chắc chắn giúp đeo thoải mái trong thời gian dài. Tai nghe không dùng pin, được cấp nguồn qua cổng USB hoặc jack 3.5 mm tùy thiết bị.\n\nSản phẩm phù hợp cho nhu cầu chơi game, họp online và giải trí trên PC hoặc laptop. Tai nghe không chống nước; cần tránh mồ hôi nhiều, nước uống tràn và môi trường ẩm ướt.",
    usageGuide: "Kết nối tai nghe với PC hoặc laptop qua USB-A để dùng âm thanh vòm 7.1 ảo và phần mềm tùy chỉnh nếu có; với thiết bị chỉ có jack 3.5 mm, cắm trực tiếp vào cổng tai nghe. Khi dùng micro rời, gắn micro vào tai nghe và kiểm tra mức thu trong cài đặt âm thanh của máy. Điều chỉnh âm lượng vừa phải để bảo vệ thính giác. Vệ sinh đệm tai bằng khăn mềm ẩm, không ngâm nước; bảo quản nơi khô ráo, tránh kéo mạnh dây và vật sắc nhọn.",
    warrantyPolicy: "Bảo hành 12 tháng cho lỗi kỹ thuật do nhà sản xuất. 1 đổi 1 trong 30 ngày đầu nếu lỗi sản xuất được xác nhận. Không bảo hành hư hỏng do rơi vỡ, vào nước, kéo đứt dây, tự tháo lắp, dùng sai cổng kết nối hoặc hao mòn tự nhiên của đệm tai và dây cáp.",
    origin: "Kho tổng E-Commerce, Hà Nội",
    promotionQuantity: 60,
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
        categoryPath: ["Trang chủ", "Thiết bị đeo thông minh", "Vòng đeo tay thông minh"],
    details: [{"label": "Thương hiệu", "value": "Stratus"}, {"label": "Model", "value": "Fit 3"}, {"label": "Kiểu sản phẩm", "value": "Vòng đeo tay thông minh"}, {"label": "Màn hình", "value": "AMOLED 1.47 inch"}, {"label": "Cảm biến", "value": "Nhịp tim, SpO2, gia tốc"}, {"label": "Tính năng", "value": "Theo dõi giấc ngủ, đếm bước, calo, hơn 50 chế độ thể thao, thông báo"}, {"label": "Kết nối", "value": "Bluetooth 5.1, tương thích iOS và Android"}, {"label": "Thời lượng pin", "value": "Khoảng 14 ngày với mức sử dụng thông thường"}, {"label": "Sạc", "value": "Sạc nam châm"}, {"label": "Chống nước", "value": "5ATM, phù hợp rửa tay và bơi lội nhẹ"}, {"label": "Kích thước", "value": "Khoảng 45 x 25 x 10 mm"}, {"label": "Trọng lượng", "value": "Khoảng 25 g"}, {"label": "Chất liệu", "value": "Dây silicone, thân hợp kim nhẹ"}, {"label": "Bảo hành", "value": "12 tháng"}, {"label": "Xuất xứ", "value": "Trung Quốc"}],
    highlights: ["Màn hình AMOLED 1.47 inch sáng rõ, dễ xem khi vận động", "Theo dõi nhịp tim, SpO2, giấc ngủ và số bước chân", "Hơn 50 chế độ thể thao phù hợp nhiều nhu cầu luyện tập", "Pin khoảng 14 ngày với mức sử dụng thông thường", "Chống nước 5ATM, dùng được khi rửa tay và bơi lội nhẹ", "Thiết kế nhẹ khoảng 25 g, đeo thoải mái cả ngày"],
    longDescription: "Stratus Fit 3 là vòng đeo tay thông minh hướng đến nhu cầu theo dõi vận động và sức khỏe cơ bản hằng ngày. Sản phẩm có màn hình AMOLED 1.47 inch, cảm biến nhịp tim, SpO2 và gia tốc, hỗ trợ theo dõi giấc ngủ, đếm bước, calo và hơn 50 chế độ thể thao. Các chỉ số sức khỏe chỉ mang tính tham khảo, không dùng để chẩn đoán hoặc thay thế thiết bị y tế.\n\nVòng đeo tay kết nối với điện thoại qua Bluetooth 5.1 và ứng dụng đồng bộ để xem dữ liệu, cài đặt mục tiêu vận động và nhận thông báo. Thời lượng pin khoảng 14 ngày với mức sử dụng thông thường; thời gian thực tế có thể ngắn hơn khi bật nhiều thông báo, đo nhịp tim liên tục hoặc sử dụng nhiều chế độ thể thao.\n\nThiết kế nhẹ khoảng 25 g với dây silicone phù hợp đeo cả ngày. Khả năng chống nước 5ATM giúp sử dụng khi rửa tay hoặc bơi lội nhẹ; không dùng khi tắm nước nóng, xông hơi hoặc lặn.",
    usageGuide: "Sạc vòng đeo tay bằng đế nam châm đi kèm, tháo khỏi cổ tay khi sạc và lau khô tiếp điểm trước khi sạc. Ghép nối: mở Bluetooth trên điện thoại, mở ứng dụng quản lý của Stratus, chọn Fit 3 và làm theo hướng dẫn. Đeo vừa cổ tay, không quá chặt để cảm biến hoạt động ổn định và tránh kích ứng da. Vệ sinh dây và mặt sau bằng khăn mềm ẩm, tránh xà phòng mạnh, nước nóng và hóa chất; làm khô sau khi bơi hoặc ra mồ hôi nhiều.",
    warrantyPolicy: "Bảo hành 12 tháng cho lỗi kỹ thuật do nhà sản xuất. 1 đổi 1 trong 30 ngày đầu nếu lỗi sản xuất được xác nhận. Không bảo hành hư hỏng do rơi vỡ, ngấm nước sai cách, dùng trong môi trường nước nóng, tự tháo lắp hoặc hao mòn tự nhiên của dây đeo và pin.",
    origin: "Kho tổng E-Commerce, Hà Nội",
    promotionQuantity: 80,
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
        categoryPath: ["Trang chủ", "Âm thanh", "Loa di động"],
    details: [{"label": "Thương hiệu", "value": "AuraSound"}, {"label": "Model", "value": "BassGo 2"}, {"label": "Công suất", "value": "20W"}, {"label": "Kết nối", "value": "Bluetooth 5.3, hỗ trợ ghép TWS 2 loa"}, {"label": "Pin", "value": "3600 mAh, khoảng 12 giờ phát nhạc"}, {"label": "Chống nước", "value": "IPX7"}, {"label": "Cổng sạc", "value": "USB-C"}, {"label": "Chất liệu", "value": "Lưới kim loại, vỏ cao su và nhựa"}, {"label": "Kích thước", "value": "Khoảng 180 x 75 x 75 mm"}, {"label": "Trọng lượng", "value": "Khoảng 580 g"}, {"label": "Phụ kiện", "value": "Loa, cáp USB-C, dây đeo, sách hướng dẫn"}, {"label": "Bảo hành", "value": "12 tháng"}, {"label": "Xuất xứ", "value": "Trung Quốc"}],
    highlights: ["Chống nước IPX7, phù hợp sử dụng ngoài trời và gần hồ bơi", "Công suất 20W cho âm bass rõ, âm lượng đủ dùng", "Pin khoảng 12 giờ, thuận tiện cho dã ngoại và du lịch", "Bluetooth 5.3 kết nối ổn định, hỗ trợ ghép 2 loa TWS", "Thiết kế nhỏ gọn, có dây đeo tiện mang theo", "Cổng sạc USB-C phổ biến, dễ tìm cáp thay thế"],
    longDescription: "AuraSound BassGo 2 là loa di động không dây nhỏ gọn dành cho nhu cầu nghe nhạc trong phòng, khi đi du lịch hoặc các buổi tụ tập ngoài trời. Loa có công suất 20W, kết nối Bluetooth 5.3 và hỗ trợ ghép TWS để tạo cặp stereo khi dùng hai loa cùng model. Thiết kế lưới kim loại kết hợp vỏ cao su và nhựa giúp loa chắc chắn, dễ cầm nắm.\n\nPin 3600 mAh cho thời lượng phát nhạc khoảng 12 giờ tùy âm lượng và nội dung. Chuẩn chống nước IPX7 giúp loa chịu được nước bắn hoặc ngâm nước ngắn hạn theo điều kiện thiết kế; không nên sạc khi loa còn ẩm và không dùng trong môi trường nước nóng.\n\nLoa phù hợp nghe nhạc, podcast và giải trí hằng ngày. Âm lượng và chất âm có thể thay đổi theo vị trí đặt loa, nguồn phát và mức âm lượng sử dụng.",
    usageGuide: "Sạc loa bằng cáp USB-C đi kèm; đảm bảo cổng sạc khô ráo trước khi cắm sạc. Ghép nối: bật loa, giữ nút Bluetooth đến khi đèn nhấp nháy, mở Bluetooth trên điện thoại và chọn AuraSound BassGo 2. Để ghép TWS, bật hai loa cùng model và làm theo hướng dẫn của nhà sản xuất. Khi dùng gần nước, đóng chặt nắp cổng sạc; sau khi dính nước, lau khô và để ráo trước khi sạc. Vệ sinh bằng khăn mềm ẩm, tránh dung dịch tẩy mạnh; bảo quản nơi khô ráo, tránh nhiệt độ cao.",
    warrantyPolicy: "Bảo hành 12 tháng cho lỗi kỹ thuật do nhà sản xuất. 1 đổi 1 trong 30 ngày đầu nếu lỗi sản xuất được xác nhận. Không bảo hành hư hỏng do rơi vỡ, ngấm nước khi cổng sạc chưa đóng kín, tự tháo lắp, dùng sai nguồn sạc hoặc hao mòn tự nhiên của pin và phụ kiện.",
    origin: "Kho tổng E-Commerce, Hà Nội",
    promotionQuantity: 45,
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
        categoryPath: ["Trang chủ", "Điện thoại - Máy tính bảng", "Máy tính bảng"],
    details: [{"label": "Thương hiệu", "value": "Pulse"}, {"label": "Model", "value": "Tab Pro 12"}, {"label": "Màn hình", "value": "12.1 inch 2.5K, tần số quét 120Hz"}, {"label": "Chip xử lý", "value": "8 nhân hiệu năng cao"}, {"label": "RAM", "value": "8 GB; có phiên bản 12 GB"}, {"label": "Bộ nhớ trong", "value": "256 GB; có phiên bản 512 GB"}, {"label": "Bút cảm ứng", "value": "Pulse Pen đi kèm, hỗ trợ lực nhấn, sạc nam châm"}, {"label": "Camera", "value": "Sau 13 MP; trước 8 MP"}, {"label": "Loa", "value": "4 loa stereo"}, {"label": "Pin", "value": "10000 mAh, sạc nhanh 33W"}, {"label": "Kết nối", "value": "Wi-Fi 6, Bluetooth 5.2, USB-C"}, {"label": "Hệ điều hành", "value": "Android 14"}, {"label": "Chất liệu", "value": "Khung kim loại, mặt kính"}, {"label": "Kích thước", "value": "Khoảng 280 x 185 x 6.5 mm"}, {"label": "Trọng lượng", "value": "Khoảng 600 g"}, {"label": "Chống nước", "value": "Không chống nước"}, {"label": "Bảo hành", "value": "12 tháng cho máy; 6 tháng cho bút"}, {"label": "Xuất xứ", "value": "Trung Quốc"}],
    highlights: ["Màn hình 12.1 inch 2.5K 120Hz phù hợp học tập, ghi chú và giải trí", "Bút cảm ứng Pulse Pen đi kèm, hỗ trợ lực nhấn và sạc nam châm", "Cấu hình 8 GB RAM, 256 GB bộ nhớ trong", "4 loa stereo cho trải nghiệm xem phim, nghe nhạc tốt hơn", "Pin 10000 mAh, hỗ trợ sạc nhanh 33W", "Thiết kế mỏng khoảng 6.5 mm, khung kim loại chắc chắn"],
    longDescription: "Pulse Tab Pro 12 là máy tính bảng đồ họa hướng đến nhu cầu học tập, ghi chú, vẽ phác thảo và giải trí. Máy có màn hình 12.1 inch 2.5K tần số quét 120Hz, chip 8 nhân hiệu năng cao, RAM 8 GB và bộ nhớ trong 256 GB. Bút cảm ứng Pulse Pen được đóng kèm, hỗ trợ lực nhấn và sạc nam châm, thuận tiện cho việc ghi chú và phác thảo.\n\nMáy trang bị 4 loa stereo, pin 10000 mAh và sạc nhanh 33W, phù hợp cho các buổi học online, xem phim và làm việc nhẹ. Kết nối Wi-Fi 6, Bluetooth 5.2 và USB-C giúp truyền dữ liệu, kết nối phụ kiện và sạc máy. Bàn phím rời nếu có sẽ được bán riêng, không nằm trong bộ sản phẩm tiêu chuẩn.\n\nSản phẩm không chống nước; cần tránh để chất lỏng tràn vào màn hình, cổng sạc và loa. Hiệu năng thực tế có thể thay đổi tùy ứng dụng, dung lượng lưu trữ và cách sử dụng.",
    usageGuide: "Sạc máy bằng củ sạc USB-C tương thích 33W; nên sạc khi pin dưới 20% và tránh sạc trong môi trường ẩm ướt. Ghép bút: gắn bút vào cạnh nam châm của máy hoặc bật Bluetooth và làm theo hướng dẫn trên màn hình; sạc bút bằng nam châm khi không dùng. Lần đầu sử dụng, kết nối Wi-Fi, cập nhật phần mềm và sao lưu dữ liệu. Vệ sinh màn hình bằng khăn microfiber mềm, tránh dung dịch tẩy mạnh; bảo quản máy và bút nơi khô ráo, tránh nhiệt độ cao, va đập và vật sắc nhọn.",
    warrantyPolicy: "Bảo hành 12 tháng cho máy và 6 tháng cho bút cảm ứng đối với lỗi kỹ thuật do nhà sản xuất. 1 đổi 1 trong 30 ngày đầu nếu lỗi sản xuất được xác nhận. Không bảo hành hư hỏng do rơi vỡ, vào nước, tự tháo lắp, dùng sạc không tương thích, mất bút hoặc hao mòn tự nhiên của pin và phụ kiện.",
    origin: "Kho tổng E-Commerce, Hà Nội",
    promotionQuantity: 25,
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
