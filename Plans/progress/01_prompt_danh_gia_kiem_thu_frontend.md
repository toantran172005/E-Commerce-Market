# PROMPT 01 – Đánh giá & kiểm thử Frontend ECommerceApp (DeepSeek `deepseek-v4-pro`)

> Prompt này được `ECommerceApp/scripts/deepseek_pro/run.mjs` đọc trực tiếp (stage `review`).
> Phần dưới dòng `---PROMPT-START---` là nội dung gửi cho model. Toàn bộ source (`app/**`, `src/**`, `package.json`, `app.json`, `tsconfig.json`) được đính kèm tự động bên dưới prompt.
> Phạm vi: **chỉ app người dùng**. Không có Admin.

---PROMPT-START---
Bạn là một **Staff Mobile Engineer + QA Lead** chuyên React Native / Expo Router / TypeScript, đang review một **bản demo** ứng dụng E-Commerce Marketplace (tiếng Việt, tiền tệ hiển thị `$`). Không giới hạn token: hãy phân tích **cực kỳ chi tiết, thận trọng, không bỏ sót file nào**.

## 0. Bối cảnh đã biết (đã quét sơ bộ, hãy xác minh lại bằng code)
- Stack: Expo ~58, expo-router ~58, React 19, RN 0.88, TypeScript. Không có thư viện UI ngoài, không NativeWind/reanimated.
- Thư mục `src/components`, `src/context`, `src/hooks`, `src/services` đang **RỖNG**. Chỉ có `src/types/index.ts`, `src/constants/theme.ts`.
- Mỗi màn hình tự khai báo mock data riêng (inline) ⇒ **không có state dùng chung**: giỏ hàng, yêu thích, đơn hàng, địa chỉ, thanh toán, thông báo, hồ sơ, cài đặt đều độc lập giữa các màn hình.
- Nghi vấn cần xác minh: `order/[id]` có thể không đọc `id`; `checkout-success` dùng `ORDER_ID` cứng; `filter` có thể không áp dụng kết quả cho `home`; `cart`/`checkout`/`product` không liên thông dữ liệu; `login`/`register` điều hướng không kiểm tra thật; mỗi màn dùng palette/hằng màu riêng thay vì theme chung; `cart.tsx` định nghĩa lại type `CartItem` khác `src/types`.
- Mục tiêu sau review: đưa app lên mức **"app hoàn chỉnh chạy bằng mock data"** để sau này thay bằng backend thật chỉ cần đổi tầng `services`.

## 1. Việc cần làm
Đọc **toàn bộ** source đính kèm rồi trả về báo cáo markdown theo đúng cấu trúc ở mục 3.

