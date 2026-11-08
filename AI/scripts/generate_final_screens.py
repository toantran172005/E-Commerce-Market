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
7. Xử lý đầy đủ state tương tác: các nút bấm phản hồi mượt mà, sẵn sàng tích hợp API sau này.
"""

TASKS = [
    {
        "output": r"app\checkout-success.tsx",
        "image": r"Plans\Final Screens\checkout success.png",
        "name": "Màn hình Đặt hàng thành công (Checkout Success)",
        "prompt": """Viết mã nguồn hoàn chỉnh file `app/checkout-success.tsx` (CheckoutSuccessScreen) khớp 100% với ảnh đính kèm `checkout success.png`:
- Icon thành công: Vòng tròn xanh lá (#16A34A / #22C55E) có dấu tích trắng lớn ở giữa, bao quanh bởi các chấm màu sắc lễ hội (xanh, đỏ, cam, vàng).
- Tiêu đề: "Order Placed Successfully!" (to đậm, đen).
- Phụ đề: "Thank you for your purchase. A confirmation has been sent to your email."
- Card tóm tắt đơn hàng (Card nền trắng viền #ECEEF1 radius 16):
  + Hàng Order Number: 'Order Number' bên trái, mã '#ORD-21530' bên phải (in đậm).
  + Hàng Estimated Delivery: icon lịch cam, tiêu đề 'Estimated Delivery', ngày 'Oct 27, 2026'.
  + Hàng Items: icon hộp quà/thùng hàng cam, 'Items', '1 item'.
  + Hàng Total Paid: icon thẻ tín dụng cam, 'Total Paid', số tiền '$249.00' (in đậm).
- Stepper trạng thái đơn hàng 4 bước:
  1. Ordered (màu cam có dấu tích active)
  2. Packing (icon hộp xám)
  3. Shipping (icon xe tải xám)
  4. Delivery (icon ngôi nhà xám)
- Nút bấm chính: Nút màu cam (#FF5722) lớn "View Order Details >" bo góc 16 -> khi bấm chuyển đến `router.push({ pathname: '/order/[id]', params: { id: 'ORD-21530' } })`.
- Nút bấm phụ: Nút viền mỏng "Continue Shopping" có icon nhà -> khi bấm chuyển về `router.replace('/(tabs)/home')`."""
    },
    {
        "output": r"app\orders.tsx",
        "image": r"Plans\Final Screens\order detail.png",
        "name": "Màn hình Danh sách Đơn hàng của tôi (My Orders)",
        "prompt": """Viết mã nguồn hoàn chỉnh file `app/orders.tsx` (MyOrdersScreen) dựa trên danh sách đơn hàng thực tế trong `seed.mjs`:
- Header: nút back trái (`router.back()`), tiêu đề 'My Orders'.
- Thanh Tabs lọc trạng thái đơn: 'All', 'Processing' (Đang xử lý), 'Delivered' (Đã giao), 'Cancelled' (Đã hủy).
- Danh sách đơn hàng (FlatList):
  + Đơn 1: Mã #ORD-21530 · Ngày 27/10/2026 · 1 món · Tổng: $249.00 · Trạng thái: 'Đang xử lý' (Badge cam). Sản phẩm: Tai nghe chống ồn AuraBeats Pro. Nút 'Track Order' và 'Cancel Order'.
  + Đơn 2: Mã #ORD-19842 · Ngày 20/10/2026 · 2 món · Tổng: $1,048.00 · Trạng thái: 'Đã giao thành công' (Badge xanh). Sản phẩm: Điện thoại Pulse 11 Ultra + Đồng hồ Tempo Watch Active 2. Nút 'Re-order' và 'Rate'.
  + Đơn 3: Mã #ORD-16504 · Ngày 22/10/2026 · 1 món · Tổng: $154.00 · Trạng thái: 'Đã hủy' (Badge xám/đỏ).
- Nhấn vào bất kỳ đơn hàng nào -> chuyển đến chi tiết đơn: `router.push({ pathname: '/order/[id]', params: { id: order.id } })`.
- Empty state sinh động khi chọn tab không có đơn."""
    }
]

def main():
    api_key = load_api_key()
    for task in TASKS:
        print(f"[*] Đang nhờ DeepSeek tạo: {task['name']}...")
        img_b64 = encode_image(task['image']) if 'image' in task else None
        raw = call_deepseek(api_key, SYSTEM_PROMPT, task['prompt'], img_b64)
        code = extract_code(raw)
        dest = os.path.join(APP_DIR, task['output'])
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, 'w', encoding='utf-8') as f:
            f.write(code)
        lines = len(code.splitlines())
        print(f"    ===> THÀNH CÔNG: Đã lưu {task['output']} ({lines} dòng)")

if __name__ == '__main__':
    main()
