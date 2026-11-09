/* Các hàm định dạng + validate dùng chung (thuần TypeScript). */

/** Định dạng tiền tệ, mặc định hiển thị VND chuẩn Việt Nam (ví dụ 21.990.000 ₫). */
export function formatMoney(value: number, currency: 'VND' | 'USD' = 'VND'): string {
  const num = Number(value) || 0;
  if (currency === 'VND') {
    return `${Math.round(num).toLocaleString('vi-VN')} ₫`;
  }
  return `$${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value: string | number): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

export function formatDateTime(value: string | number): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const hour = d.getHours().toString().padStart(2, '0');
  const minute = d.getMinutes().toString().padStart(2, '0');
  return `${formatDate(value)} • ${hour}:${minute}`;
}

/** Chuẩn hoá số điện thoại Việt Nam về dạng +84xxx. */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return phone;
  if (digits.startsWith('84')) {
    return `+84 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  if (digits.startsWith('0')) {
    return `+84 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Mật khẩu demo: ít nhất 6 ký tự. */
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

/** Số điện thoại VN: bắt đầu 0[35789] hoặc +84, đủ 9-10 chữ số. */
export function isValidPhoneVn(phone: string): boolean {
  if (!phone || /[^0-9+\s\-.]/.test(phone)) return false;
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('84')) {
    return /^84[35789][0-9]{8}$/.test(digits);
  }
  if (digits.startsWith('0')) {
    return /^0[35789][0-9]{8}$/.test(digits);
  }
  return false;
}

/** Phần trăm giảm giá, trả về số nguyên đã làm tròn. */
export function calcDiscountPercent(price: number, originalPrice?: number): number | null {
  if (!originalPrice || originalPrice <= price) return null;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

/** Cắt chuỗi dài, dùng cho tên hiển thị. */
export function truncate(text: string, max = 30): string {
  return text.length <= max ? text : `${text.slice(0, max - 3)}...`;
}
