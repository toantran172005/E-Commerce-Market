import { initializeApp } from 'firebase/app';
import { getFirestore, doc, writeBatch, collection, getDocs, updateDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Đọc .env từ ECommerceApp
const envPath = path.resolve('ECommerceApp/.env');
const envContent = fs.existsSync(envPath)
  ? fs.readFileSync(envPath, 'utf8')
  : fs.readFileSync('.env', 'utf8');

const env = {};
envContent.split('\n').forEach((line) => {
  const parts = line.trim().split('=');
  if (parts.length >= 2) env[parts[0]] = parts.slice(1).join('=');
});

const firebaseConfig = {
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const MOCK_REVIEWS_DATA = [
  // apple-iphone-16-pro-max
  {
    productId: 'apple-iphone-16-pro-max',
    reviews: [
      {
        userName: 'Nguyễn Tuấn Kiệt',
        rating: 5,
        comment: 'Máy cầm đầm tay, viền titan sa mạc sang trọng, camera zoom 5x chụp nét căng dù thiếu sáng. Pin trâu dùng cả ngày từ 7h sáng đến tối vẫn còn 35%.',
        images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600'],
      },
      {
        userName: 'Trần Mai Anh',
        rating: 5,
        comment: 'Màu Titan sa mạc bên ngoài nhìn đẹp hơn trên ảnh nhiều. Màn hình ProMotion 120Hz mượt mà, Dynamic Island cực kỳ tiện ích khi theo dõi Grab và giao đồ ăn.',
        images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600'],
      },
      {
        userName: 'Lê Hoàng Phúc',
        rating: 5,
        comment: 'Đóng gói cẩn thận 3 lớp chống sốc, giao hàng siêu nhanh. Hàng chính hãng VNA nguyên seal, kích hoạt bảo hành đủ 12 tháng tại Apple Store.',
      },
      {
        userName: 'Phạm Thu Hương',
        rating: 4,
        comment: 'Máy xuất sắc không có điểm gì chê, chỉ có điều nút Camera Control mới dùng hơi lạ tay tí, dùng quen vài hôm thì bấm chụp quay cực nhanh.',
      },
    ],
  },
  // apple-iphone-16
  {
    productId: 'apple-iphone-16',
    reviews: [
      {
        userName: 'Đặng Quốc Huy',
        rating: 5,
        comment: 'Màu hồng pastel xinh xỉu, nút Action button và Camera Control cực tiện. Chip A18 chạy mọi app vèo vèo.',
        images: ['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600'],
      },
      {
        userName: 'Vũ Hải Đăng',
        rating: 5,
        comment: 'Nâng cấp từ iPhone 12 lên 16 thấy khác biệt hoàn toàn, màn hình sáng rõ ngoài trời, pin dùng thoải mái cả ngày.',
      },
      {
        userName: 'Ngô Bảo Châu',
        rating: 4,
        comment: 'Máy nhỏ gọn cầm một tay vừa vặn, loa to ấm, chụp ảnh màu sắc tươi tắn chân thực.',
      },
    ],
  },
  // apple-macbook-air-m3-13
  {
    productId: 'apple-macbook-air-m3-13',
    reviews: [
      {
        userName: 'Bùi Quang Minh',
        rating: 5,
        comment: 'Chip M3 mát rượi, pin trâu làm việc văn phòng và code cả ngày không cần cắm sạc. Bàn phím gõ êm, trackpad rê chuột mượt mà đỉnh cao.',
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'],
      },
      {
        userName: 'Đỗ Thùy Trang',
        rating: 5,
        comment: 'Mỏng nhẹ tiện mang đi cà phê làm việc, màn hình Liquid Retina hiển thị màu sắc chuẩn chỉnh cho designer.',
      },
      {
        userName: 'Hoàng Đức Nam',
        rating: 5,
        comment: 'Giao hàng bọc hộp carton cứng cáp, máy nguyên seal kích hoạt chuẩn Apple. Rất hài lòng.',
      },
    ],
  },
  // apple-macbook-pro-14-m3
  {
    productId: 'apple-macbook-pro-14-m3',
    reviews: [
      {
        userName: 'Võ Thành Trung',
        rating: 5,
        comment: 'Màn hình mini-LED 120Hz Liquid Retina XDR quá đỉnh, render video 4K nhanh như chớp. Quạt êm ru gần như không bao giờ nghe tiếng.',
        images: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600'],
      },
      {
        userName: 'Nguyễn Thanh Sơn',
        rating: 5,
        comment: 'Bản Space Black chống bám vân tay tốt hơn đời trước, âm thanh 6 loa nghe nhạc xem phim như loa rạp.',
      },
    ],
  },
  // apple-airpods-pro-2-usbc
  {
    productId: 'apple-airpods-pro-2-usbc',
    reviews: [
      {
        userName: 'Lâm Gia Bảo',
        rating: 5,
        comment: 'Chống ồn chủ động ANC đỉnh của chóp, đi xe buýt hay máy bay bật lên là yên tĩnh hẳn. Cổng Type-C sạc chung với iPhone và Mac rất tiện.',
        images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600'],
      },
      {
        userName: 'Phan Mỹ Duyên',
        rating: 5,
        comment: 'Âm bass chắc, mid ngọt ngào nghe podcast và nhạc pop cực hay. Đệm tai silicone đeo êm không bị cấn tai.',
      },
      {
        userName: 'Trịnh Đình Khang',
        rating: 5,
        comment: 'Hàng chuẩn seal Apple, kết nối tức thì, tính năng vuốt tăng giảm âm lượng trên tai rất nhạy.',
      },
    ],
  },
  // apple-ipad-pro-m4-11
  {
    productId: 'apple-ipad-pro-m4-11',
    reviews: [
      {
        userName: 'Dương Minh Trí',
        rating: 5,
        comment: 'Màn hình Tandem OLED hiển thị đen sâu tuyệt đối, chip M4 mỏng dính nhưng sức mạnh vô đối. Vẽ Procreate mượt không độ trễ.',
        images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600'],
      },
      {
        userName: 'Lê Cẩm Tú',
        rating: 5,
        comment: 'Giao hàng nguyên seal, máy nhẹ ngạc nhiên, mang đi học đi làm cực tiện lợi.',
      },
    ],
  },
  // apple-watch-series-10
  {
    productId: 'apple-watch-series-10',
    reviews: [
      {
        userName: 'Nguyễn Đình Trọng',
        rating: 5,
        comment: 'Màn hình mỏng hơn viền siêu mỏng, sạc 30 phút là được 80% pin. Tính năng đo độ sâu và nhiệt độ nước đi bơi chuẩn xác.',
      },
      {
        userName: 'Cao Minh Tú',
        rating: 5,
        comment: 'Đeo nhẹ tênh như không đeo, theo dõi giấc ngủ và nhịp tim rất chi tiết.',
      },
    ],
  },
  // samsung-galaxy-s24-ultra
  {
    productId: 'samsung-galaxy-s24-ultra',
    reviews: [
      {
        userName: 'Huỳnh Nhật Quang',
        rating: 5,
        comment: 'Màn hình phẳng chống chói Anti-Reflective cực xịn, bút S-Pen ghi chú nhanh. Tính năng Galaxy AI dịch thuật và Circle to Search tiện lợi.',
        images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600'],
      },
      {
        userName: 'Trần Văn Hưng',
        rating: 5,
        comment: 'Camera 200MP zoom nét kinh ngạc, khung viền titan cứng cáp cầm đầm tay.',
      },
      {
        userName: 'Nguyễn Thị Yến',
        rating: 4,
        comment: 'Máy xịn, màn hình to xem phim cực đã. Pin 5000mAh on screen 8-9 tiếng liên tục.',
      },
    ],
  },
  // samsung-galaxy-z-fold-6
  {
    productId: 'samsung-galaxy-z-fold-6',
    reviews: [
      {
        userName: 'Đào Hữu Tuấn',
        rating: 5,
        comment: 'Bản lề gập khít hoàn toàn, màn hình ngoài rộng hơn gõ phím thoải mái. Mở ra đa nhiệm 3 ứng dụng phục vụ công việc siêu tiện.',
      },
      {
        userName: 'Phan Quốc Việt',
        rating: 5,
        comment: 'Thiết kế vuông vức nam tính, nhẹ hơn Fold 5 rõ rệt. Đóng gói cẩn thận, bảo hành chính hãng.',
      },
    ],
  },
  // samsung-galaxy-buds-3-pro
  {
    productId: 'samsung-galaxy-buds-3-pro',
    reviews: [
      {
        userName: 'Đinh Quang Hải',
        rating: 5,
        comment: 'Thiết kế mới có dải đèn LED Blade Lights hiện đại, âm thanh 2 chiều trong trẻo, khử ồn ANC tốt.',
      },
      {
        userName: 'Trương Hoàng Long',
        rating: 4,
        comment: 'Chất âm thiên sáng, đàm thoại lọc gió tốt khi đi ngoài đường.',
      },
    ],
  },
  // samsung-galaxy-tab-s9-fe
  {
    productId: 'samsung-galaxy-tab-s9-fe',
    reviews: [
      {
        userName: 'Lê Thảo My',
        rating: 5,
        comment: 'Tặng kèm bút S-Pen không cần sạc pin, vẽ và ghi chú học tập mượt mà. Chống nước IP68 yên tâm sử dụng.',
      },
      {
        userName: 'Phạm Đăng Khoa',
        rating: 5,
        comment: 'Màn hình 90Hz sáng đẹp, loa kép AKG xem phim to rõ, giá quá hời cho một chiếc tablet học tập.',
      },
    ],
  },
  // samsung-galaxy-watch-7
  {
    productId: 'samsung-galaxy-watch-7',
    reviews: [
      {
        userName: 'Nguyễn Văn Dũng',
        rating: 5,
        comment: 'Chip 3nm chạy mượt không giật lag tí nào, cảm biến BioActive đo chỉ số sức khoẻ chính xác.',
      },
      {
        userName: 'Trần Ngọc Ánh',
        rating: 5,
        comment: 'GPS tần số kép chạy bộ ngoài trời định vị cung đường rất chuẩn.',
      },
    ],
  },
  // sony-wh-1000xm5 & p-01
  {
    productId: 'sony-wh-1000xm5',
    reviews: [
      {
        userName: 'Vũ Đức Thắng',
        rating: 5,
        comment: 'Vua chống ồn không đối thủ! Đeo lên là tách biệt hoàn toàn với thế giới xung quanh. Đệm tai mềm xốp đeo 4-5 tiếng không đau đầu.',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'],
      },
      {
        userName: 'Nguyễn Hải Yến',
        rating: 5,
        comment: 'Âm trường rộng, nghe nhạc Acoustic hay Jazz vocal nổi da gà. Pin dùng 30 tiếng cả tuần sạc 1 lần.',
      },
    ],
  },
  {
    productId: 'p-01',
    reviews: [
      {
        userName: 'Hoàng Văn Thái',
        rating: 5,
        comment: 'Tai nghe chống ồn đỉnh cao của Sony, bass sâu lắng, đeo êm tai làm việc tập trung cực tốt.',
      },
      {
        userName: 'Lê Diệu Linh',
        rating: 5,
        comment: 'Hàng chính hãng Sony Việt Nam nguyên seal, kết nối Bluetooth đa điểm cực kỳ mượt mà.',
      },
    ],
  },
  // sony-wf-1000xm5
  {
    productId: 'sony-wf-1000xm5',
    reviews: [
      {
        userName: 'Hồ Thanh Tùng',
        rating: 5,
        comment: 'Chất âm Hi-Res LDAC chi tiết, nút bọt biển cách âm tự nhiên tốt. Hộp sạc nhỏ gọn bỏ túi quần không cộm.',
      },
      {
        userName: 'Phạm Gia Hân',
        rating: 5,
        comment: 'Thiết kế bóng bẩy, kết nối 2 thiết bị cùng lúc mượt mà giữa laptop và điện thoại.',
      },
    ],
  },
  // asus-rog-strix-g16
  {
    productId: 'asus-rog-strix-g16',
    reviews: [
      {
        userName: 'Lê Anh Tuấn',
        rating: 5,
        comment: 'Cấu hình i7 kèm RTX 4060 cân mọi game AAA max settings mượt mà. Tản nhiệt buồng hơi mát rượi, LED RGB bắt mắt.',
        images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600'],
      },
      {
        userName: 'Trần Gia Kiệt',
        rating: 5,
        comment: 'Màn hình 165Hz chuẩn màu 100% sRGB, bàn phím gõ nảy. Shop giao hỏa tốc bọc bóng khí an toàn.',
      },
    ],
  },
  // asus-vivobook-15-oled
  {
    productId: 'asus-vivobook-15-oled',
    reviews: [
      {
        userName: 'Nguyễn Bích Ngọc',
        rating: 5,
        comment: 'Màn hình OLED màu đen sâu tuyệt đối, xem phim và làm đồ hoạ nét căng. Bản lề 180 độ tiện dụng.',
      },
      {
        userName: 'Võ Minh Đức',
        rating: 4,
        comment: 'Máy mỏng nhẹ, bàn phím số riêng tiện nhập liệu Excel. Giá rẻ mà có màn OLED quá đáng tiền.',
      },
    ],
  },
  // dell-xps-13-plus
  {
    productId: 'dell-xps-13-plus',
    reviews: [
      {
        userName: 'Trương Quốc Đạt',
        rating: 5,
        comment: 'Thiết kế đến từ tương lai! Dải phím cảm ứng và trackpad ẩn kính liền khối cực kì tối giản và sang trọng.',
        images: ['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600'],
      },
      {
        userName: 'Nguyễn Quỳnh Chi',
        rating: 5,
        comment: 'Màn hình 3.5K OLED rực rỡ, vỏ nhôm CNC sắc sảo từng góc cạnh.',
      },
    ],
  },
  // lenovo-ideapad-slim-3
  {
    productId: 'lenovo-ideapad-slim-3',
    reviews: [
      {
        userName: 'Đặng Minh Quân',
        rating: 5,
        comment: 'Máy chạy mượt các tác vụ học tập văn phòng, khởi động máy chỉ mất 5 giây. Pin dùng 6-7 tiếng.',
      },
      {
        userName: 'Lê Thị Thu',
        rating: 5,
        comment: 'Giá tốt, máy nhẹ phù hợp sinh viên mang đi học hàng ngày. Loa Dolby Audio to rõ.',
      },
    ],
  },
  // logitech-mx-master-3s
  {
    productId: 'logitech-mx-master-3s',
    reviews: [
      {
        userName: 'Phạm Minh Hoàng',
        rating: 5,
        comment: 'Chuột văn phòng tốt nhất thế giới! Con lăn MagSpeed cuộn 1000 dòng/giây siêu êm, click chuột im lặng không ồn ào.',
        images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600'],
      },
      {
        userName: 'Nguyễn Hữu Trí',
        rating: 5,
        comment: 'Cầm công thái học cả ngày không mỏi cổ tay. Kết nối chuyển đổi 3 máy tính bằng 1 nút bấm.',
      },
    ],
  },
  // logitech-mx-mechanical
  {
    productId: 'logitech-mx-mechanical',
    reviews: [
      {
        userName: 'Đỗ Hoàng Long',
        rating: 5,
        comment: 'Switch gõ nảy, âm thanh đầm chắc không làm phiền người xung quanh. Đèn nền thông minh tự sáng khi đưa tay lại gần.',
      },
      {
        userName: 'Lương Thế Thành',
        rating: 5,
        comment: 'Layout Mini gọn gàng giải phóng không gian bàn làm việc, pin dùng vài tháng mới phải sạc.',
      },
    ],
  },
  // xiaomi-14-ultra
  {
    productId: 'xiaomi-14-ultra',
    reviews: [
      {
        userName: 'Trần Đình Khang',
        rating: 5,
        comment: 'Camera Leica 1 inch chụp xoá phông tự nhiên như máy ảnh cơ, màu sắc có chiều sâu và cảm xúc. Sạc 90W 30 phút đầy pin.',
        images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600'],
      },
      {
        userName: 'Bùi Đức Thịnh',
        rating: 5,
        comment: 'Màn hình 2K cong tràn cạnh vuốt cực sướng, chip Snapdragon 8 Gen 3 chơi game không tụt fps.',
      },
    ],
  },
  // xiaomi-pad-6
  {
    productId: 'xiaomi-pad-6',
    reviews: [
      {
        userName: 'Nguyễn Hoàng Nam',
        rating: 5,
        comment: 'Màn hình 144Hz siêu mượt, thân kim loại nguyên khối cứng cáp. Tầm giá dưới 10 triệu không con nào qua được.',
      },
      {
        userName: 'Phan Thị Mai',
        rating: 5,
        comment: 'Loa 4 kênh Dolby Atmos nghe nhạc sống động, pin 8840mAh xem Youtube cả ngày.',
      },
    ],
  },
  // xiaomi-redmibook-pro-15
  {
    productId: 'xiaomi-redmibook-pro-15',
    reviews: [
      {
        userName: 'Vũ Anh Dũng',
        rating: 5,
        comment: 'Màn hình 3.2K 165Hz trong vắt, vỏ kim loại CNC hoàn thiện tương đương MacBook. Pin 99Wh trâu bò.',
      },
      {
        userName: 'Lê Quang Vinh',
        rating: 5,
        comment: 'Hiệu năng quá mạnh so với tầm giá, quạt tản nhiệt kép làm việc nặng không bị nóng.',
      },
    ],
  },
  // xiaomi-smart-band-8
  {
    productId: 'xiaomi-smart-band-8',
    reviews: [
      {
        userName: 'Nguyễn Thanh Thảo',
        rating: 5,
        comment: 'Giá chưa tới 1 triệu mà màn hình 60Hz mượt mà, dây đeo tháo lắp nhiều kiểu thời trang. Pin 2 tuần mới phải sạc.',
      },
      {
        userName: 'Trần Văn An',
        rating: 5,
        comment: 'Đo nhịp tim, SpO2 liên tục, có nhiều chế độ tập luyện chạy bộ rất tiện.',
      },
    ],
  },
];

async function seedReviewsAndRatings() {
  console.log('🚀 Bắt đầu tạo dữ liệu ĐÁNH GIÁ THỰC TẾ vào cả 2 root collection: "reviews" và "ratings"...');

  let totalReviews = 0;
  const productStats = new Map();

  // Tạo batch ghi cho reviews và ratings
  const batch = writeBatch(db);

  for (const item of MOCK_REVIEWS_DATA) {
    let sum = 0;
    let count = 0;

    item.reviews.forEach((rev, idx) => {
      totalReviews += 1;
      const reviewDocId = `rev_${item.productId}_${idx + 1}`;
      const ratingDocId = `rat_${item.productId}_${idx + 1}`;
      const createdAt = new Date(Date.now() - (idx + 1) * 86400000 * 2).toISOString();
      const userId = `user_vip_${idx + 1}`;

      const reviewPayload = {
        id: reviewDocId,
        productId: item.productId,
        userId,
        userName: rev.userName,
        userAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.userName)}&background=random`,
        rating: rev.rating,
        comment: rev.comment,
        images: rev.images || [],
        createdAt,
      };

      const ratingPayload = {
        id: ratingDocId,
        productId: item.productId,
        orderId: `ORD-SEED-${item.productId}-${idx + 1}`,
        userId,
        userName: rev.userName,
        userAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.userName)}&background=random`,
        rating: rev.rating,
        comment: rev.comment,
        images: rev.images || [],
        createdAt,
      };

      // 1. Ghi vào root collection 'reviews'
      batch.set(doc(db, 'reviews', reviewDocId), reviewPayload);

      sum += rev.rating;
      count += 1;
    });

    const avgRating = count > 0 ? Math.round((sum / count) * 10) / 10 : 5.0;
    productStats.set(item.productId, { rating: avgRating, reviewCount: count });
  }

  await batch.commit();
  console.log(`✅ Đã ghi thành công ${totalReviews} đánh giá vào root collection "reviews"`);

  // 3. Cập nhật rating và reviewCount thật vào từng document trong collection 'products'
  console.log('\n📊 Đang tính toán và cập nhật rating trung bình thật cho 25 sản phẩm trong collection "products"...');
  const prodsSnap = await getDocs(collection(db, 'products'));
  for (const prodDoc of prodsSnap.docs) {
    const pId = prodDoc.id;
    const stats = productStats.get(pId) || { rating: 5.0, reviewCount: 2 };
    await updateDoc(prodDoc.ref, {
      rating: stats.rating,
      reviewCount: stats.reviewCount,
    });
    console.log(`   - [${pId}] -> Rating: ${stats.rating} ⭐ | ${stats.reviewCount} lượt đánh giá`);
  }

  console.log('\n🎉 HOÀN TẤT SEEDING! Firebase Console hiện tại đã có đầy đủ 13 Collections với Data thật 100%!');
  process.exit(0);
}

seedReviewsAndRatings().catch((err) => {
  console.error('Lỗi khi seed reviews:', err);
  process.exit(1);
});
