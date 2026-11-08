import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Faq, FaqGroup, SupportTicket } from '../types';
import { apiError, mapFirebaseError, IS_MOCK_MODE } from './http';
import { MOCK_FAQ_GROUPS, MOCK_FAQS } from '../mock/faqs';
import { MOCK_SUPPORT_TICKETS } from '../mock/supportTickets';

let mockTicketsDb: SupportTicket[] = [...MOCK_SUPPORT_TICKETS];

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
    if (IS_MOCK_MODE) return MOCK_FAQ_GROUPS;

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
    if (IS_MOCK_MODE) return MOCK_FAQS;

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
    if (IS_MOCK_MODE) {
      return mockTicketsDb.filter((t) => t.userId === userId);
    }

    try {
      const q = query(collection(db, 'tickets'), where('userId', '==', userId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SupportTicket, 'id'>) }));
      }
      return mockTicketsDb.filter((t) => t.userId === userId);
    } catch {
      return mockTicketsDb.filter((t) => t.userId === userId);
    }
  },

  /** Gửi yêu cầu hỗ trợ mới */
  async createTicket(input: CreateTicketInput): Promise<SupportTicket> {
    if (!input.subject || !input.subject.trim()) {
      apiError('TICKET_INVALID_SUBJECT', 'Vui lòng nhập tiêu đề yêu cầu.');
    }
    if (!input.message || !input.message.trim()) {
      apiError('TICKET_INVALID_MESSAGE', 'Vui lòng nhập nội dung chi tiết cần hỗ trợ.');
    }

    const ticketId = `ticket-${Date.now()}`;
    const now = new Date().toISOString();

    const ticket: SupportTicket = {
      id: ticketId,
      userId: input.userId,
      subject: input.subject.trim(),
      message: input.message.trim(),
      status: 'open',
      createdAt: now,
    };

    if (IS_MOCK_MODE) {
      mockTicketsDb = [ticket, ...mockTicketsDb];
      return ticket;
    }

    try {
      const ticketRef = doc(collection(db, 'tickets'));
      const realTicket: SupportTicket = { ...ticket, id: ticketRef.id };
      await setDoc(ticketRef, realTicket);
      mockTicketsDb = [realTicket, ...mockTicketsDb];
      return realTicket;
    } catch (err: unknown) {
      mockTicketsDb = [ticket, ...mockTicketsDb];
      return ticket;
    }
  },
};
