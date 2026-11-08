import os
import sys
import json
import base64
import re
import urllib.request

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKSPACE_DIR = os.path.dirname(APP_DIR)
ENV_FILE = os.path.join(APP_DIR, '.env')

def load_api_key():
    with open(ENV_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('DEEPSEEK_API_KEY='):
                return line.split('=', 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("No API key")

def encode_image(rel_path):
    full_path = os.path.join(WORKSPACE_DIR, rel_path)
    if not os.path.exists(full_path):
        return None
    with open(full_path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

def extract_code(text):
    text = text.strip()
    match = re.search(r'```(?:tsx|typescript|jsx|javascript)?\s*\n([\s\S]*?)(?:```|$)', text)
    code = match.group(1).strip() if match else text
    if code.endswith('```'):
        code = code[:-3].strip()
    return code

def call_deepseek(api_key, system_prompt, user_text, image_b64=None):
    url = 'https://api.deepseek.com/chat/completions'
    content = [{'type': 'text', 'text': user_text}]
    if image_b64:
        content.append({
            'type': 'image_url',
            'image_url': {'url': f'data:image/png;base64,{image_b64}'}
        })
    payload = {
        'model': 'deepseek-flash',
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': content}
        ],
        'max_tokens': 16384,
        'temperature': 0.2
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        return res['choices'][0]['message'].get('content', '')

SYSTEM_PROMPT = """Bạn là lập trình viên React Native & Expo Router chuyên nghiệp.
Nhiệm vụ: Viết code màn hình React Native hoàn chỉnh 100% bằng TypeScript (TSX).
Quy tắc:
1. Trả về DUY NHẤT một khối code ```tsx ... ```, không giải thích gì bên ngoài.
2. Code hoàn chỉnh, đầy đủ StyleSheet, không rút gọn, sẵn sàng chạy.
3. Toàn bộ ngôn ngữ giao diện là TIẾNG VIỆT chuẩn (Thanh toán, Địa chỉ giao hàng, Phương thức vận chuyển, v.v.).
4. Import icons từ `@expo/vector-icons` (Ionicons).
5. Sử dụng SafeAreaView từ `react-native-safe-area-context`.
6. Import theme colors từ `../src/constants/theme` (primary #FF5722, dark #1A1A1A, background #F8F9FB, border #ECEEF1, white #FFFFFF).
7. Sử dụng useRouter từ `expo-router` để điều hướng.
"""

def main():
    api_key = load_api_key()
    img_b64 = encode_image(r"Plans\Final Screens\checkout part 1.png")
    
    prompt = """Viết lại toàn bộ mã nguồn file `app/checkout.tsx` (CheckoutScreen) khớp 100% với ảnh đính kèm `checkout part 1.png` và luồng thanh toán:
1. Header:
   - Nút back trái: `router.back()`.
   - Tiêu đề: "Thanh toán" (Checkout).
   - Phụ đề: "Thanh toán & Giao hàng".
2. Địa chỉ nhận hàng (Shipping Address Card):
   - Icon vị trí màu cam.
   - Tên khách hàng: "Trần Minh Alex", tag "NHÀ RIÊNG" (HOME).
   - Địa chỉ: "248 Đường Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh".
   - Số điện thoại: "+84 901 284 920".
   - Nút "Thay đổi" (Change) chữ cam có icon bút chì -> khi bấm chuyển sang `router.push('/shipping-address')`.
3. Phương thức vận chuyển (Phương thức giao hàng - Shipping Method):
   - Tiêu đề: "Phương thức giao hàng".
   - Tuỳ chọn 1: "Tiêu chuẩn" (Standard) · 2-4 ngày làm việc · MIỄN PHÍ (FREE) · Radio button cam có dấu tích.
   - Tuỳ chọn 2: "Hỏa tốc" (Express) · 1-2 ngày làm việc · $12.00 · Radio button tròn.
   - Cho phép bấm chuyển đổi giữa 2 phương thức và tự động cộng phí ship vào tổng tiền.
4. Phương thức thanh toán (Payment Method):
   - Tiêu đề: "Phương thức thanh toán".
   - Tuỳ chọn 1: "Thẻ Tín dụng / Ghi nợ" (Visa, Mastercard) · Logo VISA · Radio button cam có dấu tích.
   - Tuỳ chọn 2: "Ví điện tử MoMo" · Logo MOMO.
   - Tuỳ chọn 3: "Thanh toán khi nhận hàng (COD)".
   - Cho phép bấm chọn phương thức.
5. Tóm tắt đơn hàng (Tóm tắt thanh toán):
   - Tạm tính (1 sản phẩm): $249.00.
   - Phí vận chuyển: Miễn phí (hoặc $12.00 nếu chọn Hỏa tốc).
   - Thuế (8%): $19.92.
   - Tổng thanh toán: $268.92 (hoặc cập nhật theo phí ship).
6. Nút hành động cuối trang:
   - Nút lớn màu cam (#FF5722) bo góc 16: "Xác nhận & Thanh toán · $268.92 >".
   - Khi bấm -> chuyển ngay sang `router.push('/checkout-success')`."""

    print("[*] Đang nhờ DeepSeek tạo Checkout hoàn chỉnh theo ảnh và tiếng Việt...")
    raw = call_deepseek(api_key, SYSTEM_PROMPT, prompt, img_b64)
    code = extract_code(raw)
    dest = os.path.join(APP_DIR, r"app\checkout.tsx")
    with open(dest, 'w', encoding='utf-8') as f:
        f.write(code)
    lines = len(code.splitlines())
    print(f"    ===> THÀNH CÔNG: Đã lưu app/checkout.tsx ({lines} dòng)")

if __name__ == '__main__':
    main()
