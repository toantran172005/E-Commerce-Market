import { Faq, FaqGroup, SupportTicket } from '../types';
import { respond } from './http';
import { MOCK_FAQ_GROUPS } from '../mock/faqs';
import { MOCK_FAQS } from '../mock/faqs';
import { MOCK_SUPPORT_TICKETS } from '../mock/supportTickets';

let ticketsDb: SupportTicket[] = [...MOCK_SUPPORT_TICKETS];

export interface CreateTicketInput {
  userId: string;
  subject: string;
  message: string;
}

/**
 * Giả lập Support API.
 *
 * GET  /faq-groups
 * GET  /faqs
 * GET  /tickets?userId=
 * POST /tickets
 */
export const SupportService = {
  /** GET /faq-groups */
  async getFaqGroups(): Promise<FaqGroup[]> {
    return respond(MOCK_FAQ_GROUPS);
  },

  /** GET /faqs */
  async getFaqs(): Promise<Faq[]> {
    return respond(MOCK_FAQS);
  },

  /** GET /tickets?userId= */
  async listTickets(userId: string): Promise<SupportTicket[]> {
    await respond(null);
    return ticketsDb.filter((t) => t.userId === userId);
  },

  /** POST /tickets */
  async createTicket(input: CreateTicketInput): Promise<SupportTicket> {
    await respond(null);
    const ticket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      userId: input.userId,
      subject: input.subject,
      message: input.message,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    ticketsDb = [ticket, ...ticketsDb];
    return ticket;
  },
};
