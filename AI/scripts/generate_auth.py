import os
import sys
import json
import re
import urllib.request
import urllib.error

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_FILE = os.path.join(APP_DIR, '.env')

def load_api_key():
    with open(ENV_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('DEEPSEEK_API_KEY='):
                return line.split('=', 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("No API key")

def extract_code(text):
    text = text.strip()
    match = re.search(r'```(?:tsx|typescript|jsx|javascript)?\s*\n([\s\S]*?)(?:```|$)', text)
    code = match.group(1).strip() if match else text
    if code.endswith('```'):
        code = code[:-3].strip()
    return code

def call_deepseek(api_key, system_prompt, user_prompt):
    url = 'https://api.deepseek.com/chat/completions'
    payload = {
        'model': 'deepseek-flash',
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_prompt}
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

SYSTEM_PROMPT = """Bạn là lập trình viên React Native & Expo Router chuyên nghiệp bậc Senior.
Nhiệm vụ: Viết code màn hình React Native hoàn chỉnh 100% bằng TypeScript (TSX).
Quy tắc:
1. Trả về DUY NHẤT một khối code ```tsx ... ```, không giải thích gì bên ngoài.
2. Code hoàn chỉnh, đầy đủ StyleSheet, không rút gọn, sẵn sàng chạy.
3. Import icons từ `@expo/vector-icons` (Ionicons).
4. Sử dụng SafeAreaView từ `react-native-safe-area-context`.
5. Import theme colors từ `../../src/constants/theme` (primary #FF5722, dark #1A1A1A, background #F8F9FB, border #ECEEF1, white #FFFFFF).
6. Sử dụng useRouter từ `expo-router` để điều hướng.
7. Thiết kế giao diện hiện đại, sạch sẽ theo tông màu cam thương hiệu của toàn app.
"""

AUTH_TASKS = [
    {
        "output": r"app\(auth)\login.tsx",
        "name": "Màn hình Đăng nhập (Login)",
        "prompt": """Viết mã nguồn hoàn chỉnh file `app/(auth)/login.tsx` (LoginScreen):
Dựa vào ngữ cảnh dự án E-Commerce Market (tài khoản demo trong seed.mjs:
  - Email demo: alex.carter@novatech.io hoặc toan.tran172005@gmail.com
  - Tên hiển thị: Trần Minh Alex).

Yêu cầu giao diện:
1. Header / Branding:
   - Icon ứng dụng hoặc logo túi mua sắm màu cam (#FF5722) trong khung tròn bo góc đẹp mắt.
   - Tiêu đề chào mừng to đậm: "Chào mừng trở lại!" (Welcome Back).
   - Phụ đề xám nhạt: "Đăng nhập để tiếp tục trải nghiệm mua sắm công nghệ".
2. Form đăng nhập:
   - Ô nhập Email: có icon `mail-outline` bên trái, placeholder "Email của bạn", gợi ý demo "alex.carter@novatech.io".
   - Ô nhập Mật khẩu: có icon `lock-closed-outline` bên trái, icon con mắt ẩn/hiện mật khẩu bên phải (`eye-outline` / `eye-off-outline`).
   - Hàng "Ghi nhớ đăng nhập" (checkbox) và nút "Quên mật khẩu?" màu cam.
3. Nút hành động:
   - Nút "Đăng nhập" lớn màu cam (#FF5722) bo góc 16, chữ trắng đậm. Khi bấm -> `router.replace('/(tabs)/home')`.
   - Nút đăng nhập nhanh bằng tài khoản Demo: Bấm điền sẵn email/password và vào thẳng Home.
   - Dòng "Hoặc đăng nhập bằng": Nút Google và Apple (icon xám/đen bo góc).
4. Footer:
   - "Chưa có tài khoản? " + chữ cam đậm "Đăng ký ngay" -> `router.push('/(auth)/register')`.
   - Nút "Tiếp tục với tư cách Khách" (Bỏ qua đăng nhập) -> `router.replace('/(tabs)/home')`.
5. State & Validation:
   - Quản lý state email, password, showPassword, rememberMe, loading.
   - Đầy đủ StyleSheet đẹp mắt."""
    },
    {
        "output": r"app\(auth)\register.tsx",
        "name": "Màn hình Đăng ký (Register)",
        "prompt": """Viết mã nguồn hoàn chỉnh file `app/(auth)/register.tsx` (RegisterScreen):
Yêu cầu giao diện:
1. Header:
   - Nút back góc trên trái -> `router.back()`.
   - Tiêu đề lớn: "Tạo tài khoản mới" (Create Account).
   - Phụ đề: "Điền thông tin để bắt đầu mua sắm tại E-Commerce Market".
2. Form đăng ký:
   - Ô Họ và tên: icon `person-outline`, placeholder "Họ và tên của bạn" (vd: Trần Minh Alex).
   - Ô Email: icon `mail-outline`, placeholder "Địa chỉ email".
   - Ô Số điện thoại: icon `call-outline`, placeholder "Số điện thoại" (vd: +84 901 284 920).
   - Ô Mật khẩu: icon `lock-closed-outline`, nút mắt ẩn/hiện.
   - Ô Xác nhận mật khẩu: icon `lock-closed-outline`, nút mắt ẩn/hiện.
   - Checkbox "Tôi đồng ý với Điều khoản dịch vụ & Chính sách bảo mật".
3. Nút hành động:
   - Nút "Đăng ký tài khoản" màu cam (#FF5722) bo góc 16. Khi bấm -> thông báo thành công và `router.replace('/(tabs)/home')`.
4. Footer:
   - "Đã có tài khoản? " + chữ cam đậm "Đăng nhập" -> `router.push('/(auth)/login')`.
5. State & Validation:
   - Quản lý state fullName, email, phone, password, confirmPassword, agreeTerms, showPassword.
   - Đầy đủ StyleSheet đẹp mắt, chuẩn theme."""
    }
]

def main():
    api_key = load_api_key()
    for task in AUTH_TASKS:
        print(f"[*] Đang nhờ DeepSeek viết: {task['name']}...")
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
