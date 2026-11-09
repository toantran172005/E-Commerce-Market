import { Review } from '../types';
import { MOCK_PRODUCTS } from './products';

const NAMES = [
  'Ngọc Anh', 'Minh Tuấn', 'Thu Hà', 'Quang Huy', 'Lan Phương',
  'Đức Thịnh', 'Hồng Nhung', 'Gia Bảo', 'Mỹ Linh', 'Thanh Trúc',
];

const COMMENTS_5 = [
  'Sản phẩm dùng cực kỳ tốt, đóng gói chắc chắn, giao hàng nhanh hơn dự kiến.',
  'Chất lượng vượt mong đợi, mình rất hài lòng với lần mua này.',
  'Dùng được một tuần rồi, mọi thứ đều hoạt động trơn tru, đáng tiền.',
  'Thiết kế đẹp thật sự, cầm trên tay sang hẳn, sẽ ủng hộ tiếp.',
  'Đã mua lần thứ hai cho người nhà, chất lượng rất ổn định.',
  'Giá hợp lý so với chất lượng, bảo hành 12 tháng nên cũng yên tâm.',
];

const COMMENTS_4 = [
  'Sản phẩm tốt trong tầm giá, giao hàng mất hơi lâu một chút.',
  'Khá ưng ý, pin dùng lâu, chỉ cần lưu ý sạc lần đầu khoảng 15 phút.',
  'Chất lượng ổn, hộp hơi móp nhẹ nhưng sản phẩm bên trong không sao.',
  'Dùng hằng ngày rất ổn, nếu có thêm màu sáng nữa thì sẽ hoàn hảo hơn.',
];

const COMMENTS_3 = [
  'Sản phẩm tạm được, mình kỳ vọng cao hơn về chất lượng hoàn thiện.',
  'Dùng vẫn ổn nhưng còn vài điểm chưa vừa ý, ship mất 5 ngày mới tới.',
];

/** 84 review, mỗi review gắn đúng productId userId cố định. */
export const MOCK_REVIEWS: Review[] = Array.from({ length: 84 }, (_, index) => {
  const product = MOCK_PRODUCTS[index % MOCK_PRODUCTS.length];
  const rating = index % 5 === 0 ? 3 : index % 7 === 0 ? 5 : 4;

  let content: string;
  if (rating <= 3) {
    content = COMMENTS_3[index % COMMENTS_3.length];
  } else if (rating === 4) {
    content = COMMENTS_4[index % COMMENTS_4.length];
  } else {
    content = COMMENTS_5[index % COMMENTS_5.length];
  }

  return {
    id: `review-${index + 1}`,
    productId: product.id,
    userId: `user-${(index % 3) + 1}`,
    userName: NAMES[index % NAMES.length],
    rating,
    content,
    createdAt: `2026-11-${String((index % 28) + 1).padStart(2, '0')}T12:00:00Z`,
  };
});
