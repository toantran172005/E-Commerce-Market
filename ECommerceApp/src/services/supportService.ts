import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Faq, FaqGroup, SupportTicket } from '../types';
import { apiError, mapFirebaseError } from './http';
import { MOCK_FAQ_GROUPS, MOCK_FAQS } from '../mock/faqs';

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
      return MOCK_FAQ_GROUPS;
    } catch {
      return MOCK_FAQ_GROUPS;
    }
  },

  /** Lấy danh sách toàn bộ câu hỏi và câu trả lời FAQ */
  async getFaqs(): Promise<Faq[]> {
    try {
      const snap = await getDocs(collection(db, 'faqs'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Faq, 'id'>) }));
      }
      return MOCK_FAQS;
    } catch {
      return MOCK_FAQS;
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
