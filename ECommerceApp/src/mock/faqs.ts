import { Faq, FaqGroup } from '../types';

export const MOCK_FAQ_GROUPS: FaqGroup[] = [
  { id: 'grp-order', name: 'Đơn hàng & Vận chuyển' },
  { id: 'grp-payment', name: 'Thanh toán' },
  { id: 'grp-return', name: 'Đổi trả & Bảo hành' },
  { id: 'grp-account', name: 'Tài khoản' },
];

export const MOCK_FAQS: Faq[] = [
  {
    id: 'faq-01', groupId: 'grp-order',
    question: 'Thời gian giao hàng mất bao lâu?',
    answer: 'Giao tiêu chuẩn 2-4 ngày. Giao hoả tốc 1-2 ngày (TP.HCM và Hà Nội). Khu vực xa có thể thêm 1-2 ngày.',
  },
  {
    id: 'faq-02', groupId: 'grp-order',
    question: 'Làm sao để theo dõi đơn hàng?',
    answer: 'Vào Tài khoản > Đơn hàng của tôi, chọn đơn cần xem. Mã vận đơn cũng hiển thị để tra cứu trực tiếp.',
  },
  {
    id: 'faq-03', groupId: 'grp-order',
    question: 'Tôi có thể thay đổi địa chỉ sau khi đặt hàng không?',
    answer: 'Bạn có thể đổi miễn phí trước khi đơn chuyển sang "Đang giao". Sau đó cần liên hệ CSKH để được phối hợp.',
  },
  {
    id: 'faq-04', groupId: 'grp-order',
    question: 'Đơn hàng bị huỷ thì tiền hoàn khi nào?',
    answer: 'Với thẻ: hoàn trong 3-5 ngày làm việc. Với ví điện tử: 1-2 ngày. COD không phát sinh hoàn tiền.',
  },
  {
    id: 'faq-05', groupId: 'grp-payment',
    question: 'Các phương thức thanh toán được hỗ trợ?',
    answer: 'Thanh toán bằng thẻ Visa/Mastercard, ví MoMo, ví ZaloPay và COD khi nhận hàng.',
  },
  {
    id: 'faq-06', groupId: 'grp-payment',
    question: 'Mã giảm giá áp dụng như thế nào?',
    answer: 'Nhập mã tại giỏ hàng hoặc trang thanh toán. Mỗi đơn chỉ áp 1 mã, không gộp được nhiều voucher.',
  },
  {
    id: 'faq-07', groupId: 'grp-payment',
    question: 'Hoá đơn VAT có được xuất không?',
    answer: 'Có. Vui lòng cung cấp thông tin công ty khi đặt hàng, hoá đơn sẽ gửi qua email trong 5 ngày.',
  },
  {
    id: 'faq-08', groupId: 'grp-return',
    question: 'Chính sách đổi trả như thế nào?',
    answer: 'Đổi trả miễn phí 30 ngày cho sản phẩm còn nguyên tem mác, chưa qua sử dụng và đủ phụ kiện.',
  },
  {
    id: 'faq-09', groupId: 'grp-return',
    question: 'Sản phẩm lỗi, bao lâu được đổi?',
    answer: 'Với lỗi kỹ thuật, bảo hành 12 tháng. Nếu phát hiện lỗi 7 ngày đầu, hỗ trợ đổi mới 1 đổi 1.',
  },
  {
    id: 'faq-10', groupId: 'grp-return',
    question: 'Chi phí gửi trả do ai chịu?',
    answer: 'Nếu lỗi từ nhà bán hoặc giao sai, shop chịu toàn bộ phí vận chuyển trả hàng.',
  },
  {
    id: 'faq-11', groupId: 'grp-account',
    question: 'Quên mật khẩu phải làm sao?',
    answer: 'Tại màn hình đăng nhập, chọn "Quên mật khẩu" và nhập email. Link reset mật khẩu sẽ gửi trong 2 phút.',
  },
  {
    id: 'faq-12', groupId: 'grp-account',
    question: 'Cách xoá tài khoản của tôi?',
    answer: 'Vào Cài đặt ứng dụng > Riêng tư > Yêu cầu xoá tài khoản. CSKH sẽ xử lý trong 24 giờ.',
  },
];
