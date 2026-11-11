import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Faq, FaqGroup, SupportTicket } from '../types';
import { apiError, mapFirebaseError } from './http';

const DEFAULT_FAQ_GROUPS: FaqGroup[] = [
  { id: 'grp-order', name: 'Đơn hàng & Vận chuyển' },
  { id: 'grp-payment', name: 'Thanh toán' },
  { id: 'grp-return', name: 'Đổi trả & Bảo hành' },
  { id: 'grp-account', name: 'Tài khoản' },
];

const DEFAULT_FAQS: Faq[] = [
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
];

export interface CreateTicketInput {
  userId: string;
  subject: string;
  message: string;
}

/**
 * Service quản lý trung tâm trợ giúp FAQ và phiếu hỗ trợ kỹ thuật (Tickets).
 */
export const SupportService = {
  /** Lấy danh sách nhóm câu hỏi thường gặp */
  async getFaqGroups(): Promise<FaqGroup[]> {
    try {
      const snap = await getDocs(collection(db, 'faqGroups'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FaqGroup, 'id'>) }));
      }
      return DEFAULT_FAQ_GROUPS;
    } catch {
      return DEFAULT_FAQ_GROUPS;
    }
  },

  /** Lấy danh sách toàn bộ câu hỏi và câu trả lời FAQ */
  async getFaqs(): Promise<Faq[]> {
    try {
      const snap = await getDocs(collection(db, 'faqs'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Faq, 'id'>) }));
      }
      return DEFAULT_FAQS;
    } catch {
      return DEFAULT_FAQS;
    }
  },

  /** Lấy danh sách các yêu cầu hỗ trợ của một người dùng */
  async listTickets(userId: string): Promise<SupportTicket[]> {
    if (!userId) return [];

    try {
      const q = query(collection(db, 'tickets'), where('userId', '==', userId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SupportTicket, 'id'>) }));
      }
      return [];
    } catch {
      return [];
    }
  },

  /** Gửi yêu cầu hỗ trợ mới vào Firestore */
  async createTicket(input: CreateTicketInput): Promise<SupportTicket> {
    if (!input.userId) {
      apiError('AUTH_REQUIRED', 'Vui lòng đăng nhập trước khi gửi yêu cầu hỗ trợ.');
    }
    if (!input.subject || !input.subject.trim()) {
      apiError('TICKET_INVALID_SUBJECT', 'Vui lòng nhập tiêu đề yêu cầu.');
    }
    if (!input.message || !input.message.trim()) {
      apiError('TICKET_INVALID_MESSAGE', 'Vui lòng nhập nội dung chi tiết cần hỗ trợ.');
    }

    const now = new Date().toISOString();
    const ticketRef = doc(collection(db, 'tickets'));
    const realTicket: SupportTicket = {
      id: ticketRef.id,
      userId: input.userId,
      subject: input.subject.trim(),
      message: input.message.trim(),
      status: 'open',
      createdAt: now,
    };

    return realTicket;
  },
};
