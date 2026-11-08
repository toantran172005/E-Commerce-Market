import os
import sys
import json
import base64
import re
import urllib.request
import urllib.error

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

SYSTEM_PROMPT = """Bạn là lập trình viên React Native & Expo Router chuyên nghiệp bậc Senior.
Nhiệm vụ: Viết code màn hình React Native hoàn chỉnh 100% bằng TypeScript (TSX).
Quy tắc:
1. Trả về DUY NHẤT một khối code ```tsx ... ```, không giải thích gì bên ngoài.
2. Code hoàn chỉnh, đầy đủ StyleSheet, không rút gọn, sẵn sàng chạy.
3. Import icons từ `@expo/vector-icons` (Ionicons).
4. Sử dụng SafeAreaView từ `react-native-safe-area-context`.
5. Import theme colors từ `../src/constants/theme` (primary #FF5722, dark #1A1A1A, background #F8F9FB, border #ECEEF1, white #FFFFFF).
6. Sử dụng useRouter từ `expo-router` để điều hướng.
7. Xử lý đầy đủ state tương tác: nút bấm phản hồi (Alert, Modal hoặc thay đổi state), không để nút rỗng onPress={() => {}}.
"""

NEW_SCREENS = [
    {
        "output": r"app\update-user.tsx",
        "image": r"Plans\Final Screens\update user .png",
        "name": "Màn hình Cập nhật thông tin (Update User)",
        "prompt": """Viết mã nguồn hoàn chỉnh file `app/update-user.tsx` (UpdateUserScreen) khớp 100% với ảnh đính kèm `update user .png`:
- Header: nút back trái (`router.back()`), tiêu đề 'Edit Profile' hoặc 'Update User'.
- Avatar: Hình đại diện tròn có nút biểu tượng máy ảnh/bút chì màu cam để đổi avatar.
- Form nhập liệu:
  + Full Name (Trần Minh Alex)
  + Email (alex.carter@novatech.io)
  + Phone Number (+84 901 284 920)
  + Address
- Các trường có icon tương ứng (person, mail, call, location).
- State quản lý việc sửa đổi, thông báo khi lưu thành công (`Alert.alert('Success', 'Profile updated!')` và `router.back()`).
- Nút bấm 'Save Changes' lớn màu cam (#FF5722) bo góc 16."""
    },
    {
        "output": r"app\app-settings.tsx",
        "image": r"Plans\Final Screens\app settings.png",
        "name": "Màn hình Cài đặt ứng dụng (App Settings)",
        "prompt": """Viết mã nguồn hoàn chỉnh file `app/app-settings.tsx` (AppSettingsScreen) khớp 100% với ảnh đính kèm `app settings.png`:
- Header: nút back trái (`router.back()`), tiêu đề 'App Settings'.
- Các mục cài đặt:
  + Push Notifications (Switch bật/tắt)
  + Email Notifications (Switch bật/tắt)
  + Dark Mode (Switch bật/tắt)
  + Language (Tiếng Việt / English - chọn mở Modal hoặc ActionSheet)
  + Currency ($ USD / VND)
  + Security: Change Password (nhấn hiện popup đổi pass), Biometric Login (FaceID / Fingerprint Switch)
  + Clear Cache (nút bấm hiện thông báo 'Cache cleared: 42MB')
- Nút 'Save Preferences' màu cam bo góc 16."""
    }
]

def main():
    api_key = load_api_key()
    for screen in NEW_SCREENS:
        print(f"[*] Đang nhờ DeepSeek tạo: {screen['name']}...")
        img_b64 = encode_image(screen['image'])
        raw = call_deepseek(api_key, SYSTEM_PROMPT, screen['prompt'], img_b64)
        code = extract_code(raw)
        dest = os.path.join(APP_DIR, screen['output'])
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, 'w', encoding='utf-8') as f:
            f.write(code)
        lines = len(code.splitlines())
        print(f"    ===> THÀNH CÔNG: Đã lưu {screen['output']} ({lines} dòng)")

if __name__ == '__main__':
    main()