### 1.1 Đánh giá tĩnh (code review), mỗi file trong `app/**` và `src/**`
Kiểm tra từng hạng mục, ghi rõ `file:dòng` (hoặc tên hàm/component):
1. **Đúng/sai chức năng**: mọi nút, link, tab, chip, toggle có làm đúng việc? Có `onPress` rỗng/placeholder? Có route không tồn tại / sai tên route / sai params?
2. **Luồng dữ liệu & state**: dữ liệu có nhất quán giữa các màn không (thêm giỏ ở Product ⇒ Cart/Home badge; Favourite ⇒ Home/Product; Checkout ⇒ Orders ⇒ Order detail ⇒ Notification)? Chỉ ra mọi chỗ bị "đứt".
3. **Điều hướng**: stack/tabs, `router.push` vs `replace`, back behavior, deep link `product/[id]`, `order/[id]`, xử lý `id` không tồn tại, modal `filter` trả kết quả về đâu, bảo vệ route khi chưa đăng nhập, logout xóa state.
4. **Form & validation**: login, register, update-user, shipping-address, payment-method, help/contact, promo code, search. Kiểm tra regex email, mật khẩu, số điện thoại VN, trường bắt buộc, trim, thông báo lỗi tiếng Việt, trạng thái loading/disabled, chống submit đúp, `KeyboardAvoidingView`, `keyboardShouldPersistTaps`.
5. **Tính toán tiền**: subtotal, giảm giá, phí ship, tổng, làm tròn, định dạng tiền nhất quán, mã khuyến mãi, số lượng min/max theo `stock`, item chưa chọn.
6. **Trạng thái UI**: loading, empty, error, offline, danh sách rỗng ở **mọi** màn có danh sách; skeleton; pull-to-refresh.
7. **TypeScript**: `any`, ép kiểu, type trùng lặp/xung đột với `src/types`, thiếu type cho params route, `strict` có lỗi tiềm ẩn không, import sai đường dẫn.
8. **Hiệu năng**: `FlatList` vs `ScrollView.map`, `keyExtractor`, `useMemo/useCallback` đúng chỗ, `Image` không cache/không có `resizeMode`, re-render thừa, key trùng.
9. **UI/UX & thiết kế**: bám design tokens (primary `#FF5722`, dark `#1A1A1A`, background `#F8F9FB`, border `#ECEEF1`, radius 8/12/16/24), nhất quán spacing/typography, hardcode màu thay vì `theme.ts`, touch target ≥ 44px, safe-area (notch, tab bar), màn hình nhỏ (320dp) và tablet/web, dark mode (nếu có setting), text tràn/cắt.
10. **Accessibility**: `accessibilityLabel/Role/State`, contrast, kích thước chữ, thứ tự focus.
11. **Việt hoá & nội dung**: chuỗi lỗi encoding (mojibake), trộn Anh/Việt, chính tả, định dạng ngày giờ/tiền, đơn vị.
12. **Bảo mật/độ bền demo**: lộ khóa/secrets trong source (ví dụ `firebaseConfig.ts`), thông tin thẻ lưu thô, `console.log` dữ liệu nhạy cảm, crash khi dữ liệu null/undefined.
13. **Code smell**: trùng lặp component (header, nút, card, chip, rating, badge…) có thể gom vào `src/components`; file quá dài; dead code; import không dùng.

### 1.2 Kiểm thử (viết test plan + dự đoán kết quả bằng cách "chạy tay" trên code)
Với mỗi luồng dưới đây, tạo **test case** (ID, tiền điều kiện, bước, kết quả mong đợi, **kết quả thực tế dự đoán từ code: PASS/FAIL/PARTIAL + lý do**):
- Auth: đăng ký (hợp lệ/không hợp lệ/email trùng/mật khẩu yếu), đăng nhập (đúng/sai/để trống), quên mật khẩu (nếu có), đăng xuất.
- Home: tìm kiếm (có/không kết quả, ký tự đặc biệt, tiếng Việt có dấu), lọc theo danh mục/chip, sắp xếp, mở Filter modal → áp dụng/reset → kết quả trên Home, thêm yêu thích, vào chi tiết, badge giỏ hàng, thông báo.
- Product detail: id hợp lệ/không hợp lệ, chọn biến thể/số lượng, thêm giỏ, mua ngay, yêu thích, chia sẻ, đánh giá, sản phẩm liên quan, hết hàng.
- Favourite: thêm/xoá, rỗng, vào chi tiết, thêm vào giỏ.
- Cart: tăng/giảm/xoá, chọn/bỏ chọn/chọn tất cả, áp mã (đúng/sai/hết hạn), tính tiền, giỏ rỗng, giới hạn tồn kho, đi thanh toán khi không chọn gì.
- Checkout: chọn địa chỉ, phương thức thanh toán, ghi chú, phí ship, đặt hàng ⇒ tạo order thật trong state, xoá item đã mua khỏi giỏ, checkout-success hiển thị đúng mã đơn vừa tạo.
- Orders: các tab trạng thái, đếm, huỷ đơn (lý do, `canCancel`), mua lại, theo dõi, đánh giá, đơn rỗng; Order detail theo `id` đúng/sai, timeline `currentStep`.
- Account: hồ sơ, update-user, đổi mật khẩu/ảnh (nếu có), shipping-address (thêm/sửa/xoá/đặt mặc định), payment-method (thêm/xoá/mặc định, che số thẻ), notification (đọc/chưa đọc/đánh dấu tất cả/xoá/lọc tab), help (FAQ, liên hệ), app-settings (ngôn ngữ, tiền tệ, thông báo, xoá cache, xoá tài khoản).
- Phi chức năng: xoay màn hình, màn nhỏ, web (`expo start --web`), back Android, kill & reopen app (state có giữ không), spam nút, dữ liệu rất dài.

