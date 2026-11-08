import { Address, AppSettings, PaymentMethod } from '../types';
import { apiError, respond } from './http';
import { MOCK_ADDRESSES } from '../mock/addresses';
import { MOCK_PAYMENT_METHODS } from '../mock/paymentMethods';
import { MOCK_APP_SETTINGS } from '../mock/appSettings';

let addressesDb: Address[] = [...MOCK_ADDRESSES];
let paymentsDb: PaymentMethod[] = [...MOCK_PAYMENT_METHODS];
let settingsDb: AppSettings = { ...MOCK_APP_SETTINGS };

/**
 * Giả lập Profile API (địa chỉ + thẻ thanh toán + cài đặt).
 *
 * GET    /addresses
 * POST   /addresses
 * PATCH  /addresses/:id
 * DELETE /addresses/:id
 * PATCH  /addresses/:id/default
 *
 * GET    /payment-methods
 * POST   /payment-methods
 * DELETE /payment-methods/:id
 * PATCH  /payment-methods/:id/default
 *
 * GET    /settings
 * PATCH  /settings
 */
export const ProfileService = {
  /* ----------------------------- Địa chỉ ----------------------------- */

  /** GET /addresses */
  async listAddresses(): Promise<Address[]> {
    await respond(null);
    return [...addressesDb];
  },

  /** POST /addresses */
  async addAddress(input: Omit<Address, 'id'>): Promise<Address[]> {
    await respond(null);
    const created: Address = {
      ...input,
      id: `addr-${Date.now()}`,
      isDefault: input.isDefault || addressesDb.length === 0,
    };
    if (created.isDefault) {
      addressesDb = addressesDb.map((a) => ({ ...a, isDefault: false }));
    }
    addressesDb = [...addressesDb, created];
    return [...addressesDb];
  },

  /** PATCH /addresses/:id */
  async updateAddress(id: string, patch: Partial<Address>): Promise<Address[]> {
    await respond(null);
    const exists = addressesDb.some((a) => a.id === id);
    if (!exists) apiError('ADDRESS_NOT_FOUND', 'Không tìm thấy địa chỉ.');
    addressesDb = addressesDb.map((a) => (a.id === id ? { ...a, ...patch } : a));
    return [...addressesDb];
  },

  /** DELETE /addresses/:id */
  async deleteAddress(id: string): Promise<Address[]> {
    await respond(null);
    const removing = addressesDb.find((a) => a.id === id);
    if (!removing) apiError('ADDRESS_NOT_FOUND', 'Không tìm thấy địa chỉ.');
    addressesDb = addressesDb.filter((a) => a.id !== id);
    if (removing.isDefault && addressesDb.length > 0) {
      addressesDb = addressesDb.map((a, index) => ({ ...a, isDefault: index === 0 }));
    }
    return [...addressesDb];
  },

  /** PATCH /addresses/:id/default */
  async setDefaultAddress(id: string): Promise<Address[]> {
    await respond(null);
    const exists = addressesDb.some((a) => a.id === id);
    if (!exists) apiError('ADDRESS_NOT_FOUND', 'Không tìm thấy địa chỉ.');
    addressesDb = addressesDb.map((a) => ({ ...a, isDefault: a.id === id }));
    return [...addressesDb];
  },

  /* -------------------------- Phương thức TT ------------------------- */

  /** GET /payment-methods */
  async listPaymentMethods(): Promise<PaymentMethod[]> {
    await respond(null);
    return [...paymentsDb];
  },

  /** POST /payment-methods */
  async addPaymentMethod(input: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod[]> {
    await respond(null);
    const created: PaymentMethod = {
      ...input,
      id: `pay-${Date.now()}`,
      isDefault: input.isDefault || paymentsDb.length === 0,
    };
    if (created.isDefault) {
      paymentsDb = paymentsDb.map((p) => ({ ...p, isDefault: false }));
    }
    paymentsDb = [...paymentsDb, created];
    return [...paymentsDb];
  },

  /** DELETE /payment-methods/:id */
  async deletePaymentMethod(id: string): Promise<PaymentMethod[]> {
    await respond(null);
    const removing = paymentsDb.find((p) => p.id === id);
    if (!removing) apiError('PAYMENT_NOT_FOUND', 'Không tìm thấy phương thức thanh toán.');
    paymentsDb = paymentsDb.filter((p) => p.id !== id);
    if (removing.isDefault && paymentsDb.length > 0) {
      paymentsDb = paymentsDb.map((p, index) => ({ ...p, isDefault: index === 0 }));
    }
    return [...paymentsDb];
  },

  /** PATCH /payment-methods/:id/default */
  async setDefaultPaymentMethod(id: string): Promise<PaymentMethod[]> {
    await respond(null);
    const exists = paymentsDb.some((p) => p.id === id);
    if (!exists) apiError('PAYMENT_NOT_FOUND', 'Không tìm thấy phương thức thanh toán.');
    paymentsDb = paymentsDb.map((p) => ({ ...p, isDefault: p.id === id }));
    return [...paymentsDb];
  },

  /* ----------------------------- Cài đặt ----------------------------- */

  /** GET /settings */
  async getSettings(): Promise<AppSettings> {
    await respond(null);
    return { ...settingsDb };
  },

  /** PATCH /settings */
  async updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    await respond(null);
    settingsDb = { ...settingsDb, ...patch };
    return { ...settingsDb };
  },
};
