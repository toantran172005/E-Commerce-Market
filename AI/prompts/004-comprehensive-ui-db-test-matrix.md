# ROLE & CONTEXT
Bạn là một Principal QA & Test Automation Lead kiêm Solutions Architect cho ứng dụng di động React Native (Expo SDK 52) thương mại điện tử kết nối Cloud Firestore và Firebase Authentication thật (`EXPO_PUBLIC_DATA_SOURCE=firebase`).

Dự án hiện có:
- **Nền tảng**: React Native (Expo SDK 52), Expo Router, TypeScript, Cloud Firestore, Firebase Auth, Hermes Engine.
- **Tiền tệ chuẩn**: VNĐ (₫) phân cách hàng nghìn bằng dấu chấm (`21.990.000 ₫`).
- **Thanh toán**: COD ("Thanh toán khi nhận hàng") là mặc định vĩnh viễn, không thể xóa; thêm thẻ ngân hàng chỉ lưu last4 và cardholder name (`holderName`), bảo mật tuyệt đối không lưu CVV.
- **Giao diện**:
  - Giá đúng/bán hiển thị ở TRÊN, giá gốc gạch ngang hiển thị ở DƯỚI dạng cột dọc `flexDirection: 'column'`.
  - Màn hình Thông báo phân biệt rõ nét: chưa đọc nền trắng có chấm đỏ, đã đọc nền xám `#F3F4F6` không có chấm đỏ; có fallback an toàn chống crash `meta.bg`.
  - Sổ địa chỉ tự động tạo địa chỉ mặc định đầu tiên khi người dùng đăng ký hoặc truy cập, đảm bảo không bao giờ bị trống; duy trì quy tắc chỉ có duy nhất 1 địa chỉ mặc định.
  - Chi tiết sản phẩm hiển thị chuẩn Shopee gồm bảng thông số kỹ thuật (`ProductSpecsTable`), mô tả chi tiết (`ProductDescriptionView`), đánh giá sản phẩm (`ProductReviewsList`).
  - Đặt hàng sử dụng Atomic Firestore Transaction (`runTransaction`) trừ tồn kho `stock` thời gian thực, chống đặt hàng vượt tồn kho hoặc khi hết hàng.

# REQUIREMENTS
Hãy soạn thảo tài liệu **KẾ HOẠCH & BẢNG TEST CASE KIỂM THỬ TOÀN DIỆN (UI & DATABASE CHECKLIST)** bằng tiếng Việt thật chi tiết, chuyên nghiệp, cấu trúc rõ ràng dạng bảng Markdown để lập trình viên và người kiểm thử có thể thực hiện từng bước kiểm chứng 100% ứng dụng cả trên giao diện người dùng (UI) lẫn dữ liệu lưu trong Cloud Firestore (DB).

Tài liệu cần bao gồm:
1. **TỔNG QUAN HẠ TẦNG KẾT NỐI DATABASE THỰC TẾ**:
   - Xác nhận trạng thái kết nối Cloud Firestore và Firebase Auth (`projectId: e-commerce-market-e2875`).
   - Danh sách các collections chính: `users`, `products`, `categories`, `brands`, `shippingMethods`, `vouchers`, `orders`, `faqGroups`, `faqs`, `tickets`, `popularSearches`, cùng các subcollections `users/{uid}/addresses`, `users/{uid}/notifications`, `users/{uid}/settings`.
   - Câu lệnh Node.js một dòng (one-liner) để người dùng có thể gõ vào terminal và tự kiểm tra số lượng bản ghi thực tế trong DB bất cứ lúc nào.

2. **MA TRẬN TEST CASE ĐẦY ĐỦ CHO TẤT CẢ USE CASES (TỪ UC001 ĐẾN UC021)**:
   Mỗi Test Case phải trình bày dưới dạng bảng gồm các cột:
   - **Mã TC**: (ví dụ: `TC_AUTH_01`, `TC_CHECKOUT_03`, ...)
   - **Tên kịch bản & Mục tiêu**: Mô tả tính năng kiểm thử.
   - **Các bước thực hiện trên UI (Step-by-Step UI)**: Từng thao tác bấm nút, nhập form trên điện thoại.
   - **Kết quả mong đợi trên UI (Expected UI)**: Giao diện phản hồi gì (Toast, modal, badge, màu sắc, điều hướng).
   - **Đối chiếu kiểm tra Database Firestore (Expected DB)**: Collection nào, document nào, field nào thay đổi (ví dụ: `users/{uid}/addresses` thêm doc mới `isDefault: true`, `products/{id}.stock` giảm 1, `orders/{id}` tạo mới status `pending`).
   - **Lệnh CLI / Truy vấn kiểm chứng DB**: Câu lệnh nhanh để soi đúng document đó trong Firestore.