### 1.3 Kiểm tra "độ sẵn sàng thay backend"
Liệt kê **tất cả thực thể dữ liệu** mà app cần (User, Address, PaymentMethod, Category, Brand, Product(+variants, images, reviews), Cart, Favourite, Voucher/Promo, Order(+timeline, cancel), Notification, FAQ/Support ticket, AppSettings, SearchHistory…) và với mỗi thực thể: **schema TypeScript đề xuất**, màn hình nào dùng, thao tác CRUD cần có, endpoint REST giả định (`GET/POST/PUT/DELETE`), và state nào cần global.

## 2. Quy tắc đánh giá
- Mọi phát hiện phải **dẫn chứng bằng code** (tên file + đoạn/dòng/hàm). Không đoán mò; nếu không chắc ghi rõ "cần xác minh".
- Phân loại mức độ: **P0** (crash/không dùng được/đứt luồng chính), **P1** (sai chức năng quan trọng), **P2** (UX/UI/nhất quán), **P3** (cải thiện, dọn code).
- Với mỗi lỗi: ID (`BUG-001…`), mức độ, file, mô tả, tái hiện, nguyên nhân gốc, **hướng sửa cụ thể** (nêu rõ file nào sửa gì, hook/API nào dùng).
- Đưa **kiến trúc mục tiêu**: cấu trúc thư mục `src/` (mock, services, context, hooks, components, utils, types), danh sách Context/Provider, API của từng hook (`useCart()`, `useAuth()`…), thứ tự triển khai tối ưu và phụ thuộc giữa các màn.
- Không đề xuất thêm thư viện ngoài `package.json` hiện tại (được phép dùng `react-native` core, `expo-router`, `@expo/vector-icons`, `react-native-safe-area-context`). State lưu **trong bộ nhớ** (Context + `useState`, KHÔNG `useReducer`), không cần persistence. Ưu tiên giải pháp **đơn giản, ngắn gọn, dễ đọc** cho sinh viên; tránh abstraction thừa.
- Không đề xuất Admin.

## 3. Định dạng đầu ra (markdown, đúng thứ tự)
1. **Tóm tắt điều hành** (≤ 15 dòng): điểm số tổng /100 và theo hạng mục (chức năng, state, điều hướng, form, UI, a11y, hiệu năng, TS).
2. **Bản đồ màn hình & luồng điều hướng** (bảng + sơ đồ mermaid `flowchart`).
3. **Danh sách lỗi** (bảng tóm tắt rồi chi tiết từng BUG theo P0→P3).
4. **Test cases & kết quả dự đoán** (bảng theo module, kèm tổng PASS/FAIL/PARTIAL).
5. **Thực thể dữ liệu & schema mock** (mục 1.3).
6. **Kiến trúc mục tiêu & kế hoạch sửa** theo giai đoạn: (A) foundation (types, mock data, services, contexts, shared components), (B) từng màn hình (liệt kê file → thay đổi cụ thể), (C) polishing.
7. **Checklist nghiệm thu** để chạy lại sau khi sửa (build `tsc --noEmit`, từng luồng E2E thủ công).

Hãy bắt đầu. Báo cáo phải đầy đủ đến mức một kỹ sư khác có thể sửa toàn bộ app chỉ từ báo cáo này.
---PROMPT-END---
