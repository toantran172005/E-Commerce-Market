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
STATE_FILE = os.path.join(APP_DIR, 'scripts', 'generation_state.json')
ENV_FILE = os.path.join(APP_DIR, '.env')

def load_api_key():
    if not os.path.exists(ENV_FILE):
        raise RuntimeError(f"File .env not found at {ENV_FILE}")
    with open(ENV_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line.startswith('DEEPSEEK_API_KEY='):
                key = line.split('=', 1)[1].strip().strip('"').strip("'")
                if key and key != 'your_deepseek_api_key_here':
                    return key
    raise RuntimeError("Valid DEEPSEEK_API_KEY not found in .env")

def load_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return {"completed": {}, "failed": {}, "total_tokens": {"prompt": 0, "completion": 0, "total": 0}}

def save_state(state):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    with open(STATE_FILE, 'w', encoding='utf-8') as f:
        json.dump(state, f, indent=2, ensure_ascii=False)

def encode_image(rel_path):
    full_path = os.path.join(WORKSPACE_DIR, rel_path)
    if not os.path.exists(full_path):
        return None
    with open(full_path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

def extract_code(text):
    text = text.strip()
    match = re.search(r'```(?:tsx|typescript|jsx|javascript)?\s*\n([\s\S]*?)(?:```|$)', text)
    if match:
        code = match.group(1).strip()
    else:
        code = text
    # Clean any trailing triple backticks
    if code.endswith('```'):
        code = code[:-3].strip()
    return code

def call_deepseek(api_key, model, system_prompt, user_text, image_b64=None):
    url = 'https://api.deepseek.com/chat/completions'
    
    content = [{'type': 'text', 'text': user_text}]
    if image_b64:
        content.append({
            'type': 'image_url',
            'image_url': {'url': f'data:image/png;base64,{image_b64}'}
        })
    
    payload = {
        'model': model,
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': content}
        ],
        'max_tokens': 16384,
        'temperature': 0.2
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    )
    
    try:
        with urllib.request.urlopen(req) as resp:
            res_json = json.loads(resp.read().decode('utf-8'))
            message = res_json['choices'][0]['message']
            content_text = message.get('content', '')
            finish_reason = res_json['choices'][0].get('finish_reason')
            usage = res_json.get('usage', {})
            return content_text, finish_reason, usage
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        if e.code == 402 or 'insufficient_balance' in err_body or 'balance' in err_body:
            print(f"\n[DỪNG LẠI] Hết tiền hoặc hết token trên tài khoản DeepSeek (HTTP {e.code}): {err_body}")
            raise BalanceExhaustedError(err_body)
        raise RuntimeError(f"DeepSeek API error {e.code}: {err_body}")

class BalanceExhaustedError(Exception):
    pass

SYSTEM_PROMPT = """Bạn là lập trình viên React Native & Expo Router chuyên nghiệp bậc Senior.
Nhiệm vụ của bạn: Viết toàn bộ code UI màn hình bằng TypeScript (TSX) khớp 100% với ảnh đính kèm và bản đặc tả.
Quy tắc BẮT BUỘC:
1. Suy nghĩ ngắn gọn (dưới 2000 tokens reasoning), sau đó xuất DUY NHẤT một khối code ```tsx ... ``` hoàn chỉnh 100%, không rút gọn.
2. Code hoàn chỉnh, đầy đủ StyleSheet từ đầu đến cuối, không dùng `// TODO`.
3. Import icons từ `@expo/vector-icons` (Ionicons).
4. Sử dụng SafeAreaView từ `react-native-safe-area-context`.
5. Import theme colors từ đường dẫn tương đối tới `src/constants/theme` (primary #FF5722, dark #1A1A1A, background #F8F9FB, border #ECEEF1).
6. Tương thích với Expo Router v58 (useRouter, useLocalSearchParams).
7. Mock data đầy đủ, hiển thị sinh động giống hệt thiết kế.
"""

TASKS = [
    {
        "key": "home",
        "name": "Màn hình Home",
        "image": r"Plans\Final Screens\home with grid-list style.png",
        "output": r"app\(tabs)\home.tsx",
        "spec": """HomeScreen (Trang chủ):
- Header: Lời chào 'Good morning', 'Hey, Alex', chuông thông báo (badge đỏ), nút giỏ hàng cam (#FF5722).
- Search input bo tròn radius 16, placeholder 'Search headphones, phones...' + nút filter đen (icon sliders).
- Banner Flash Sale màu cam bo góc 24: badge 'FLASH SALE', chữ trắng 'Up to 40% off Audio gear', nút 'Shop Now >'.
- Categories: tiêu đề 'Categories' + '6 products', 4 icon card (Audio, Phones, Laptops, Accessories).
- All Products: Toggle Grid (2 cột) / List (1 cột). Thanh chip filter (All, Audio, Phones, Laptops, Accessories).
- Danh sách sản phẩm: Card sản phẩm có badge giảm giá (-17%), nút yêu thích tim, tên sản phẩm, giá tiền ($249, giá gốc $299), rating sao.
- Bấm vào sản phẩm chuyển sang `/product/[id]`. Bấm giỏ hàng chuyển sang `/cart`. Bấm filter chuyển sang `/filter`."""
    },
    {
        "key": "product_detail",
        "name": "Chi tiết sản phẩm",
        "image": r"Plans\Final Screens\product detail.png",
        "output": r"app\product\[id].tsx",
        "spec": """ProductDetailScreen (Chi tiết sản phẩm):
- Header: nút back trái, nút chia sẻ + nút tim phải.
- Carousel ảnh sản phẩm lớn bo góc, có pagination dots (chấm cam active, chấm xám).
- Thông tin: thương hiệu 'AURASOUND' (cam), tên sản phẩm 'AuraBeats Pro Wireless' (to đậm).
- Đánh giá: 5 sao vàng, điểm 4.8 '(1284 reviews)'.
- Giá: $249 (to đậm), giá gốc $299 gạch ngang, badge '-17%', trạng thái '✓ In stock (24)'.
- Mô tả: 'Active noise cancelling over-ear headphones with 40h battery life.'
- Lựa chọn màu (Color): 'Carbon Black', có 3 nút tròn màu (đen viền cam active, xám, nâu).
- Lựa chọn Variant: nút 'Standard' (active nền đen chữ trắng) và 'Premium Case' (nền trắng viền xám).
- Bottom Action Bar: Nút 'Add to Cart' (viền cam chữ cam) và 'Buy Now' (nền cam chữ trắng to rộng)."""
    },
    {
        "key": "cart",
        "name": "Giỏ hàng",
        "image": r"Plans\Final Screens\cart.png",
        "output": r"app\cart.tsx",
        "spec": """CartScreen (Giỏ hàng):
- Header: nút back, tiêu đề 'My Cart', '1 item'.
- Danh sách item trong giỏ: Checkbox chọn item, ảnh sản phẩm, tên 'AuraBeats Pro Wireless', màu 'Carbon Black - Standard', giá '$249' (gốc $299). Bộ điều khiển số lượng (- 1 +) và nút thùng rác xoá item.
- Ô nhập mã giảm giá Promo Code: icon tag 'ENTER PROMO CODE' + nút 'Apply' đen bo góc. Dòng gợi ý: 'Try NOVA10, FLASH20, or WELCOME15'.
- Bảng tổng kết tiền: Subtotal, Shipping ($5.00), Total.
- Bottom Button: Nút 'Checkout • $5.00 >' màu cam bo góc lớn."""
    },
    {
        "key": "checkout",
        "name": "Thanh toán & Đặt hàng",
        "image": r"Plans\Final Screens\checkout part 1.png",
        "output": r"app\checkout.tsx",
        "spec": """CheckoutScreen (Thanh toán):
- Header: nút back, tiêu đề 'Checkout'.
- Thanh chỉ số các bước (Step 1: Shipping Address, Step 2: Payment Method, Step 3: Confirmation).
- Phần Địa chỉ giao hàng: Card chọn địa chỉ (Home / Office), hiển thị tên, số điện thoại, địa chỉ cụ thể, nút 'Change' hoặc 'Add Address'.
- Phần Phương thức thanh toán: Thẻ tín dụng (Credit Card), COD, Ví điện tử (Momo / Apple Pay).
- Tóm tắt đơn hàng (Items summary) + Bảng tính tổng tiền (Subtotal, Shipping, Discount, Total).
- Nút bấm 'Pay Now' hoặc 'Place Order' màu cam bo góc 16."""
    },
    {
        "key": "favourite",
        "name": "Danh sách yêu thích",
        "image": r"Plans\Final Screens\favourite.png",
        "output": r"app\(tabs)\favourite.tsx",
        "spec": """FavouriteScreen (Yêu thích):
- Header: tiêu đề 'Favourite', đếm số lượng item ('3 items').
- Danh sách sản phẩm yêu thích (dạng List hoặc Grid): ảnh sản phẩm, tên, giá tiền, badge sale, nút tim đỏ để bỏ thích, nút 'Add to Cart' nhanh cho từng item.
- Empty state khi danh sách trống: icon tim, chữ 'No favourites yet', nút 'Explore Products' dẫn về Home."""
    },
    {
        "key": "account",
        "name": "Tài khoản cá nhân",
        "image": r"Plans\Final Screens\account part 1.png",
        "output": r"app\(tabs)\account.tsx",
        "spec": """AccountScreen (Hồ sơ người dùng):
- Profile Header: Avatar tròn, tên 'Alex Morgan', email 'alex.morgan@example.com', nút chỉnh sửa profile.
- Menu Section 1 (Orders): 'My Orders', 'Processing', 'Delivered', 'Cancelled' với badge số lượng.
- Menu Section 2 (Settings & Preferences): 'Shipping Addresses', 'Payment Methods', 'Notifications', 'App Settings'.
- Menu Section 3 (Support): 'Help Center', 'Terms & Conditions', 'Privacy Policy'.
- Nút 'Log Out' màu đỏ/xám bo góc."""
    },
    {
        "key": "notification",
        "name": "Thông báo",
        "image": r"Plans\Final Screens\notification.png",
        "output": r"app\notification.tsx",
        "spec": """NotificationScreen (Thông báo):
- Header: nút back, tiêu đề 'Notifications', nút 'Mark all as read'.
- Tabs lọc: 'All', 'Orders', 'Promotions'.
- Danh sách thông báo: icon phân loại (giao hàng thành công, giảm giá Flash Sale, cập nhật tài khoản), tiêu đề, nội dung ngắn gọn, thời gian ('2 hours ago', 'Yesterday'), chấm xanh/cam đánh dấu chưa đọc."""
    },
    {
        "key": "filter",
        "name": "Bộ lọc sản phẩm",
        "image": r"Plans\Final Screens\filter.png",
        "output": r"app\filter.tsx",
        "spec": """FilterScreen (Bộ lọc):
- Header: nút back/close, tiêu đề 'Filter', nút 'Reset' bên phải.
- Mục Category: các chip chọn danh mục (Audio, Phones, Laptops, Accessories).
- Mục Price Range: Slider hoặc 2 ô input nhập Min Price ($) và Max Price ($).
- Mục Brand: Checkbox hoặc chip chọn thương hiệu (AuraSound, Pulse, Apple, Samsung, Sony).
- Mục Rating: chọn 4 sao trở lên, 3 sao trở lên...
- Bottom Bar: Nút 'Apply Filters' màu cam lớn hiển thị số sản phẩm tìm được."""
    },
    {
        "key": "shipping_address",
        "name": "Địa chỉ giao hàng",
        "image": r"Plans\Final Screens\shipping address.png",
        "output": r"app\shipping-address.tsx",
        "spec": """ShippingAddressScreen (Quản lý địa chỉ):
- Header: nút back, tiêu đề 'Shipping Address'.
- Danh sách địa chỉ đã lưu: Card địa chỉ có icon Home/Office, tag 'Default', họ tên, số điện thoại, địa chỉ chi tiết, nút radio button chọn địa chỉ nhận hàng, nút Edit.
- Nút thêm mới 'Add New Address' viền cam hoặc nút cam ở dưới cùng."""
    },
    {
        "key": "payment_method",
        "name": "Phương thức thanh toán",
        "image": r"Plans\Final Screens\payment method.png",
        "output": r"app\payment-method.tsx",
        "spec": """PaymentMethodScreen (Phương thức thanh toán):
- Header: nút back, tiêu đề 'Payment Method'.
- Danh sách thẻ / ví: Thẻ tín dụng minh hoạ (Mastercard / Visa card mockup với số thẻ ẩn **** 4242, hạn dùng, tên chủ thẻ).
- Danh sách tuỳ chọn: Credit/Debit Card, Apple Pay / Google Pay, Cash on Delivery (COD).
- Nút radio chọn phương thức mặc định.
- Nút 'Add New Card' và nút 'Confirm Payment Method' cam."""
    },
    {
        "key": "order_detail",
        "name": "Chi tiết đơn hàng",
        "image": r"Plans\Final Screens\order detail.png",
        "output": r"app\order\[id].tsx",
        "spec": """OrderDetailScreen (Chi tiết đơn hàng):
- Header: nút back, tiêu đề 'Order #ORD-98421'.
- Timeline trạng thái đơn hàng (Order Placed -> Processing -> Shipped -> Delivered) với icon và ngày giờ.
- Danh sách sản phẩm trong đơn: ảnh, tên, số lượng, giá tiền.
- Địa chỉ nhận hàng & Phương thức thanh toán đã chọn.
- Tóm tắt chi phí (Subtotal, Delivery Fee, Total).
- Nút hành động: 'Track Order' hoặc 'Cancel Order' (nếu còn trong thời gian cho phép)."""
    },
    {
        "key": "help_center",
        "name": "Trung tâm hỗ trợ",
        "image": r"Plans\Final Screens\help center.png",
        "output": r"app\help.tsx",
        "spec": """HelpCenterScreen (Hỗ trợ khách hàng):
- Header: nút back, tiêu đề 'Help Center'.
- Thanh tìm kiếm câu hỏi thường gặp 'Search FAQs...'.
- Các nút hỗ trợ nhanh: 'Customer Service' (Chat trực tiếp), 'WhatsApp', 'Email Support', 'Call Us'.
- Accordion FAQ các câu hỏi phổ biến: 'Làm thế nào để theo dõi đơn hàng?', 'Chính sách hoàn tiền 30 ngày', 'Phương thức thanh toán hỗ trợ' (bấm để mở rộng nội dung)."""
    }
]

def main():
    api_key = load_api_key()
    model = "deepseek-flash"
    
    # Reset state to force full clean generation with 16k tokens
    state = {"completed": {}, "failed": {}, "total_tokens": {"prompt": 0, "completion": 0, "total": 0}}
    
    total = len(TASKS)
    print("==================================================")
    print(" BẮT ĐẦU VẼ TOÀN BỘ GIAO DIỆN (FULL 16K TOKENS)  ")
    print(f" Tổng số màn hình: {total}")
    print("==================================================\n")
    
    for idx, task in enumerate(TASKS, 1):
        key = task["key"]
        name = task["name"]
        output_rel = task["output"]
        img_rel = task["image"]
        spec = task["spec"]
        
        if key in state["completed"]:
            print(f"[{idx}/{total}] [ĐÃ CÓ TRONG CACHE] {name} ({key}) -> Bỏ qua.")
            continue
            
        print(f"[{idx}/{total}] Đang xử lý: {name} ({key})...")
        print(f"       -> Đọc ảnh: {img_rel}")
        img_b64 = encode_image(img_rel)
        
        user_prompt = f"""Hãy viết toàn bộ mã nguồn file `{output_rel}` cho dự án Expo React Native.
Dưới đây là hình ảnh thiết kế giao diện thực tế và các yêu cầu kỹ thuật chi tiết:

{spec}

Yêu cầu xuất ra:
- Khớp từng chi tiết với ảnh được đính kèm.
- Sử dụng TypeScript hoàn chỉnh, không rút gọn."""

        try:
            raw_code, finish_reason, usage = call_deepseek(api_key, model, SYSTEM_PROMPT, user_prompt, img_b64)
            code = extract_code(raw_code)
            
            dest_path = os.path.join(APP_DIR, output_rel)
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            with open(dest_path, 'w', encoding='utf-8') as f:
                f.write(code)
            
            tokens_used = usage.get('total_tokens', 0)
            lines_count = len(code.splitlines())
            state["completed"][key] = {
                "name": name,
                "output": output_rel,
                "tokens": tokens_used,
                "finish_reason": finish_reason,
                "lines": lines_count
            }
            state["total_tokens"]["prompt"] += usage.get('prompt_tokens', 0)
            state["total_tokens"]["completion"] += usage.get('completion_tokens', 0)
            state["total_tokens"]["total"] += tokens_used
            save_state(state)
            
            print(f"  ===> THÀNH CÔNG: Đã lưu vào {output_rel} ({lines_count} dòng, Finish: {finish_reason}, Tokens: {tokens_used})\n")
            
        except BalanceExhaustedError:
            save_state(state)
            print("\n[THÔNG BÁO] Đã lưu cache trạng thái. Khi bạn nạp thêm tiền, chỉ cần chạy lại là tiếp tục ngay tại màn này.")
            sys.exit(402)
        except Exception as e:
            print(f"  [LỖI] Màn {key} gặp lỗi: {e}\n")
            state["failed"][key] = str(e)
            save_state(state)

    print("\n==================================================")
    print(" HOÀN TẤT TẤT CẢ CÁC MÀN HÌNH THEO FINAL SCREENS! ")
    print(f" Tổng token đã dùng: {state['total_tokens']['total']}")
    print("==================================================")

if __name__ == '__main__':
    main()
