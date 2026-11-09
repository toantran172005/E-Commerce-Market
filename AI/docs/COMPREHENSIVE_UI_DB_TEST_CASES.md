# KẾ HOẠCH & BẢNG TEST CASE KIỂM THỬ TOÀN DIỆN (UI & DATABASE CHECKLIST)
## Ứng dụng E-commerce Market — React Native (Expo SDK 52) · Cloud Firestore · Firebase Auth

> **Phạm vi:** Kiểm chứng 100% giao diện người dùng (UI) và dữ liệu thực lưu trong Cloud Firestore cho toàn bộ Use Case UC001 → UC021, kèm kịch bản biên & bảo mật.
> **Môi trường áp dụng:** `EXPO_PUBLIC_DATA_SOURCE=firebase`, `projectId = e-commerce-market-e2875`.
> **Đơn vị tiền tệ chuẩn:** VNĐ (₫) — định dạng `#.###.### ₫` (dấu chấm ngăn cách hàng nghìn).
> **Ngôn ngữ tài liệu:** Tiếng Việt. Mã test case dùng tiếng Anh (prefix chuẩn hoá).

---

## MỤC LỤC
1. [Tổng quan hạ tầng kết nối Database thực tế](#1-tổng-quan-hạ-tầng-kết-nối-database-thực-tế)
2. [Ma trận Test Case đầy đủ UC001 → UC021](#2-ma-trận-test-case-đầy-đủ-uc001--uc021)
3. [Danh mục phân hệ kiểm thử bắt buộc](#3-danh-mục-các-phân-hệ-kiểm-thử-bắt-buộc)
4. [Kịch bản biên (Edge Cases) & Bảo mật (Security)](#4-kịch-bản-kiểm-thử-biên-edge-cases--bảo-mật-security)
5. [Phụ lục: Checklist ký duyệt Release](#5-phụ-lục-checklist-ký-duyệt-release)

---

## 1. TỔNG QUAN HẠ TẦNG KẾT NỐI DATABASE THỰC TẾ

### 1.1. Xác nhận trạng thái kết nối

| Hạng mục | Giá trị kỳ vọng | Cách xác minh |
|---|---|---|
| `EXPO_PUBLIC_DATA_SOURCE` | `firebase` | Kiểm tra `.env` + `Constants.expoConfig?.extra?.dataSource` trên app |
| `projectId` Firestore | `e-commerce-market-e2875` | Firebase Console → Project Overview / `google-services.json` |
| `authDomain` | `e-commerce-market-e2875.firebaseapp.com` | Console → Authentication |
| Firebase Auth provider | `Email/Password` đã bật | Console → Authentication → Sign-in method |
| Firestore location | `asia-southeast1` (hoặc theo dự án) | Console → Firestore → Settings |
| Auth persistence | `getReactNativePersistence(AsyncStorage)` | Code `initializeAuth` trong `firebaseConfig.ts` |
| Firestore Rules | Import `firestore.rules` production | Console → Rules → Publish |
| Hermes Engine | Bật (`"jsEngine": "hermes"`) | `app.json` / Expo Dev Tools |

**Script xác minh kết nối Firebase-admin (Node.js):**

```bash
node -e "const{initializeApp,cert}=require('firebase-admin/app');const{getFirestore}=require('firebase-admin/firestore');const{getAuth}=require('firebase-admin/auth');initializeApp({projectId:'e-commerce-market-e2875',credential:cert(require('./serviceAccountKey.json'))});(async()=>{try{const s=await getFirestore().collection('products').limit(1).get();console.log('✅ Firestore OK:',s.size,'docs sample');const u=await getAuth().listUsers(1);console.log('✅ Auth OK:',u.users.length,'users sample')}catch(e){console.error('❌ FAILED:',e.message)}})()"
```

### 1.2. Danh sách Collections & Subcollections chính

| # | Collection / Subcollection | Kiểu | Mô tả nghiệp vụ |
|---|---|---|---|
| 1 | `users` | Root | Hồ sơ người dùng (`uid`, `email`, `displayName`, `phone`, `createdAt`) |
| 2 | `products` | Root | Danh mục sản phẩm (`name`, `price`, `originalPrice`, `stock`, `images[]`, `colors[]`, `sizes[]`, `rating`, `specTable`, `description`) |
| 3 | `categories` | Root | 5 danh mục chính |
| 4 | `brands` | Root | Thương hiệu |
| 5 | `shippingMethods` | Root | Phương thức vận chuyển (`fee`, `estimatedDays`) |
| 6 | `vouchers` | Root | Mã giảm giá (`type: percent\|fixed\|freeship`, `value`, `maxDiscount`, `minOrder`, `expiredAt`) |
| 7 | `orders` | Root | Đơn hàng (`items[]`, `subtotal`, `vat`, `shipFee`, `total`, `status`, `address`, `paymentMethod`, `timeline[]`) |
| 8 | `faqGroups` | Root | Nhóm câu hỏi thường gặp |
| 9 | `faqs` | Root | Câu hỏi lẻ (thuộc nhóm) |
| 10 | `tickets` | Root | Ticket hỗ trợ người dùng gửi |
| 11 | `popularSearches` | Root | Từ khoá tìm kiếm phổ biến (gợi ý) |
| 12 | `users/{uid}/addresses` | Sub | Sổ địa chỉ (duy nhất 1 `isDefault:true`) |
| 13 | `users/{uid}/notifications` | Sub | Thông báo (trường `isRead`, `meta`, `title`, `body`) |
| 14 | `users/{uid}/settings` | Sub | Tuỳ chọn (`language`, `currency`, `pushEnabled`) |
| 15 | `users/{uid}/paymentMethods` | Sub (khuyến nghị) | Thẻ đã lưu (`last4`, `holderName` — **KHÔNG BAO GIỜ `cvv`**) |

### 1.3. Câu lệnh Node.js **một dòng** — đếm bản ghi thực tế toàn bộ collection

```bash
node -e "const{initializeApp,cert}=require('firebase-admin/app');const{getFirestore}=require('firebase-admin/firestore');initializeApp({projectId:'e-commerce-market-e2875',credential:cert(require('./serviceAccountKey.json'))});const db=getFirestore();(async()=>{const cols=['users','products','categories','brands','shippingMethods','vouchers','orders','faqGroups','faqs','tickets','popularSearches'];for(const c of cols){try{const s=await db.collection(c).get();console.log(c.padEnd(22),'=',s.size,'docs')}catch(e){console.log(c.padEnd(22),'= ❌',e.message)}}})()"
```

**Kết quả mẫu kỳ vọng:**

```
users                  = 42 docs
products               = 128 docs
categories             = 5 docs
brands                 = 12 docs
shippingMethods        = 3 docs
vouchers               = 8 docs
orders                 = 210 docs
faqGroups              = 4 docs
faqs                   = 18 docs
tickets                = 7 docs
popularSearches        = 15 docs
```

### 1.4. Helper `fq` — truy vấn nhanh 1 document/subcollection (thêm vào `~/.bashrc`)

```bash
# Cài đặt một lần:
#   npm i -g firebase-admin
#   export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/serviceAccountKey.json"

fq() { node -e "const{initializeApp,applicationDefault}=require('firebase-admin/app');const{getFirestore}=require('firebase-admin/firestore');initializeApp({projectId:'e-commerce-market-e2875',credential:applicationDefault()});const db=getFirestore();const[col,doc,sub,sdoc]=process.argv.slice(1);(async()=>{try{if(sub&&sdoc){const d=await db.collection(col).doc(doc).collection(sub).doc(sdoc).get();console.log(JSON.stringify(d.data(),null,2))}else if(sub){const s=await db.collection(col).doc(doc).collection(sub).get();s.forEach(x=>console.log(x.id,JSON.stringify(x.data())))}else if(doc){const d=await db.collection(col).doc(doc).get();console.log(JSON.stringify(d.data(),null,2))}else{const s=await db.collection(col).get();console.log('COUNT:',s.size);s.forEach(x=>console.log(x.id))}}catch(e){console.error('ERR',e.message)}})()" -- "$@"; }
```

**Cách dùng:**

| Mục tiêu | Lệnh |
|---|---|
| Liệt kê tất cả doc của collection | `fq orders` |
| Xem 1 document cụ thể | `fq orders ORD_001` |
| Liệt kê subcollection | `fq users UID_001 addresses` |
| Xem 1 doc subcollection | `fq users UID_001 addresses ADDR_001` |

### 1.5. Kiểm tra kết nối Firebase Auth

```bash
node -e "const{initializeApp,applicationDefault}=require('firebase-admin/app');const{getAuth}=require('firebase-admin/auth');initializeApp({projectId:'e-commerce-market-e2875',credential:applicationDefault()});getAuth().listUsers(1000).then(r=>{console.log('TOTAL_USERS =',r.users.length);r.users.slice(0,5).forEach(u=>console.log(' -',u.uid,u.email,u.disabled?'(disabled)':''))})"
```

---

## 2. MA TRẬN TEST CASE ĐẦY ĐỦ UC001 → UC021

> **Quy ước cột:**
> - **Các bước UI:** `<br>` = xuống dòng trong ô.
> - **Cột DB:** Liệt kê `collection/doc.field` cần đối chiếu.
> - **Cột CLI:** dùng helper `fq` (xem 1.4) hoặc one-liner Firebase-admin.
> - Placeholder: `<UID>`, `<PRODUCT_ID>`, `<ORDER_ID>`, `<ADDR_ID>`, `<NOTIF_ID)`.

---

### UC001 — Đăng ký tài khoản mới (tự sinh địa chỉ mặc định)

| Mã TC | Tên kịch bản & Mục tiêu | Các bước thực hiện trên UI | Kết quả mong đợi trên UI | Đối chiếu Database Firestore | Lệnh CLI / Truy vấn kiểm chứng |
|---|---|---|---|---|---|
| **TC_AUTH_01** | Đăng ký thành công — Email/Pass mới → tạo `users/{uid}` + địa chỉ mặc định | 1. Mở app → **Đăng ký**.<br>2. Nhập `tenmoi_{ts}@gmail.com`, `Test@12345`, nhập lại pass.<br>3. Tick "Tôi đồng ý điều khoản".<br>4. Bấm **Đăng ký**. | • Toast `"Đăng ký thành công"`.<br>• Điều hướng về Home.<br>• Avatar hiển thị tên viết tắt.<br>• Không crash, không blank screen. | • `users/{uid}` mới tồn tại, `email`, `createdAt`, `displayName` đầy đủ.<br>• `users/{uid}/addresses` có **đúng 1 doc** `isDefault:true` (auto-generated).<br>• `users/{uid}/settings` khởi tạo `language:'vi'`, `currency:'VND'`, `pushEnabled:true`. | `fq users <UID>`<br>`fq users <UID> addresses`<br>`fq users <UID> settings` |
| **TC_AUTH_02** | Đăng ký email đã tồn tại → phải báo lỗi, KHÔNG tạo trùng | 1. Đăng ký với email đã có trong DB.<br>2. Bấm **Đăng ký**. | • Toast đỏ `"Email đã được sử dụng"`.<br>• Ở lại màn đăng ký, form giữ nguyên.<br>• Không tạo Auth user mới. | • `users` count KHÔNG tăng.<br>• Auth `listUsers` count KHÔNG tăng. | `fq users` (so count trước/sau)<br>`node -e "... getAuth().listUsers() ..."` |
| **TC_AUTH_03** | Mật khẩu yếu (< 6 ký tự) → chặn submit | 1. Nhập email mới + pass `123`.<br>2. Bấm **Đăng ký**. | • Inline error dưới field: `"Mật khẩu tối thiểu 6 ký tự"`.<br>• Nút Đăng ký disable cho tới khi hợp lệ. | • KHÔNG có write Firestore/Auth nào. | `fq users` (không thay đổi) |
| **TC_AUTH_04** | Sinh địa chỉ mặc định NGAY sau đăng ký (không cần user nhập) | 1. Đăng ký thành công.<br>2. Vào **Tài khoản → Sổ địa chỉ**. | • Có sẵn 1 địa chỉ với badge `Mặc định`.<br>• Không có trạng thái rỗng. | • `users/{uid}/addresses/{addrId}` có `isDefault:true`, `createdAt` ~ cùng `users/{uid}.createdAt` (chênh ≤ 5s).<br>• Chỉ 1 doc `isDefault:true`. | `fq users <UID> addresses`<br>`node -e "...db.collection('users').doc('<UID>').collection('addresses').where('isDefault','==',true).get().then(s=>console.log('DEFAULTS:',s.size))..."` |

---

### UC002 — Đăng nhập Email/Password

| Mã TC | Tên kịch bản & Mục tiêu | Các bước thực hiện trên UI | Kết quả mong đợi trên UI | Đối chiếu Database Firestore | Lệnh CLI / Truy vấn kiểm chứng |
|---|---|---|---|---|---|
| **TC_AUTH_05** | Đăng nhập đúng thông tin | 1. Mở **Đăng nhập**.<br>2. Nhập email/pass hợp lệ.<br>3. Bấm **Đăng nhập**. | • Toast xanh `"Đăng nhập thành công"`.<br>• Điều hướng Home, avatar hiển thị tên.<br>• Tab "Tài khoản" hiện đúng email. | • `users/{uid}.lastLoginAt` được cập nhật timestamp mới (nếu field tồn tại).<br>• Auth `lastSignInTime` mới hơn 1 phút trước. | `fq users <UID>`<br>`node -e "...getAuth().getUser('<UID>').then(u=>console.log(u.metadata.lastSignInTime))..."` |
| **TC_AUTH_06** | Sai mật khẩu → message chuẩn Firebase | 1. Nhập email đúng, pass sai.<br>2. Bấm **Đăng nhập**. | • Toast đỏ `"Sai mật khẩu hoặc tài khoản không tồn tại"`.<br>• Ở lại màn đăng nhập.<br>• Không expose chi tiết lỗi Firebase thô. | • Không write Firestore.<br>• Không tạo session trong AsyncStorage. | `fq users <UID>` (không đổi) |
| **TC_AUTH_07** | Email không tồn tại | 1. Nhập `khongton{ts}@gmail.com` + pass bất kỳ.<br>2. Bấm **Đăng nhập**. | • Cùng message an toàn như TC_AUTH_06 (không lộ email có tồn tại hay không). | • Không write DB. | `fq users` (không đổi) |

---

### UC003 — Quên mật khẩu

| Mã TC | Tên kịch bản & Mục tiêu | Các bước thực hiện trên UI | Kết quả mong đợi trên UI | Đối chiếu Database Firestore | Lệnh CLI / Truy vấn kiểm chứng |
|---|---|---|---|---|---|
| **TC_AUTH_08** | Gửi email reset thành công | 1. Màn Đăng nhập → bấm **Quên mật khẩu**.<br>2. Nhập email đã đăng ký.<br>3. Bấm **Gửi**. | • Modal/Toast `"Đã gửi email khôi phục, vui lòng kiểm tra hộp thư"`.<br>• Quay về màn Đăng nhập. | • Không write Firestore.<br>• Firebase Auth ghi nhận request reset (không queryable công khai, kiểm qua Inbox). | Không áp dụng query Firestore — kiểm qua email inbox/Console Auth |

---

### UC004 — Đăng xuất

| Mã TC | Tên kịch bản & Mục tiêu | Các bước thực hiện trên UI | Kết quả mong đợi trên UI | Đối chiếu Database Firestore | Lệnh CLI / Truy vấn kiểm chứng |
|---|---|---|---|---|---|
| **TC_AUTH_09** | Đăng xuất xoá phiên | 1. Vào **Tài khoản → Đăng xuất**.<br>2. Xác nhận. | • Toast `"Đã đăng xuất"`.<br>• Điều hướng về Guest state (avatar icon mặc định).<br>• Reload app vẫn ở Guest. | • Không xoá doc Firestore.<br>• `AsyncStorage` không còn token (`firebase:authUser:*` cleared). | `fq users <UID>` (doc còn nguyên)<br>Dev: `AsyncStorage.getAllKeys()` không chứa `firebase:authUser` |

---

### UC005 — Chế độ Khách (Guest) & Phiên bền vững

| Mã TC | Tên kịch bản & Mục tiêu | Các bước thực hiện trên UI | Kết quả mong đợi trên UI | Đối chiếu Database Firestore | Lệnh CLI / Truy vấn kiểm chứng |
|---|---|---|---|---|---|
| **TC_AUTH_10** | Duyệt sản phẩm ở Guest | 1. Fresh install, KHÔNG đăng nhập.<br>2. Duyệt Home / Danh mục / PDP.<br>3. Bấm "Thêm vào giỏ". | • Xem sản phẩm OK.<br>• Khi thêm giỏ/checkout → modal `"Vui lòng đăng nhập để tiếp tục"`. | • Không có write `users/{uid}` (uid null). | `fq users` (không đổi) |
| **TC_AUTH_11** | Phiên bền vững qua kill/restart | 1. Đăng nhập → force-kill app (Swipe up).<br>2. Mở lại app. | • Vẫn ở trạng thái đã đăng nhập, avatar hiển thị đúng.<br>• Không flash màn Login trước Home. | • AsyncStorage còn `firebase:authUser:<apiKey>`.<br>• `onAuthStateChanged` emit user ngay. | Dev: check AsyncStorage keys |

---

### UC006 — Duyệt Danh mục

| Mã TC | Tên kịch bản & Mục tiêu | Các bước thực hiện trên UI | Kết quả mong đợi trên UI | Đối chiếu Database Firestore | Lệnh CLI / Truy vấn kiểm chứng |
|---|---|---|---|---|---|
| **TC_CAT_01** | Hiển thị đúng 5 danh mục | 1. Home → tab **Danh mục**.<br>2. Quan sát grid. | • Đúng 5 ô danh mục theo thứ tự từ DB.<br>• Mỗi ô có icon + tên + số sản phẩm (nếu có). | • `categories` có 5 docs.<br>• Field `order` ascending khớp thứ tự UI. | `fq categories`<br>`node -e "...db.collection('categories').orderBy('order').get().then(s=>s.forEach(d=>console.log(d.id,d.data().name)))..."` |
| **TC_CAT_02** | Bấm danh mục → lọc đúng sản phẩm | 1. Bấm danh mục **"Điện thoại"**.<br>2. Quan sát list sản phẩm. | • Header `"Điện thoại"`.<br>• Grid sản phẩm với `categoryId` tương ứng.<br>• Số item khớp số `products` có `categoryId`. | • `products.where('categoryId','==',<CAT_ID>)` count = số UI. | `node -e "...db.collection('products').where('categoryId','==','<CAT_ID>').get().then(s=>console.log('COUNT:',s.size))..."` |

---

### UC007 — Tìm kiếm & Lịch sử tìm kiếm

| Mã TC | Tên kịch bản & Mục tiêu | Các bước thực hiện trên UI | Kết quả mong đợi trên UI | Đối chiếu Database Firestore | Lệnh CLI / Truy vấn kiểm chứng |
|---|---|---|---|---|---|
| **TC_SEARCH_01** | Tìm tiếng Việt có dấu | 1. Bấm thanh tìm kiếm.<br>2. Nhập `"điện thoại"` (có dấu).<br>3. Enter. | • Kết quả chứa sản phẩm match "điện thoại"/"dien thoai".<br>• Highlight keyword (nếu có).<br>• Sắp xếp theo relevance. | • `products` query tương ứng (nếu app dùng normalized `nameLower` thì query field đó). | `node -e "...db.collection('products').where('nameLower','>=','dien thoai').where('nameLower','<=','dien thoai\uf8ff').get().then(s=>console.log(s.size))..."` |
| **TC_SEARCH_02** | Lịch sử tìm kiếm dedupe, max 10 | 1. Search `"iphone"` → back.<br>2. Search `"iphone"` lần 2.<br>3. Search 10 từ khác nhau.<br>4. Mở lại search bar. | • `"iphone"` chỉ 1 dòng (dedupe).<br>• Tổng tối đa 10 dòng.<br>• Mới nhất ở đầu danh sách. | • Lưu tại `users/{uid}/settings` (field `searchHistory: string[]`) hoặc AsyncStorage. Nếu Firestore: array length ≤ 10, không trùng. | `fq users <UID> settings` → kiểm `searchHistory` |
| **TC_SEARCH_03** | Tìm không có kết quả | 1. Search `"zzzxyz{ts}"`. | • Empty state illustration + chữ `"Không tìm thấy sản phẩm"`.<br>• Gợi ý **popularSearches** hiển thị. | • `popularSearches` đọc và render. Không write. | `fq popularSearches` |

---

### UC008 — Bộ lọc & Sắp xếp

| Mã TC | Tên kịch bản & Mục tiêu | Các bước thực hiện trên UI | Kết quả mong đợi trên UI | Đối chiếu Database Firestore | Lệnh CLI / Truy vấn kiểm chứng |
|---|---|---|---|---|---|
| **TC_FILTER_01** | Lọc giá VNĐ min–max | 1. Trang list → **Lọc**.<br>2. Min `5.000.000`, Max `20.000.000`.<br>3. Áp dụng. | • Chỉ sản phẩm `price` trong khoảng.<br>• Chip filter hiển thị `5.000.000 ₫ – 20.000.000 ₫`.<br>• Định dạng ₫ có dấu chấm ngăn cách. | • `products.where('price','>=',5000000).where('price','<=',20000000)` count khớp UI. | `node -e "...db.collection('products').where('price','>=',5000000).where('price','<=',20000000).get().then(s=>console.log(s.size))..."` |
| **TC_FILTER_02** | Lọc đánh giá ≥ 4 sao | 1. Lọc → chọn **"Từ 4 sao"**.<br>2. Áp dụng. | • Chỉ sản phẩm `rating >= 4`.<br>• Badge sao hiển thị đúng (★ 4.x). | • `products.where('rating','>=',4)` count khớp UI. | `node -e "...db.collection('products').where('rating','>=',4).get().then(s=>console.log(s.size))..."` |
| **TC_FILTER_03** | 5 chế độ sắp xếp | 1. Mở sort sheet.<br>2. Chọn lần lượt: `Phổ biến`, `Mới nhất`, `Bán chạy`, `Giá thấp→cao`, `Giá cao→thấp`. | • Danh sách re-order đúng theo từng chế độ.<br>• Áp dụng tức thì, không cần reload full page. | • Ordering tương ứng: `sold` desc / `createdAt` desc / `soldCount` desc / `price` asc / `price` desc. | `node -e "...db.collection('products').orderBy('price','asc').limit(5).get().then(s=>s.forEach(d=>console.log(d.data().price)))..."` |

---

### UC009 — Chi tiết Sản phẩm (PDP)

| Mã TC | Tên kịch bản & Mục tiêu | Các bước thực hiện trên UI | Kết quả mong đợi trên UI | Đối chiếu Database Firestore | Lệnh CLI / Truy vấn kiểm chứng |
|---|---|---|---|---|---|
| **TC_PDP_01** | Carousel ảnh 2 chiều | 1. Mở PDP sản phẩm có ≥ 3 ảnh.<br>2. Swipe trái/phải.<br>3. Chạm thumbnail. | • Vuốt mượt, indicator chấm `1/3`.<br>• Tap thumbnail đồng bộ vị trí carousel. | • `products/{id}.images` array length = số ảnh UI. | `fq products <PRODUCT_ID>` (field `images`) |
| **TC_PDP_02** | Giá đúng TRÊN — Giá gốc gạch ngang DƯỚI (cột dọc) | 1. Mở PDP.<br>2. Quan sát block giá. | • Giá đúng (màu đỏ/cam) ở **hàng trên**.<br>• Giá gốc gạch ngang (`textDecorationLine:'line-through'`) ở **hàng dưới**.<br>• `flexDirection:'column'` (kiểm tra DevTools).<br>• Định dạng ₫ chuẩn. | • `products/{id}.price` = giá đúng.<br>• `products/{id}.originalPrice` = giá gạch. Nếu `originalPrice ≤ price` → ẩn giá gốc. | `fq products <PRODUCT_ID>` (fields `price`, `originalPrice`) |
| **TC_PDP_03** | Bảng thông số kỹ thuật kiểu Shopee | 1. Scroll xuống section **Thông số**. | • `<ProductSpecsTable>` render 2 cột `Thuộc tính / Giá trị`.<br>• Có border grid, header xám.<br>• Không overflow ngang trên iPhone SE. | • `products/{id}.specTable` là object/array key-value khớp UI. | `fq products <PRODUCT_ID>` (field `specTable`) |
| **TC_PDP_04** | Mô tả chi tiết (`ProductDescriptionView`) | 1. Scroll xuống section **Mô tả**. | • Render text + xuống dòng + paragraph.<br>• Nếu rỗng → hiển thị `"Chưa có mô tả"`. | • `products/{id}.description` string khớp text. | `fq products <PRODUCT_ID>` (field `description`) |
| **TC_PDP_05** | Danh sách đánh giá (`ProductReviewsList`) | 1. Scroll section **Đánh giá**.<br>2. Quan sát sao 1–5. | • Trung bình sao hiển thị đúng (ví dụ ★★★★☆ 4.3).<br>• List review có tên, sao, thời gian tương đối. | • `products/{id}.rating` khớp UI.<br>• Nếu reviews là subcollection `products/{id}/reviews` → count khớp. | `fq products <PRODUCT_ID>`<br>`fq products <PRODUCT_ID> reviews` |
| **TC_PDP_06** | Chọn màu / phiên bản | 1. Tap màu "Đen" và size "128GB".<br>2. Quan sát giá & tồn kho update. | • Chip được chọn có viền đậm.<br>• Giá & stock refesh theo variant (nếu có). | • `products/{id}.colors`, `sizes` array khớp UI. | `fq products <PRODUCT_ID>` (fields `colors`, `sizes`) |
| **TC_PDP_07** | Nút "Thêm vào giỏ" | 1. Chọn biến thể.<br>2. Bấm **Thêm vào giỏ**. | • Toast `"Đã thêm vào giỏ"`.<br>• Badge icon giỏ +1.<br>• Không điều hướng (ở lại PDP). | • Nếu cart lưu Firestore: `users/{uid}.cart[]` có item mới.<br>• Nếu cart local: AsyncStorage key `cart` update. | `fq users <UID>` (field `cart`) hoặc check AsyncStorage |
| **TC_PDP_08** | Nút "Mua ngay" | 1. Chọn biến thể.<br>2. Bấm **Mua ngay**. | • Điều hướng thẳng tới màn **Checkout** với item vừa chọn.<br>• Không thêm vào cart (hoặc thêm tạm tuỳ spec). | • Không write `users/{uid}/cart` nếu flow "Mua ngay" tách biệt. | `fq users <UID>` |

---

### UC010 — Giỏ hàng

| Mã TC | Tên kịch bản & Mục tiêu | Các bước thực hiện trên UI | Kết quả mong đợi trên UI | Đối chiếu Database Firestore | Lệnh CLI / Truy vấn kiểm chứng |
|---|---|---|---|---|---|
| **TC_CART_01** | Tăng số lượng stepper (không tràn màn hình iPhone) | 1. Mở **Giỏ hàng**.<br>2. Bấm nút `+` liên tục tới 99.<br>3. Quan sát layout trên iPhone SE (375x667) & Pro Max. | • Stepper `- [SL] +` không vỡ layout.<br>• Số tăng dần 1→99.<br>• Không vượt quá `stock`.<br>• Tổng tiền cập nhật real-time. | • `cart` item `.quantity` cập nhật khớp UI.<br>• Nếu `quantity == stock` thì nút `+` disabled. | `fq users <UID>` (field cart) hoặc AsyncStorage |
| **TC_CART_02** | Giảm số lượng stepper | 1. Bấm `-` nhiều lần. | • Số giảm tới **1** thì nút `-` bị disable (không xuống 0).<br>• Tổng tiền giảm tương ứng. | • `.quantity` không bao giờ ≤ 0. | `fq users <UID>` |
| **TC_CART_03** | Xoá item khỏi giỏ | 1. Swipe trái item → **Xoá**.<br>2. Xác nhận (nếu có modal). | • Item biến mất với animation.<br>• Tổng tiền cập nhật.<br>• Nếu giỏ trống → empty state `"Giỏ hàng trống"`. | • `cart` array không còn item đó. | `fq users <UID>` |
| **TC_CART_04** | Tính tạm tính + VAT 8% + ship + tổng | 1. Có 2 item, 1 ship `30.000 ₫`.<br>2. Quan sát block summary. | • Tạm tính = Σ(price × qty).<br>• **VAT = 8% × tạm tính** (làm tròn VNĐ).<br>• Phí ship hiển thị.<br>• Tổng = tạm tính + VAT + ship.<br>• Tất cả định dạng `#.### ₫`. | • Nếu cart lưu Firestore: field `.subtotal`, `.vat`, `.shipFee`, `.total` lưu chính xác (nếu server-side tính). | `fq users <UID>` hoặc tính tay từ item list và so khớp |

---

### UC011 — Voucher / Khuyến mãi

| Mã TC | Tên kịch bản & Mục tiêu | Các bước thực hiện trên UI | Kết quả mong đợi trên UI | Đối chiếu Database Firestore | Lệnh CLI / Truy vấn kiểm chứng |
|---|---|---|---|---|---|
| **TC_VOUCHER_01** | Voucher % có trần | 1. Nhập mã `GIAM10` (10%, trần 50.000 ₫).<br>2. Order 1.000.000 ₫.<br>3. Áp dụng. | • Giảm tối đa **50.000 ₫** (không phải 100.000 ₫).<br>• Dòng discount hiển thị `-50.000 ₫`.<br>• Tổng cập nhật. | • `vouchers/{code}` có `type:'percent'`, `value:10`, `maxDiscount:50000`, `minOrder`. | `fq vouchers GIAM10` |
| **TC_VOUCHER_02** | Voucher cố định | 1. Nhập `GIAM50K` (fixed 50.000 ₫, min 500.000 ₫).<br>2. Order 600.000 ₫.<br>3. Áp dụng. | • Giảm đúng `50.000 ₫`. | • `vouchers/{code}.type=='fixed'`, `value:50000`. | `fq vouchers GIAM50K` |
| **TC_VOUCHER_03** | Voucher freeship | 1. Nhập `FREESHIP`. | • Phí ship = `0 ₫`.<br>• Dòng "Miễn phí vận chuyển" hiển thị. | • `vouchers/{code}.type=='freeship'`. | `fq vouchers FREESHIP` |
| **TC_VOUCHER_04** | Voucher hết hạn | 1. Nhập `EXPIRED2023`. | • Toast đỏ `"Mã giảm giá đã hết hạn"`. | • `vouchers/{code}.expiredAt < now`. | `fq vouchers EXPIRED2023` |
| **TC_VOUCHER_05** | Voucher không đủ min order | 1. Nhập `GIAM50K` khi order chỉ 100.000 ₫. | • Toast đỏ `"Đơn hàng tối thiểu 500.000 ₫ để áp dụng"`. | • `vouchers/{code}.minOrder == 500000` > order total. | `fq vouchers GIAM50K` |

---

### UC012 — Sổ địa chỉ

| Mã TC | Tên kịch bản & Mục tiêu | Các bước thực hiện trên UI | Kết quả mong đợi trên UI | Đối chiếu Database Firestore | Lệnh CLI / Truy vấn kiểm chứng |
|---|---|---|---|---|---|
| **TC_ADDR_01** | Đảm bảo luôn có ≥ 1 địa chỉ mặc định (tự chữa lành) | 1. Đăng nhập user đã xoá hết địa chỉ thủ công trên Console.<br>2. Mở **Sổ địa chỉ**. | • Hiển thị 1 địa chỉ mặc định auto (fallback).<br>• Không crash, không trống. | • `users/{uid}/addresses` count ≥ 1.<br>• Đúng 1 doc `isDefault:true`. | `fq users <UID> addresses` |
| **TC_ADDR_02** | Thêm địa chỉ mới cấu trúc 4 cấp | 1. Bấm **+ Thêm địa chỉ**.<br>2. Nhập tên, SĐT.<br>3. Chọn **Tỉnh/Thành** → **Quận/Huyện** → **Phường/Xã** (cascade).<br>4. Nhập số nhà, đường.<br>5. Lưu. | • Dropdown cascade load đúng theo cấp trên.<br>• Toast `"Thêm địa chỉ thành công"`.<br>• Danh sách có địa chỉ mới. | • `users/{uid}/addresses/{new}` có đủ field `province`, `district`, `ward`, `street`, `fullName`, `phone`, `isDefault:false`, `createdAt`. | `fq users <UID> addresses` |
| **TC_ADDR_03** | Đổi địa chỉ mặc định (duy nhất) | 1. Có 2 địa chỉ: A default, B thường.<br>2. Bấm "Đặt làm mặc định" trên B.<br>3. Query DB ngay. | • B có badge `Mặc định`.<br>• A mất badge.<br>• Không bao giờ có 2 default. | • `users/{uid}/addresses` chỉ **đúng 1** doc có `isDefault:true`.<br>• Doc A có `isDefault:false`. | `node -e "...db.collection('users').doc('<UID>').collection('addresses').where('isDefault','==',true).get().then(s=>console.log('DEFAULTS:',s.size))..."` (kỳ vọng `1`) |
| **TC_ADDR_04** | Xoá địa chỉ | 1. Xoá địa chỉ B.<br>2. Quan sát danh sách. | • B biến mất.<br>• Nếu xoá địa chỉ default → tự chọn địa chỉ khác làm default HOẶC chặn xoá → message giải thích. | • Doc B không tồn tại.<br>• Vẫn đúng 1 `isDefault:true` trong danh sách còn lại. | `fq users <UID> addresses` |

---

### UC013 — Phương thức thanh toán

| Mã TC | Tên kịch bản & Mục tiêu | Các bước thực hiện trên UI | Kết quả mong đợi trên UI | Đối chiếu Database Firestore | Lệnh CLI / Truy vấn kiểm chứng |
|---|---|---|---|---|---|
| **TC_PAY_01** | COD là mặc định VĨNH VIỄN, không thể xoá | 1. Mở **Checkout → Phương thức thanh toán**.<br>2. Quan sát danh sách.<br>3. Cố vuốt/ xoá COD. | • COD luôn ở đầu, được chọn mặc định.<br>• Không có nút xoá/disable với COD.<br>• Nếu chỉ có COD → vẫn cho đặt hàng. | • Không có doc nào xoá COD.<br>• `orders/{id}.paymentMethod` khi đặt hàng với COD → `'cod'`. | `fq vouchers` (không liên quan)<br>`fq orders <ORDER_ID>` (field `paymentMethod`) |
| **TC_PAY_02** | Thêm thẻ NH — chỉ lưu `last4` + `holderName` | 1. Bấm **+ Thêm thẻ**.<br>2. Nhập `holderName = "NGUYEN VAN A"`, số thẻ `4111111111111111`, CVV `123`, hết hạn `12/26`.<br>3. Lưu. | • Toast `"Thêm thẻ thành công"`.<br>• Hiển thị `**** **** **** 1111`.<br>• Tên chủ thẻ hiển thị. | • `users/{uid}/paymentMethods/{cardId}` chỉ chứa: `holderName`, `last4:'1111'`, `expiry:'12/26'`, `brand:'visa'`, `createdAt`.<br>• **KHÔNG có** field `cvv`, `pan`, `fullCardNumber`. | `fq users <UID> paymentMethods` |

---

### UC014 — Đặt hàng (Checkout) với Firestore Transaction

| Mã TC | Tên kịch bản & Mục tiêu | Các bước thực hiện trên UI | Kết quả mong đợi trên UI | Đối chiếu Database Firestore | Lệnh CLI / Truy vấn kiểm chứng |
|---|---|---|---|---|---|
| **TC_CHECKOUT_01** | Đặt hàng thành công (happy path) | 1. Giỏ có 2 item, địa chỉ default sẵn có, COD chọn.<br>2. Bấm **Đặt hàng**. | • Loading spinner ngắn → screen **"Đặt hàng thành công"**.<br>• Mã đơn hiển thị (ví dụ `#ORD_0001`).<br>• Nút "Xem đơn hàng" điều hướng chi tiết.<br>• Giỏ hàng reset về rỗng. | • `orders/{newId}` mới: `userId`, `items[]`, `subtotal`, `vat`, `shipFee`, `total`, `status:'pending'`, `paymentMethod:'cod'`, `address:{...}`, `timeline:[{status:'pending', at:ts}]`, `createdAt`.<br>• `products/{id}.stock` giảm đúng SL từng item (transaction).<br>• `users/{uid}/notifications` có thêm doc thông báo đặt hàng thành công. | `fq orders <ORDER_ID>`<br>`node -e "...db.collection('products').doc('<PRODUCT_ID>').get().then(d=>console.log('stock=',d.data().stock))..."` |
| **TC_CHECKOUT_02** | Địa chỉ mặc định auto chọn sẵn | 1. Vào Checkout (không động địa chỉ). | • Địa chỉ default được chọn sẵn.<br>• Không cần user thao tác. | • Không write gì thêm trong bước này (chỉ đọc). | `fq users <UID> addresses` (verify isDefault:true) |
| **TC_CHECKOUT_03** | Transaction trừ tồn kho REAL-TIME (đúng từng item) | 1. Ghi nhận `stock` trước checkout (ví dụ product A = 10).<br>2. Đặt 2 sản phẩm A (qty 2).<br>3. Query DB ngay. | • Đơn thành công.<br>• Không có lỗi chập chờn. | • `products/A.stock == 8` (10 - 2).<br>• `orders/{id}.items[0].quantity == 2`.<br>• Transaction commit 1 lần. | `fq products A` (stock)<br>`fq orders <ORDER_ID>` |
| **TC_CHECKOUT_04** | Đặt khi hết hàng (stock = 0) | 1. Giỏ chứa sản phẩm đã về stock=0 (set qua Console).<br>2. Bấm Đặt hàng. | • Toast đỏ `"Sản phẩm đã hết hàng"`.<br>• KHÔNG tạo order mới.<br>• Giỏ giữ nguyên để user xoá. | • `orders` count KHÔNG tăng.<br>• `products/{id}.stock` vẫn 0. | `fq orders` (count không đổi) |
| **TC_CHECKOUT_05** | Số lượng vượt tồn kho | 1. Product stock=3, cart qty=5.<br>2. Bấm Đặt hàng. | • Toast đỏ `"Số lượng vượt tồn kho (còn 3)"`.<br>• Không tạo order. | • `orders` count không tăng.<br>• `stock` giữ nguyên 3. | `fq products <PRODUCT_ID>` (stock=3) |

---

### UC015 — Quản lý Đơn hàng

| Mã TC | Tên kịch bản & Mục tiêu | Các bước thực hiện trên UI | Kết quả mong đợi trên UI | Đối chiếu Database Firestore | Lệnh CLI / Truy vấn kiểm chứng |
|---|---|---|---|---|---|
| **TC_ORDER_01** | 4 tab: Tất cả / Đang xử lý / Đã giao / Đã huỷ | 1. Vào **Đơn hàng**.<br>2. Tap lần lượt 4 tab. | • Tab active có gạch chân cam.<br>• List lọc đúng theo status.<br>• Tab **Tất cả** hiện mọi đơn. | • `orders.where('userId','==',uid).where('status','==','pending')` count = tab "Đang xử lý". | `node -e "...db.collection('orders').where('userId','==','<UID>').where('status','==','pending').get().then(s=>console.log(s.size))..."` |
| **TC_ORDER_02** | Chi tiết đơn — timeline 4 bước | 1. Tap 1 đơn pending.<br>2. Quan sát timeline. | • Timeline: `Đặt hàng → Xác nhận → Đang giao → Đã giao`.<br>• Bước đã đi qua: active; bước chưa: xám.<br>• Có timestamp từng bước. | • `orders/{id}.timeline[]` là array object `{status, at}` khớp UI. | `fq orders <ORDER_ID>` (field `timeline`) |

---

### UC016 — Huỷ đơn hàng & hoàn tồn kho

| Mã TC | Tên kịch bản & Mục tiêu | Các bước thực hiện trên UI | Kết quả mong đợi trên UI | Đối chiếu Database Firestore | Lệnh CLI / Truy vấn kiểm chứng |
|---|---|---|---|---|---|
| **TC_ORDER_03** | Huỷ đơn pending + lý do → hoàn stock | 1. Mở đơn pending (product stock hiện tại = X).<br>2. Bấm **Huỷ đơn**.<br>3. Chọn lý do `"Đổi ý"`, xác nhận. | • Toast `"Đã huỷ đơn hàng"`.<br>• Đơn chuyển tab **Đã huỷ**.<br>• Chi tiết đơn hiển thị lý do huỷ. | • `orders/{id}.status == 'cancelled'`.<br>• `orders/{id}.cancelReason == 'Đổi ý'`.<br>• `orders/{id}.cancelledAt` timestamp.<br>• `products/{id}.stock` **tăng lại** bằng đúng quantity của đơn (transaction). | `fq orders <ORDER_ID>` (status, cancelReason)<br>`fq products <PRODUCT_ID>` (stock tăng) |
| **TC_ORDER_04** | Chặn huỷ đơn đã giao (`delivered`) | 1. Mở đơn `delivered`.<br>2. Quan sát nút Huỷ. | • Nút Huỷ **không hiển thị** hoặc disabled.<br>• Nếu cố gọi API → message `"Không thể huỷ đơn đã giao"`. | • `orders/{id}.status == 'delivered'` (không đổi).<br>• `products/{id}.stock` không tăng. | `fq orders <ORDER_ID>` (status vẫn delivered) |
| **TC_ORDER_05** | Huỷ đơn không nhập lý do (EDGE) | 1. Mở đơn pending.<br>2. Bấm Huỷ, **bỏ trống lý do**, xác nhận. | • Modal không cho submit (`Xác nhận` disabled) HOẶC<br>• Toast `"Vui lòng chọn/nhập lý do huỷ"`. | • `orders/{id}.status` **KHÔNG đổi** (vẫn `pending`).<br>• `stock` không thay đổi. | `fq orders <ORDER_ID>` (verify status pending, không có `cancelReason`) |

---

### UC017 — Thông báo & đồng bộ trạng thái đọc

| Mã TC | Tên kịch bản & Mục tiêu | Các bước thực hiện trên UI | Kết quả mong đợi trên UI | Đối chiếu Database Firestore | Lệnh CLI / Truy vấn kiểm chứng |
|---|---|---|---|---|---|
| **TC_NOTIF_01** | Nhận thông báo khi có đơn mới / KM | 1. Đặt hàng thành công (TC_CHECKOUT_01).<br>2. Vào **Thông báo**. | • Icon bell có badge số đỏ.<br>• List có thông báo mới nhất đầu tiên. | • `users/{uid}/notifications` có doc mới với `isRead:false`, `title`, `body`, `createdAt`, `meta` (nếu có). | `fq users <UID> notifications` |
| **TC_NOTIF_02** | Thẻ chưa đọc — nền **trắng**, chấm đỏ | 1. Quan sát thông báo vừa tạo (chưa đọc). | • Nền **trắng** (`#FFFFFF`).<br>• Có **chấm đỏ** góc phải/ trên tiêu đề.<br>• Chữ đậm hơn. | • `users/{uid}/notifications/{id}.isRead == false`. | `fq users <UID> notifications <NOTIF_ID>` |
| **TC_NOTIF_03** | Nhấn xem chi tiết — modal không crash | 1. Tap thông báo.<br>2. Quan sát modal/chi tiết. | • Modal mở, render `title`, `body`, thời gian.<br>• **Không crash** kể cả khi `meta` undefined.<br>• Fallback `meta.bg` an toàn (dùng màu mặc định nếu null/undefined). | • `isRead` chuyển `false → true` (nếu app auto mark khi mở). | `fq users <UID> notifications <NOTIF_ID>` |
| **TC_NOTIF_04** | Thẻ **đã đọc** — nền xám `#F3F4F6`, KHÔNG chấm đỏ | 1. Sau khi đánh dấu đã đọc TC_NOTIF_03.<br>2. Quan sát lại list. | • Nền xám `#F3F4F6`.<br>• Không còn chấm đỏ.<br>• Text thường (không đậm). | • `users/{uid}/notifications/{id}.isRead == true`. | `fq users <UID> notifications <NOTIF_ID>` |
| **TC_NOTIF_05** | Nút "Đánh dấu tất cả đã đọc" đồng bộ ngay | 1. Có nhiều notif chưa đọc.<br>2. Bấm **Đánh dấu tất cả đã đọc**. | • Tất cả thẻ đổi nền xám ngay lập tức.<br>• Badge bell về 0.<br>• Không cần pull-to-refresh. | • TẤT CẢ `users/{uid}/notifications.*.isRead == true`. | `node -e "...db.collection('users').doc('<UID>').collection('notifications').where('isRead','==',false).get().then(s=>console.log('UNREAD:',s.size))..."` (kỳ vọng `0`) |
| **TC_NOTIF_06** | Empty state "Khám phá sản phẩm" khi rỗng | 1. User mới, không có notif.<br>2. Vào **Thông báo**. | • Illustration + text `"Chưa có thông báo"`.<br>• Nút **Khám phá sản phẩm** điều hướng Home. | • `users/{uid}/notifications` count = 0. | `fq users <UID> notifications` |

---

### UC018 — Cài đặt ứng dụng

| Mã TC | Tên kịch bản & Mục tiêu | Các bước thực hiện trên UI | Kết quả mong đợi trên UI | Đối chiếu Database Firestore | Lệnh CLI / Truy vấn kiểm chứng |
|---|---|---|---|---|---|
| **TC_SETTINGS_01** | Đổi ngôn ngữ | 1. **Cài đặt → Ngôn ngữ**.<br>2. Chọn `English`. | • Toàn bộ label đổi sang EN.<br>• Không cần restart app (reactive). | • `users/{uid}/settings.language == 'en'`. | `fq users <UID> settings` |
| **TC_SETTINGS_02** | Đổi tiền tệ | 1. **Cài đặt → Tiền tệ**.<br>2. Chọn `USD`. | • Giá hiển thị `$…` (convert theo tỉ giá nếu có).<br>• Đổi lại VNĐ → `21.990.000 ₫` chuẩn. | • `users/{uid}/settings.currency == 'USD'` (hoặc `'VND'`). | `fq users <UID> settings` |
| **TC_SETTINGS_03** | Toggle thông báo đẩy | 1. Toggle **Push Notifications** off/on. | • Toggle cập nhật visual ngay.<br>• Nếu off, không nhận push (test qua FCM Console). | • `users/{uid}/settings.pushEnabled == false/true`. | `fq users <UID> settings` |

---

### UC019 — FAQ (Accordion)

| Mã TC | Tên kịch bản & Mục tiêu | Các bước thực hiện trên UI | Kết quả mong đợi trên UI | Đối chiếu Database Firestore | Lệnh CLI / Truy vấn kiểm chứng |
|---|---|---|---|---|---|
| **TC_SUPPORT_01** | Accordion mở/đóng FAQ | 1. **Hỗ trợ → FAQ**.<br>2. Tap nhóm `"Thanh toán"`.<br>3. Tap câu hỏi bất kỳ. | • Nhóm expand/collapse mượt (animation).<br>• Câu trả lời hiển thị khi expand.<br>• Chỉ 1 câu mở cùng lúc (theo spec) hoặc multi. | • `faqGroups` count khớp UI.<br>• `faqs.where('groupId','==','payment')` count khớp UI. | `fq faqGroups`<br>`fq faqs` |

---

### UC020 — Gửi ticket hỗ trợ

| Mã TC | Tên kịch bản & Mục tiêu | Các bước thực hiện trên UI | Kết quả mong đợi trên UI | Đối chiếu Database Firestore | Lệnh CLI / Truy vấn kiểm chứng |
|---|---|---|---|---|---|
| **TC_SUPPORT_02** | Gửi ticket thành công lên `tickets` | 1. **Hỗ trợ → Gửi yêu cầu**.<br>2. Nhập tiêu đề `"Lỗi thanh toán"`, mô tả `"Không đặt được đơn"`, chọn loại `Lỗi kỹ thuật`.<br>3. Bấm **Gửi**. | • Toast `"Gửi yêu cầu thành công"`.<br>• Form reset.<br>• Có thể thấy ticket trong lịch sử (nếu có). | • `tickets/{newId}` mới: `userId`, `subject`, `description`, `category`, `status:'open'`, `createdAt`, `email`. | `fq tickets` (đếm +1)<br>`node -e "...db.collection('tickets').orderBy('createdAt','desc').limit(1).get().then(s=>console.log(s.docs[0].data()))..."` |

---

### UC021 — Đánh giá sản phẩm

| Mã TC | Tên kịch bản & Mục tiêu | Các bước thực hiện trên UI | Kết quả mong đợi trên UI | Đối chiếu Database Firestore | Lệnh CLI / Truy vấn kiểm chứng |
|---|---|---|---|---|---|
| **TC_REVIEW_01** | Viết đánh giá 1–5 sao | 1. Vào đơn `delivered`.<br>2. Bấm **Đánh giá**.<br>3. Chọn 5 sao, nhập `"Hàng tốt"`, gửi ảnh (optional).<br>4. **Gửi đánh giá**. | • Toast `"Cảm ơn bạn đã đánh giá"`.<br>• Đánh giá xuất hiện trong PDP.<br>• Rating trung bình có thể update. | • `products/{id}/reviews/{newId}` (hoặc `products/{id}.reviews[]`): `userId`, `rating:5`, `comment`, `images[]`, `createdAt`.<br>• `products/{id}.rating` có thể update lại avg. | `fq products <PRODUCT_ID> reviews`<br>`fq products <PRODUCT_ID>` (field `rating`) |

---

## 3. DANH MỤC CÁC PHÂN HỆ KIỂM THỬ BẮT BUỘC

Bảng dưới đây tổng hợp 8 phân hệ bắt buộc, ánh xạ tới các UC/TC đã định nghĩa.

| # | Phân hệ | UC đảm nhận | Test case chính | Điểm kiểm tra trọng tâm |
|---|---|---|---|---|
| 1 | **Xác thực & Tài khoản** | UC001–UC005 | TC_AUTH_01 → TC_AUTH_11 | Đăng ký tự sinh địa chỉ; login/logout/reset; Guest; persistence qua AsyncStorage |
| 2 | **Danh mục, Tìm kiếm & Bộ lọc** | UC006–UC008 | TC_CAT_01 → TC_FILTER_03 | 5 danh mục; search tiếng Việt có dấu; history dedupe max 10; filter giá ₫; filter ≥ 4★; 5 sort |
| 3 | **Chi tiết Sản phẩm** | UC009 | TC_PDP_01 → TC_PDP_08 | Carousel; giá đúng TRÊN / giá gốc gạch DƯỚI (column); `ProductSpecsTable`; `ProductDescriptionView`; `ProductReviewsList`; variants; Add-to-cart / Buy-now |
| 4 | **Giỏ hàng & Khuyến mãi** | UC010–UC011 | TC_CART_01 → TC_VOUCHER_05 | Stepper không vỡ layout iPhone; xoá item; voucher %/fixed/freeship, min order, expiry; VAT 8%; ship fee; tổng ₫ |
| 5 | **Đặt hàng & Thanh toán** | UC012–UC014 | TC_ADDR_01 → TC_CHECKOUT_05 | Địa chỉ default auto; thêm địa chỉ 4 cấp; unique default; COD bất biến; thẻ lưu `holderName`+`last4` (KHÔNG CVV); **transaction trừ stock** + tạo order |
| 6 | **Quản lý Đơn hàng & Huỷ** | UC015–UC016 | TC_ORDER_01 → TC_ORDER_05 | 4 tab; timeline 4 bước; huỷ đơn pending + lý do → **hoàn stock**; chặn huỷ đơn đã giao |
| 7 | **Thông báo & Đồng bộ đọc** | UC017 | TC_NOTIF_01 → TC_NOTIF_06 | Unread `#FFFFFF` + chấm đỏ; read `#F3F4F6` không chấm; fallback `meta.bg`; "Mark all read"; empty state |
| 8 | **Cài đặt & Hỗ trợ** | UC018–UC021 | TC_SETTINGS_01 → TC_REVIEW_01 | Accordion FAQ; gửi ticket lên `tickets`; toggle ngôn ngữ/tiền tệ/push; đánh giá 1–5 sao |

### 3.1. Checklist phụ — kiểm tra Layout/Design System

| ID | Hạng mục UI | Cách kiểm | Kỳ vọng |
|---|---|---|---|
| UI-DS-01 | Font chuẩn iOS/Android | Render trên iPhone 15 / Pixel 8 | Không fallback system font khác |
| UI-DS-02 | Safe area | Mở app trên iPhone có notch | Không có phần tử bị che bởi status bar/dynamic island |
| UI-DS-03 | Dark mode (nếu có) | Toggle OS dark mode | Text contrast đủ WCAG AA |
| UI-DS-04 | Định dạng tiền tệ | Render giá trị `21990000` | `21.990.000 ₫` (dấu chấm ngăn cách) |
| UI-DS-05 | Touch target | Nút +/-, tab | ≥ 44×44 pt |
| UI-DS-06 | Skeleton loading | Mạng chậm | Có skeleton thay vì blank |
| UI-DS-07 | Offline state | Bật Airplane mode | Banner "Mất kết nối" + không crash |
| UI-DS-08 | Keyboard layout | Form đăng ký | KeyboardAvoidingView hoạt động |

### 3.2. Checklist phụ — Firestore Rules & Security

| ID | Kiểm tra | Kỳ vọng |
|---|---|---|
| SEC-RULE-01 | Đọc `users/{otherUid}` bằng user A | **PERMISSION_DENIED** |
| SEC-RULE-02 | Ghi `orders` từ client khác uid | **PERMISSION_DENIED** |
| SEC-RULE-03 | Update `products.stock` từ client | **PERMISSION_DENIED** (chỉ qua Cloud Function/Admin SDK) |
| SEC-RULE-04 | Đọc `users/{uid}/settings` không phải owner | **PERMISSION_DENIED** |
| SEC-RULE-05 | Tạo `tickets` không authenticated | **PERMISSION_DENIED** |
| SEC-RULE-06 | Update field `isRead` của notif người khác | **PERMISSION_DENIED** |

> **Lưu ý:** Nếu kiến trúc dự án dùng Cloud Function cho các thao tác trừ stock/tạo order (recommended), hãy verify thêm role `Cloud Functions Service Account` có quyền `datastore.user`.

---

## 4. KỊCH BẢN KIỂM THỬ BIÊN (EDGE CASES) & BẢO MẬT (SECURITY)

### 4.1. Edge Case — Tồn kho & đặt hàng

| Mã TC | Tên kịch bản | Các bước UI | Kết quả UI mong đợi | Đối chiếu DB | CLI |
|---|---|---|---|---|---|
| **TC_EDGE_01** | Đặt hàng khi `stock = 0` (out of stock) | 1. Set `products/{id}.stock = 0` trên Console.<br>2. Thêm SP đó vào giỏ.<br>3. Bấm Đặt hàng. | • PDP hiển thị badge `Hết hàng`.<br>• Nút "Thêm vào giỏ" disabled.<br>• Nếu từ giỏ → Toast `"Sản phẩm đã hết hàng"`, không tạo đơn. | • `orders` count không đổi.<br>• `stock` vẫn 0. | `fq products <PRODUCT_ID>` |
| **TC_EDGE_02** | Số lượng trong giỏ > `stock` (race condition) | 1. User A thêm qty 5 khi stock=5.<br>2. User B (thiết bị khác) mua hết 5.<br>3. User A bấm Đặt hàng. | • Toast `"Sản phẩm {name} chỉ còn 0, vui lòng điều chỉnh"`.<br>• Không tạo order.<br>• Cart giữ nguyên để user sửa. | • `orders` count không tăng.<br>• `stock` vẫn 0. | `fq orders`<br>`fq products <PRODUCT_ID>` |
| **TC_EDGE_03** | Đặt 2 đơn đồng thời (double-tap nút Đặt hàng) | 1. Nhấn "Đặt hàng" 2 lần liên tiếp nhanh (trước khi disable). | • Chỉ **1 đơn** được tạo.<br>• Nút disabled ngay sau tap đầu tiên (loading state). | • `orders` chỉ +1 (không +2).<br>• `stock` giảm đúng 1 lần. | `fq orders` (count +1) |
| **TC_EDGE_04** | Checkout với giỏ rỗng | 1. Xoá hết item, vào checkout route (deep link). | • Redirect về Home / thông báo `"Giỏ hàng trống"`. | • Không tạo order. | `fq orders` (không đổi) |
| **TC_EDGE_05** | Checkout với user chưa có địa chỉ (data repair) | 1. Xoá toàn bộ `addresses` trên Console.<br>2. Vào Checkout. | • App tự tạo lại 1 địa chỉ default (fallback) HOẶC force user thêm trước khi submit. | • `users/{uid}/addresses` count ≥ 1 với `isDefault:true`. | `fq users <UID> addresses` |
| **TC_EDGE_06** | Mất mạng giữa transaction | 1. Bấm Đặt hàng, ngay lập tức bật Airplane mode. | • Toast `"Đặt hàng thất bại, vui lòng thử lại"`.<br>• Không treo vô hạn. | • Transaction **rollback** — `orders` không tạo, `stock` không giảm. | `fq orders` và `fq products <PRODUCT_ID>` |

### 4.2. Edge Case — Huỷ đơn & lý do

| Mã TC | Tên kịch bản | Các bước UI | Kết quả UI | Đối chiếu DB | CLI |
|---|---|---|---|---|---|
| **TC_EDGE_07** | Huỷ đơn không nhập lý do (đã mô tả ở TC_ORDER_05) | — | Chặn submit / báo lỗi. | `status` không đổi. | `fq orders <ORDER_ID>` |
| **TC_EDGE_08** | Huỷ đơn đã giao (`delivered`) | 1. Mở đơn delivered, cố bấm Huỷ (nếu có nút). | Báo `"Không thể huỷ đơn đã giao"` / không có nút. | `status=='delivered'`, `stock` không tăng. | `fq orders <ORDER_ID>` |
| **TC_EDGE_09** | Huỷ đơn 2 lần liên tiếp (idempotency) | 1. Huỷ đơn pending.<br>2. Thử huỷ lại. | Toast `"Đơn hàng không ở trạng thái có thể huỷ"`. | `stock` **không tăng gấp đôi**. | `fq products <PRODUCT_ID>` (chỉ tăng 1 lần) |

### 4.3. Edge Case — Voucher & tính tiền

| Mã TC | Tên kịch bản | Các bước UI | Kết quả UI | Đối chiếu DB | CLI |
|---|---|---|---|---|---|
| **TC_EDGE_10** | Voucher hết hạn | 1. Nhập `EXP2023`. | Toast `"Mã đã hết hạn"`. | `vouchers/{code}.expiredAt < now`. | `fq vouchers EXP2023` |
| **TC_EDGE_11** | Voucher dưới min order | 1. Nhập voucher min=500k khi order=100k. | Toast `"Đơn tối thiểu 500.000 ₫"`. | `minOrder > order.subtotal`. | `fq vouchers <CODE>` |
| **TC_EDGE_12** | Voucher giảm % có trần — kiểm tra capped | 1. Order 2.000.000 ₫, mã 10% trần 50.000 ₫. | Giảm đúng **50.000 ₫**, không phải 200.000 ₫. | `total = subtotal - 50000 + vat + ship`. | `fq orders <ORDER_ID>` (field `total`) |
| **TC_EDGE_13** | Áp dụng 2 voucher cùng lúc | 1. Áp `VOUCHER_A` rồi `VOUCHER_B`. | Chỉ 1 voucher active tại thời điểm (thay thế voucher cũ) HOẶC báo lỗi. | `orders/{id}.voucher` **chỉ 1** field. | `fq orders <ORDER_ID>` |
| **TC_EDGE_14** | Tổng tiền làm tròn VNĐ | 1. Order subtotal `333.333 ₫` (VAT 8% = 26.666,64). | Tổng hiển thị integer VNĐ (làm tròn). | `VAT` field là integer, không có phần thập phân. | `fq orders <ORDER_ID>` |

### 4.4. Edge Case — Thông báo & fallback

| Mã TC | Tên kịch bản | Các bước UI | Kết quả UI | Đối chiếu DB | CLI |
|---|---|---|---|---|---|
| **TC_EDGE_15** | `meta.bg` undefined → fallback không crash | 1. Set `users/{uid}/notifications/{id}.meta` = `null` trên Console.<br>2. Mở app → list thông báo.<br>3. Tap xem chi tiết. | • Không crash, dùng màu nền mặc định.<br>• Text hiển thị bình thường. | `meta == null` (đã set). | `fq users <UID> notifications <NOTIF_ID>` |
| **TC_EDGE_16** | `title` hoặc `body` bị thiếu | 1. Set `body = null` trên Console.<br>2. Mở list. | Fallback `"Nội dung không khả dụng"`, không crash. | `body == null`. | `fq users <UID> notifications <NOTIF_ID>` |

### 4.5. Bảo mật — tuyệt đối không lưu CVV

| Mã TC | Tên kịch bản | Các bước UI | Kết quả UI | Đối chiếu DB | CLI |
|---|---|---|---|---|---|
| **TC_SEC_01** | Thêm thẻ → DB KHÔNG có CVV | 1. Nhập thẻ, `CVV=123`.<br>2. Lưu thẻ.<br>3. Query Firestore. | Chỉ hiển thị `**** 1111` + tên chủ thẻ. | • `users/{uid}/paymentMethods/{id}` **không có** field `cvv`, `CVV`, `cvc`, `pan`, `cardNumber`.<br>• Có `last4:'1111'`, `holderName`, `expiry`, `brand`. | `fq users <UID> paymentMethods` |
| **TC_SEC_02** | Scan toàn bộ users → không có trường CVV | 1. Chạy script scan toàn bộ. | N/A | **0 match** trên tất cả `paymentMethods` (và field top-level). | `node -e "const{initializeApp,applicationDefault}=require('firebase-admin/app');const{getFirestore}=require('firebase-admin/firestore');initializeApp({projectId:'e-commerce-market-e2875',credential:applicationDefault()});const db=getFirestore();(async()=>{let hits=0;const users=await db.collection('users').get();for(const u of users.docs){const pm=await u.ref.collection('paymentMethods').get();for(const p of pm.docs){const j=JSON.stringify(p.data()).toLowerCase();if(/cvv|cvc|securitycode|\"pan\"|cardnumber/.test(j)){hits++;console.log('⚠ FOUND in',u.id,p.id)}}}console.log('CVV SCAN RESULT:',hits===0?'✅ CLEAN':`❌ ${hits} HITS`)})()"` |
| **TC_SEC_03** | Đảm bảo `orders` không chứa full PAN | 1. Đặt thẻ tín dụng.<br>2. Query `orders/{id}`. | Order confirmation hiển thị `**** 1111` (không full PAN). | `orders/{id}.paymentMethod` = `'card'` + `cardLast4:'1111'`; **không** có `cardNumber`. | `fq orders <ORDER_ID>` |
| **TC_SEC_04** | Rules chặn truy cập trái phép | 1. Dùng SDK client với **token của user B**, query `users/{uidA}/addresses`. | N/A (test tự động). | `PERMISSION_DENIED` được throw bởi Firestore. | Chạy `firebase emulators:start --only firestore` test với token user B; hoặc dùng script Node `@firebase/rules-unit-testing` |

### 4.6. Bảo mật — Auth & Session

| Mã TC | Tên kịch bản | Các bước | Kết quả | Đối chiếu DB | CLI |
|---|---|---|---|---|---|
| **TC_SEC_05** | Token hết hạn → app tự logout | 1. Chờ token hết hạn (1h) hoặc force `getIdToken(true)` fail.<br>2. Thao tác bất kỳ. | Redirect về Đăng nhập, message `"Phiên đã hết hạn"`. | Không thay đổi DB. | N/A |
| **TC_SEC_06** | Deep link bảo vệ | 1. Gọi URL `yourapp://checkout` khi chưa login. | Redirect về Login + redirect back sau login. | Không có write order. | `fq orders` |
| **TC_SEC_07** | Rate limiting Login (Firebase) | 1. Thử login sai 10 lần liên tiếp. | Firebase Auth tự rate-limit → báo `"Quá nhiều yêu cầu, thử lại sau"`. | Không đổi DB. | N/A |

---

## 5. PHỤ LỤC: CHECKLIST KÝ DUYỆT RELEASE

> Đánh dấu ✅ khi toàn bộ TC của phân hệ pass. Chỉ release khi đạt 100% checklist cột "Blocking".

| Phân hệ | Số TC | Pass | Fail | Blocking? | Người ký | Ngày |
|---|---|---|---|---|---|---|
| 1. Auth & Account | 11 | ☐ | ☐ | **YES** |  |  |
| 2. Category / Search / Filter | 8 | ☐ | ☐ | **YES** |  |  |
| 3. Product Detail (PDP) | 8 | ☐ | ☐ | **YES** |  |  |
| 4. Cart & Voucher | 9 | ☐ | ☐ | **YES** |  |  |
| 5. Address / Payment / Checkout | 15 | ☐ | ☐ | **YES** |  |  |
| 6. Order & Cancel | 5 | ☐ | ☐ | **YES** |  |  |
| 7. Notifications | 6 | ☐ | ☐ | **YES** |  |  |
| 8. Settings / Support / Review | 5 | ☐ | ☐ | NO |  |  |
| 9. Edge Cases (§4.1–4.4) | 16 | ☐ | ☐ | **YES** |  |  |
| 10. Security (§4.5–4.6) | 7 | ☐ | ☐ | **YES** |  |  |
| **TỔNG** | **90** | ☐ | ☐ |  |  |  |

### 5.1. Smoke Test 5 phút trước release

```bash
# 1. Verify connectivity
node -e "const{initializeApp,applicationDefault}=require('firebase-admin/app');const{getFirestore}=require('firebase-admin/firestore');initializeApp({projectId:'e-commerce-market-e2875',credential:applicationDefault()});getFirestore().collection('products').limit(1).get().then(s=>console.log('DB OK:',s.size)).catch(e=>console.error('DB FAIL:',e.message))"

# 2. Verify CVV clean
node -e "const{initializeApp,applicationDefault}=require('firebase-admin/app');const{getFirestore}=require('firebase-admin/firestore');initializeApp({projectId:'e-commerce-market-e2875',credential:applicationDefault()});const db=getFirestore();(async()=>{let h=0;for(const u of (await db.collection('users').get()).docs){for(const p of (await u.ref.collection('paymentMethods').get()).docs){if(/cvv|cvc|securitycode/.test(JSON.stringify(p.data()).toLowerCase()))h++}}console.log(h===0?'✅ CVV CLEAN':'❌ '+h+' HITS')})()"

# 3. Verify unique default address
node -e "const{initializeApp,applicationDefault}=require('firebase-admin/app');const{getFirestore}=require('firebase-admin/firestore');initializeApp({projectId:'e-commerce-market-e2875',credential:applicationDefault()});const db=getFirestore();(async()=>{let bad=0;for(const u of (await db.collection('users').get()).docs){const s=await u.ref.collection('addresses').where('isDefault','==',true).get();if(s.size!==1){bad++;console.log('⚠ UID',u.id,'defaults=',s.size)}}console.log(bad===0?'✅ UNIQUE DEFAULT OK':`❌ ${bad} users vi phạm`)})()"

# 4. Verify orders status enum hợp lệ
node -e "const{initializeApp,applicationDefault}=require('firebase-admin/app');const{getFirestore}=require('firebase-admin/firestore');initializeApp({projectId:'e-commerce-market-e2875',credential:applicationDefault()});const allowed=['pending','confirmed','shipping','delivered','cancelled'];getFirestore().collection('orders').get().then(s=>{const bad=s.docs.filter(d=>!allowed.includes(d.data().status));console.log(bad.length===0?'✅ STATUS ENUM OK':`❌ ${bad.length} invalid`)})"
```

### 5.2. Tiêu chí **Exit Criteria** (Điều kiện dừng kiểm thử)

1. ✅ 100% Test Case **Blocking = YES** PASS.
2. ✅ 0 Critical / 0 High bug mở.
3. ✅ **0 field CVV** trong toàn bộ Firestore.
4. ✅ **0 user** có >1 default address.
5. ✅ **0 order** có status invalid.
6. ✅ Không crash khi đổi `meta.bg = null` (TC_EDGE_15).
7. ✅ Layout không vỡ trên **iPhone SE (375×667)** và **iPhone 15 Pro Max** (TC_CART_01).
8. ✅ Firestore Rules đã publish — không có `allow read, write: if true`.
9. ✅ Chạy thành công Smoke Test 5 phút (§5.1).

### 5.3. Báo cáo Bug — Template chuẩn

```
[SEVERITY] [MODULE] Mô tả ngắn
─────────────────────────────────
Mã TC:          TC_XXX_YY
Thiết bị:       iPhone 15 / iOS 17.5 / Expo Go SDK 52
Build:          vX.Y.Z (build N)
Bước tái hiện:  1...
                2...
                3...
Kỳ vọng:        ...
Thực tế:        ...
DB State:       collection/doc/field = ...
Log / Screenshot: [đính kèm]
─────────────────────────────────
Severity: Critical | High | Medium | Low
```

---

**HẾT TÀI LIỆU**

> Tài liệu này được thiết kế để **lập trình viên** dùng song song khi code (verify DB sau mỗi PR) và **QA** dùng khi chạy regression. Các placeholder `<UID>`, `<PRODUCT_ID>`, `<ORDER_ID>` cần thay bằng ID thực khi thao tác. Đề nghị lưu file vào `docs/TEST_PLAN_FULL.md` trong repo và cập nhật mỗi khi schema Firestore thay đổi.