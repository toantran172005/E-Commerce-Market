import { SupportTicket } from '../types';

export const MOCK_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'ticket-01',
    userId: 'user-demo',
    subject: 'Đơn ORD-22157 giao trễ hơn dự kiến',
    message: 'Đơn của tôi đặt 18/10 nhưng tới giờ vẫn chưa nhận được, nhờ shop kiểm tra giúp.',
    status: 'open',
    createdAt: '2026-11-03T08:00:00Z',
  },
  {
    id: 'ticket-02',
    userId: 'user-demo',
    subject: 'Hỏi về bảo hành Vision Watch S5',
    message: 'Mặt kính bị xước nhẹ có được bảo hành không, hay chỉ bảo hành lỗi pin?',
    status: 'answered',
    createdAt: '2026-10-30T10:00:00Z',
    lastReply: 'Xước ngoại quan không thuộc bảo hành bạn nhé, còn pin tụt nhanh thì được kiểm tra miễn phí.',
  },
  {
    id: 'ticket-03',
    userId: 'user-mai',
    subject: 'Đổi màu NovaPhone 11 Ultra',
    message: 'Tôi muốn đổi từ màu đen sang màu xám bạc, đơn hàng chưa giao.',
    status: 'closed',
    createdAt: '2026-10-20T14:30:00Z',
    lastReply: 'Đã đổi màu thành công và giao hàng trong 2 ngày tiếp theo. Cảm ơn quý khách.',
  },
  {
    id: 'ticket-04',
    userId: 'user-minh',
    subject: 'Khiếu nại phí COD',
    message: 'Shipper yêu cầu thu phí cao hơn trên web, nhờ kiểm tra lại giúp tôi.',
    status: 'open',
    createdAt: '2026-11-02T16:45:00Z',
  },
];