3. **DANH MỤC CÁC PHÂN HỆ KIỂM THỬ BẮT BUỘC**:
   - Phân hệ 1: Xác thực & Tài khoản (Đăng ký tài khoản mới -> tự sinh địa chỉ mặc định, Đăng nhập email/pass, Đăng xuất, Quên mật khẩu, Đăng nhập khách Guest, Phiên đăng nhập bền vững).
   - Phân hệ 2: Danh mục, Tìm kiếm & Bộ lọc (Xem 5 danh mục, Tìm kiếm tiếng Việt có dấu, Lịch sử tìm kiếm deduplicate max 10, Lọc giá VNĐ ₫ min-max, Lọc đánh giá >= 4 sao, 5 chế độ sắp xếp).
   - Phân hệ 3: Chi tiết Sản phẩm (Carousel ảnh, Giá đúng trên - giá gốc dưới, Bảng thông số Shopee, Đánh giá 1-5 sao, Chọn màu/phiên bản, Nút Thêm vào giỏ và Mua ngay).
   - Phân hệ 4: Giỏ hàng & Khuyến mãi (Tăng/giảm số lượng stepper không tràn màn hình iPhone, Xoá item giỏ hàng, Nhập mã giảm giá % có trần và voucher cố định/freeship, Tạm tính, Thuế VAT 8%, Phí ship, Tổng thanh toán VNĐ ₫).
   - Phân hệ 5: Đặt hàng & Thanh toán Checkout (Địa chỉ nhận hàng mặc định sẵn có, Thêm địa chỉ mới có cấu trúc 4 cấp, Đổi địa chỉ mặc định duy nhất, COD làm mặc định bất biến, Thêm thẻ ngân hàng lưu `holderName` và last4 không lưu CVV, Firestore Transaction trừ tồn kho và tạo đơn hàng).
   - Phân hệ 6: Quản lý Đơn hàng & Huỷ đơn (Tab Tất cả / Đang xử lý / Đã giao / Đã huỷ, Chi tiết đơn hàng timeline 4 bước, Huỷ đơn hàng chờ xử lý kèm lý do -> hoàn trả tồn kho sản phẩm, Chặn huỷ đơn đã giao).
   - Phân hệ 7: Thông báo & Đồng bộ trạng thái đọc (Nhận thông báo đơn hàng/khuyến mãi, Nhấn xem chi tiết modal không bị crash, Thẻ chưa đọc nền trắng chấm đỏ -> Thẻ đã đọc nền xám `#F3F4F6` mất chấm đỏ, Nút "Đánh dấu đã đọc" đồng bộ ngay lập tức, Khám phá sản phẩm khi rỗng).
   - Phân hệ 8: Cài đặt ứng dụng & Hỗ trợ (Accordion FAQs, Gửi ticket hỗ trợ lên Firestore `tickets`, Chuyển đổi ngôn ngữ/tiền tệ/thông báo đẩy trong settings).

4. **KỊCH BẢN KIỂM THỬ BIÊN (EDGE CASES) & BẢO MẬT (SECURITY)**:
   - Đặt hàng khi hết hàng (out of stock) hoặc số lượng vượt tồn kho.
   - Thử huỷ đơn hàng khi không nhập lý do huỷ.
   - Thử nhập mã voucher hết hạn hoặc không đủ giá trị đơn hàng tối thiểu.
   - Kiểm tra an toàn: Tuyệt đối không lưu CVV thẻ trong bất kỳ document Firestore nào.

# OUTPUT FORMAT
- Xuất bản toàn bộ dưới định dạng Markdown chuẩn, chuyên nghiệp, cấu trúc chặt chẽ, có bảng biểu rõ ràng.
