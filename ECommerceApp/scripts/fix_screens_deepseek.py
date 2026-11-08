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
2. Code hoàn chỉnh, đầy đủ StyleSheet, không rút gọn, sẵn sàng chạy ngay.
3. Ngôn ngữ giao diện: TIẾNG VIỆT chuẩn đẹp.
4. Import icons từ `@expo/vector-icons` (Ionicons).
5. Sử dụng SafeAreaView từ `react-native-safe-area-context`.
6. Import theme colors từ `../src/constants/theme` (primary #FF5722, dark #1A1A1A, background #F8F9FB, border #ECEEF1, white #FFFFFF).
7. Sử dụng useRouter từ `expo-router` để điều hướng.
"""

TASKS = [
    {
        "output": r"app\shipping-address.tsx",
        "name": "Địa chỉ nhận hàng (Full Screen lướt từ phải qua trái)",
        "prompt": """Viết mã nguồn file `app/shipping-address.tsx` (ShippingAddressScreen) dưới dạng MỘT TRANG TOÀN MÀN HÌNH (Full screen page, KHÔNG PHẢI modal/bottom sheet):
- Header: Nút back mũi tên trái (`router.back()`), Tiêu đề "Địa chỉ nhận hàng" (Shipping Address).
- Nền trang màu xám nhạt `#F8F9FB`, ScrollView danh sách các địa chỉ đã lưu:
  + Thẻ 1: Nhà riêng (icon nhà màu cam), Tag "MẶC ĐỊNH" cam, Họ tên: Trần Minh Alex, Số điện thoại: +84 901 284 920, Địa chỉ: "248 Đường Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh". Radio button chọn địa chỉ này, Nút Chỉnh sửa (icon bút chì) và Nút Xóa.
  + Thẻ 2: Văn phòng (icon tòa nhà xám), Họ tên: Trần Minh Alex, Số điện thoại: +84 901 284 920, Địa chỉ: "Tòa nhà Bitexco, Tầng 12, Số 2 Hải Triều, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh". Radio button, Nút "Đặt làm mặc định", Nút Chỉnh sửa và Xóa.
- State cho phép chọn địa chỉ bằng radio button.
- Nút "Thêm địa chỉ mới" (Add New Address) viền nét đứt hoặc nút cam có icon cộng.
- Nút "Xác nhận địa chỉ" màu cam (#FF5722) lớn ở dưới cùng -> khi bấm thông báo thành công và `router.back()`."""
    },
    {
        "output": r"app\help.tsx",
        "name": "Trung tâm hỗ trợ (Full Screen lướt từ phải qua trái)",
        "prompt": """Viết mã nguồn file `app/help.tsx` (HelpCenterScreen) dưới dạng MỘT TRANG TOÀN MÀN HÌNH (Full screen page, KHÔNG PHẢI modal/bottom sheet):
- Header: Nút back mũi tên trái (`router.back()`), Tiêu đề "Trung tâm hỗ trợ" (Help Center).
- Thanh tìm kiếm câu hỏi trợ giúp: placeholder "Tìm kiếm câu hỏi thường gặp..." có icon kính lúp.
- Các kênh hỗ trợ nhanh (Quick Contact Cards):
  + Hỗ trợ trực tuyến (Customer Service): icon chat cam, hoạt động 24/7.
  + Hotline tổng đài: 1900 6868 (icon điện thoại).
  + Email: support@ecommercemarket.vn (icon mail).
- Danh sách câu hỏi thường gặp (Accordion FAQ - bấm vào mở rộng nội dung):
  1. Thời gian giao hàng mất bao lâu? (Giao tiêu chuẩn 2-4 ngày, hỏa tốc 1-2 ngày...)
  2. Chính sách đổi trả hàng như thế nào? (Hỗ trợ đổi trả miễn phí trong vòng 30 ngày...)
  3. Làm thế nào để theo dõi đơn hàng của tôi? (Vào mục Đơn hàng của tôi trong Tài khoản...)
  4. Những phương thức thanh toán nào được chấp nhận? (Hỗ trợ thẻ Visa/Mastercard, ví MoMo, COD...)
- Nút "Liên hệ đội ngũ hỗ trợ" màu cam lớn ở dưới."""
    },
    {
        "output": r"app\checkout.tsx",
        "name": "Thanh toán (Checkout Flow)",
        "prompt": """Viết mã nguồn file `app/checkout.tsx` (CheckoutScreen) hoàn chỉnh 100% chuẩn quy trình thanh toán:
- Header: Nút back mũi tên trái (`router.back()`), Tiêu đề "Thanh toán", Phụ đề "Thanh toán & Giao hàng".
- Khối 1: Địa chỉ giao hàng:
  + Icon vị trí màu cam.
  + Trần Minh Alex · Tag "NHÀ RIÊNG".
  + 248 Đường Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh · +84 901 284 920.
  + Nút "Thay đổi" chữ cam có icon bút chì -> `router.push('/shipping-address')`.
- Khối 2: Phương thức giao hàng (Shipping Method):
  + Tùy chọn 1: "Tiêu chuẩn (2-4 ngày)" · MIỄN PHÍ.
  + Tùy chọn 2: "Hỏa tốc (1-2 ngày)" · $12.00.
  + State cho phép bấm chọn giữa 2 phương thức và tự động cộng tiền ship vào tổng tiền.
- Khối 3: Phương thức thanh toán (Payment Method):
  + Tùy chọn 1: "Thẻ Tín dụng / Ghi nợ (Visa, Mastercard)".
  + Tùy chọn 2: "Ví điện tử MoMo".
  + Tùy chọn 3: "Thanh toán khi nhận hàng (COD)".
  + State chọn phương thức thanh toán.
- Khối 4: Tóm tắt thanh toán:
  + Tạm tính: $249.00
  + Phí vận chuyển: Miễn phí (hoặc $12.00 nếu chọn Hỏa tốc)
  + Thuế (8%): $19.92
  + Tổng cộng: tính toán tự động
- Thanh thanh toán ở dưới cùng:
  + Nút cam (#FF5722) lớn "Xác nhận & Thanh toán · $[Tổng tiền] >".
  + QUAN TRỌNG: Khi bấm nút này PHẢI GỌI `router.push('/checkout-success')` để chuyển ngay sang màn hình Đặt hàng thành công!"""
    }
]

def main():
    api_key = load_api_key()
    for task in TASKS:
        print(f"[*] Đang nhờ DeepSeek tạo: {task['name']}...")
        raw = call_deepseek(api_key, SYSTEM_PROMPT, task['prompt'])
        code = extract_code(raw)
        dest = os.path.join(APP_DIR, task['output'])
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, 'w', encoding='utf-8') as f:
            f.write(code)
        lines = len(code.splitlines())
        print(f"    ===> THÀNH CÔNG: Đã lưu {task['output']} ({lines} dòng)")

if __name__ == '__main__':
    main()
