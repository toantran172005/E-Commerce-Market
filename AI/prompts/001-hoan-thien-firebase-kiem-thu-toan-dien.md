# MISSION: Hoàn thiện ECommerceApp thành sản phẩm production — Firebase thật + DeepSeek Pro + Kiểm thử toàn diện theo Use Case

> Bạn là **agent thực thi tự trị** (có quyền đọc/ghi file, chạy lệnh PowerShell trên Windows). Bạn chạy **liên tục, không dừng giữa chừng để hỏi**, cho tới khi mọi tiêu chí ở mục 9 (DEFINITION OF DONE) đạt, rồi tắt máy theo mục 10.
> Workspace gốc: `d:\Download\Senior Materials\TBDD\E-Commerce Market` — mã nguồn app ở `ECommerceApp/`.

---

## 0. ROLE & CONTEXT

Bạn là **Principal Mobile Engineer + QA Lead**. Bạn điều phối DeepSeek Pro để sinh code khối lượng lớn, còn bạn chịu trách nhiệm: đọc hiểu, thiết kế, kiểm duyệt từng dòng code DeepSeek trả về, lắp vào project, chạy test, sửa lỗi.

**Tech stack thật (đã xác minh từ `ECommerceApp/package.json`) — KHÔNG được nâng/hạ version:**
- Expo SDK `~58.0.19`, `expo-router ~58.0.26` (file-based routing trong `app/`)
- React `19.3.0`, React Native `0.88.0`, TypeScript `~6.0.3`
- `firebase ^12.19.0` (modular SDK: `firebase/app`, `firebase/auth`, `firebase/firestore`)
- `@react-navigation/native ^7.5.0`, `react-native-safe-area-context`, `react-native-screens`, `@expo/vector-icons`
- Test runner: `npx tsx --test` (node:test + node:assert/strict), script `npm test`; typecheck `npm run typecheck`

**Kiến trúc hiện có:**
```
ECommerceApp/
  app/                      # 20+ màn hình expo-router
    (auth)/login.tsx, register.tsx
    (tabs)/home.tsx, favourite.tsx, account.tsx
    product/[id].tsx, order/[id].tsx
    cart.tsx, checkout.tsx, checkout-success.tsx, filter.tsx, orders.tsx,
    notification.tsx, shipping-address.tsx, payment-method.tsx,
    update-user.tsx, app-settings.tsx, help.tsx, _layout.tsx
  src/
    firebaseConfig.ts       # đã initializeApp, export { auth, db }
    services/               # TOÀN BỘ đang là MOCK in-memory (mockDelay + mảng MOCK_*)
      http.ts               # ApiError, apiError(code,msg), respond(), getErrorMessage()
      auth.service.ts, catalog.service.ts, order.service.ts, voucher.service.ts,
      notification.service.ts, profile.service.ts, search.service.ts, support.service.ts
    context/                # Auth, Cart, Checkout, Orders, Favourites, Notifications,
                            # Addresses, PaymentMethods, ProductFilter, Settings, AppProviders
    hooks/                  # useAsync, useDebounce, useProductSearch
    types/index.ts          # Toàn bộ domain types (Product, Order, OrderItem, Voucher, Address...)
    utils/                  # pricing.ts (TAX_RATE, computeVoucherDiscount...), cart.ts, format.ts
    mock/                   # dữ liệu mẫu (products, orders, users, vouchers, ...)
  seed.mjs                  # script seed Firestore: collections categories, brands, products, users, orders, promos
  tests/utils.test.mjs, tests/services.test.mjs   # 30 test hiện có (mock-based)
  scripts/deepseek_pro/lib.mjs   # thư viện gọi DeepSeek (stream, thinking, retry) — TÁI SỬ DỤNG
```

**Hợp đồng service hiện có (PHẢI giữ nguyên chữ ký public để UI không vỡ):**
```ts
AuthService:   login(email,password) · register({fullName,email,phone,password}) · logout() · getProfile(uid)
               · updateProfile(uid, patch) · loginAsGuest()
CatalogService: getCategories() · getBrands() · getProducts(ProductQuery) -> Paged<Product>
               · getProductById(id) · getProductReviews(productId)
  ProductQuery = { q?, category?, categories?, brands?, minPrice?, maxPrice?, minRating?,
                   sort?: 'popular'|'priceAsc'|'priceDesc'|'rating'|'new', page?, limit? }
  Paged<T> = { items, page, limit, total, hasMore }
OrderService:  listOrders(userId) · getOrder(id) · createOrder(CreateOrderInput) · cancelOrder(id, reason) · reorder(id)
VoucherService: listVouchers() · validateVoucher(...)
NotificationService: listNotifications() · markAsRead(id) · markAllAsRead() · createNotification(input)
ProfileService: listAddresses/addAddress/updateAddress/deleteAddress/setDefaultAddress
               · listPaymentMethods/addPaymentMethod/deletePaymentMethod/setDefaultPaymentMethod
               · getSettings/updateSettings
SearchService: getPopularSearches · getSearchHistory · saveSearch(keyword) · clearSearchHistory
SupportService: getFaqGroups · getFaqs · listTickets(userId) · createTicket(input)
Lỗi: luôn throw ApiError(code, message tiếng Việt) qua apiError() — UI dùng getErrorMessage().
```

**Tài liệu nghiệp vụ (nguồn Use Case):**
- `Plans/N13_ApplicationDevelopment_SRS.docx` (đặc tả yêu cầu / use case), `..._SDS.docx`, `..._Testing.docx`, `..._SDLC.docx`
- `Plans/Mô tả đề tài.txt`, `Plans/Kế hoạch.txt`, `Plans/Usecase/*.vpp` (Visual Paradigm — binary, chỉ tham khảo tên)
- `Plans/Final Screens/` (ảnh thiết kế), `Plans/progress/07_bao_cao_nghiem_thu_toan_dien.md` (trạng thái trước đó)
- Đọc `.docx` bằng: `python -c "import zipfile,re,sys;x=zipfile.ZipFile(sys.argv[1]).read('word/document.xml').decode('utf8');print(re.sub(r'<[^>]+>',' ',x))" "<path>"`

---

## 1. CẤU HÌNH DEEPSEEK PRO — FULL OPTIONS, MAX HIỆU NĂNG

Dùng lại `ECommerceApp/scripts/deepseek_pro/lib.mjs` (hàm `chat({system,user,effort,thinking,label,retries})`, `collectSource()`, `log()`). Nếu cần, mở rộng lib (không phá API cũ) để có:

| Tham số | Giá trị |
|---|---|
| `model` | `deepseek-v4-pro` (nếu API trả 400/404 model → fallback `deepseek-reasoner`) |
| `thinking` | `{ type: "enabled" }` |
| `reasoning_effort` | `"max"`; nếu API trả 400 cho giá trị này → tự fallback `"high"` |
| `max_tokens` | `384000` (trần của v4-pro) |
| `stream` | `true` + `stream_options: { include_usage: true }` |
| `retries` | 6, backoff tăng dần, retry khi lỗi mạng/429/5xx |
| Context | Gửi **nguyên văn** các file liên quan (types, service cũ, context, màn hình dùng service đó) — token dồi dào, ưu tiên đủ ngữ cảnh hơn tiết kiệm |
| Song song | Tối đa 3–4 request đồng thời cho các module độc lập |

**Quy tắc khi gọi DeepSeek:**
- Mỗi lần gọi = 1 module rõ ràng (vd: "catalog.service.ts Firestore"), kèm: tech stack, types, contract, file cũ, constraints mục 7, output format mục 8.
- Lưu mọi prompt gửi đi vào `prompts/NNN-<ten>.md` và response thô vào `Plans/progress/deepseek_runs/` để truy vết.
- **Không bao giờ** in API key, nội dung `.env`, hay Firebase config vào log/prompt/báo cáo. Key đọc từ `ECommerceApp/.env` (`DEEPSEEK_API_KEY`).
- Bạn **phải review** output: chạy typecheck + test ngay sau khi lắp; nếu sai → gửi lại DeepSeek kèm log lỗi nguyên văn (vòng fix tối đa 5 lần/module, sau đó tự sửa tay).

---

## 2. PHASE 0 — CHUẨN BỊ & AN TOÀN (bắt buộc làm trước)

1. `git status`; nếu có thay đổi chưa commit → commit `chore: snapshot before production pass`. Tạo nhánh `feat/production-firebase`.
2. `cd ECommerceApp; npm install` (nếu cần) → chạy baseline: `npm run typecheck`, `npm test`. Ghi kết quả baseline vào báo cáo.
3. Đọc toàn bộ: `src/types/index.ts`, mọi file `src/services/*`, `src/context/*`, `src/utils/*`, `seed.mjs`, `src/mock/README.md`, và từng màn hình trong `app/`. Lập bảng **Màn hình → Context → Service method** được dùng.
4. Trích xuất toàn bộ Use Case từ SRS/Testing docx → tạo `Plans/progress/08_usecase_matrix.md` (UC-ID, tên, actor, luồng chính, luồng thay thế/ngoại lệ, màn hình, service). Đối chiếu với code: UC nào chưa có UI/logic → đưa vào backlog phải làm.
5. Commit sau mỗi phase hoàn tất (`feat:`/`test:`/`fix:` rõ ràng).

---

## 3. PHASE 1 — KẾT NỐI DATABASE (Firebase Auth + Cloud Firestore)

1. **Bảo mật config**: chuyển Firebase config hard-code trong `src/firebaseConfig.ts` và `seed.mjs` sang biến môi trường `EXPO_PUBLIC_FIREBASE_*` trong `ECommerceApp/.env` (giữ nguyên `DEEPSEEK_API_KEY`), tạo `.env.example` (chỉ tên biến, không giá trị), đảm bảo `.env` có trong `.gitignore`. `seed.mjs` đọc từ `.env` (dùng `node --env-file=.env` hoặc parse thủ công, không thêm thư viện).
2. **Auth persistence cho React Native**: dùng `initializeAuth` + persistence phù hợp với firebase v12 trên RN; nếu cần `@react-native-async-storage/async-storage` thì cài bằng `npx expo install` (đúng version tương thích SDK 58). Web dùng `getAuth` mặc định. Chống khởi tạo lặp (`getApps().length`).
3. **Kiểm tra kết nối**: viết `scripts/check-firebase.mjs` đọc thử collection `categories`. Nếu lỗi `permission-denied` / Auth provider Email/Password chưa bật / project không truy cập được → **ghi rõ vào báo cáo hướng dẫn người dùng bật trong Firebase Console**, và chuyển sang chạy test với **Firebase Emulator Suite** (`firebase-tools` devDependency; cần Java — nếu không có Java thì ghi nhận và dùng project thật với namespace test). **Không được** tìm cách vượt quyền / sửa rules trên project thật nếu chưa đăng nhập firebase CLI hợp lệ.
4. **Schema Firestore** (thiết kế, ghi vào `docs/DATABASE.md`):
   ```
   categories/{id}   brands/{id}   products/{id}  (stock, soldCount, rating, reviewCount, createdAt, tags, variants...)
   products/{id}/reviews/{reviewId}
   vouchers/{code}   (thay/đồng bộ với 'promos' trong seed — thống nhất 1 tên, cập nhật seed)
   shippingMethods/{id}   faqGroups/{id}   faqs/{id}   popularSearches/{id}
   users/{uid}       (profile; KHÔNG lưu password)
   users/{uid}/addresses/{id}  users/{uid}/paymentMethods/{id} (chỉ last4, brand, holder, expiry — KHÔNG lưu số thẻ đầy đủ/CVV)
   users/{uid}/favourites/{productId}  users/{uid}/cart/{itemKey}
   users/{uid}/notifications/{id}  users/{uid}/searchHistory/{id}  users/{uid}/settings/app
   orders/{id}       (userId, items, totals, status, timeline[], addressSnapshot, paymentSnapshot, voucherCode, createdAt)
   tickets/{id}      (userId, subject, message, status, createdAt)
   ```
5. **Security rules** `ECommerceApp/firestore.rules` + `firestore.indexes.json` + `firebase.json`: catalog read-public/write-deny; `users/{uid}/**` chỉ chủ sở hữu; `orders` create khi `request.auth.uid == request.resource.data.userId`, read chỉ chủ, update chỉ cho phép chuyển `status` → `cancelled` khi đang `pending`/`processing`. Viết test rules bằng emulator nếu khả dụng. Chỉ deploy rules nếu `firebase login` đã có sẵn hợp lệ; nếu không → ghi hướng dẫn deploy vào báo cáo.
6. **Seed**: cập nhật `seed.mjs` cho đúng schema mới, idempotent (setDoc theo id cố định), có cờ `--emulator`. Chạy seed và xác minh số document từng collection.

---

## 4. PHASE 2 — VIẾT LẠI SERVICES GỌI DATABASE THẬT (qua DeepSeek Pro)

Với **từng** service, gọi DeepSeek sinh bản Firestore, giữ nguyên chữ ký public:

1. `http.ts`: giữ `ApiError`, `apiError`, `getErrorMessage`; bỏ `mockDelay` khỏi đường production; thêm `mapFirebaseError(err)` → ApiError với message tiếng Việt (auth/invalid-credential, auth/email-already-in-use, auth/weak-password, auth/network-request-failed, permission-denied, unavailable, not-found...).
2. `auth.service.ts`: Firebase Auth email/password (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword` + tạo `users/{uid}`, `signOut`, `onAuthStateChanged`, `updateProfile`, `sendPasswordResetEmail` nếu UI có "quên mật khẩu"); guest = `signInAnonymously` (nếu provider tắt → báo lỗi rõ ràng). `AuthContext` lắng nghe `onAuthStateChanged`, giữ phiên sau reload.
3. `catalog.service.ts`: Firestore query. Lọc kết hợp nhiều điều kiện (categories + brands + khoảng giá + rating + từ khoá + sort) vượt giới hạn query Firestore → chiến lược: query phía server phần đơn giản (category/where giá/orderBy), phần còn lại lọc + sort + phân trang phía client trên tập đã cache (catalog nhỏ). Kết quả **phải giống hệt** logic mock hiện tại (để test hành vi giữ nguyên). Khai báo index cần thiết trong `firestore.indexes.json`.
4. `order.service.ts` — **placeOrder là chức năng trọng yếu**:
   - `createOrder` dùng `runTransaction`: đọc từng product → kiểm tra tồn tại + `stock >= quantity` (ném `OUT_OF_STOCK` kèm tên SP) → **giá lấy từ DB, không tin giá client** → tính subtotal, phí ship (freeOver), voucher (`computeVoucherDiscount`, kiểm tra hạn, minOrder, usageLimit), thuế `TAX_RATE`, total → trừ stock, tăng soldCount → ghi order status `pending` + timeline → tăng `usedCount` voucher. Sau transaction: tạo notification "Đặt hàng thành công", xoá các item đã mua khỏi cart.
   - Validate input: items rỗng, quantity ≤ 0, thiếu địa chỉ/phương thức thanh toán, user chưa đăng nhập → ApiError rõ ràng.
   - `cancelOrder`: chỉ khi `pending|processing`, bắt buộc reason, transaction hoàn stock + giảm soldCount, thêm timeline, tạo notification.
   - `reorder`: trả OrderItem với giá/stock hiện tại, bỏ SP đã ngừng bán và báo lại.
   - Chống double-submit (idempotency key/cờ đang gửi ở CheckoutContext).
5. `voucher.service.ts`, `notification.service.ts`, `profile.service.ts` (addresses/payment CRUD + default duy nhất bằng `writeBatch`; xoá default → tự gán default cho mục còn lại), `search.service.ts` (history theo user, chống trùng, giới hạn 10, popular từ collection), `support.service.ts`.
6. **Contexts**: Cart, Favourites, Settings, SearchHistory đồng bộ Firestore khi đã đăng nhập (guest: lưu local, merge vào tài khoản khi login). Mọi màn hình phải có trạng thái loading / error (ErrorView + retry) / empty (EmptyState) đúng.
7. Quét lại `app/**` + `src/**`: không còn import `src/mock/*` ở runtime production (mock chỉ dùng cho seed và test unit). Giữ một cờ `EXPO_PUBLIC_DATA_SOURCE=firebase|mock` nếu cần cho unit test offline — mặc định `firebase`.
8. Hoàn thiện mọi Use Case thiếu ở backlog Phase 0 (UI + logic), bám style component sẵn có trong `src/components` và `src/constants/theme.ts`.

---

## 5. PHASE 3 — KIỂM THỬ TOÀN DIỆN THEO TỪNG USE CASE (BẮT BUỘC, CHI TIẾT)

**Tầng test:**
- **Unit** (`tests/*.test.mjs`, mock mode): utils, pricing, cart, filter logic, validate.
- **Integration** (`tests/integration/*.test.mjs`): gọi services thật vào Emulator (ưu tiên) hoặc Firestore thật với user test tạo mới mỗi lần chạy (`qa+<timestamp>@example.com`) và **dọn dẹp dữ liệu test sau khi chạy**.
- **Rules test**: nếu emulator khả dụng.
- **UI/E2E**: chạy `npx expo start --web` (hoặc `expo export --platform web` + serve tĩnh) và dùng Playwright (devDependency, chỉ cho test) để đi qua các luồng chính trên web; nếu không chạy được web vì lý do kỹ thuật → ghi nhận và bù bằng test context/hook.
- Thêm script: `test:unit`, `test:integration`, `test:e2e`, `test:all` vào `package.json`.

**Ma trận bắt buộc — mỗi dòng tối thiểu 1 test happy-path + các test lỗi/biên liệt kê:**

| Nhóm | Chức năng phải test |
|---|---|
| Auth | Đăng ký (thành công; email trùng; email sai định dạng; mật khẩu yếu; SĐT VN sai; thiếu trường) · Đăng nhập (đúng; sai mật khẩu; email không tồn tại; trống) · Guest login · Đăng xuất (xoá state, chặn truy cập route cần auth) · Giữ phiên sau reload · Cập nhật hồ sơ (update-user: tên, SĐT, validate) |
| Catalog / Home | Load categories, brands, sản phẩm nổi bật · Phân trang (page 1, page cuối, `hasMore`, page vượt giới hạn → rỗng) · Chi tiết SP (tồn tại; id không tồn tại → PRODUCT_NOT_FOUND) · Reviews |
| Tìm kiếm | Theo tên/brand/tag, không phân biệt hoa thường, có khoảng trắng thừa, không kết quả · debounce · lưu lịch sử (trùng → đưa lên đầu, giới hạn 10) · xoá lịch sử · popular |
| **Lọc & Sắp xếp** | Từng bộ lọc riêng: 1 category, nhiều categories, 1/nhiều brands, minPrice, maxPrice, khoảng giá, min == max, min > max (xử lý hợp lệ), minRating · **Tổ hợp** q + category + brand + giá + rating · Mỗi sort: popular, priceAsc, priceDesc, rating, new (kiểm tra thứ tự toàn bộ danh sách) · Lọc + sort + phân trang cùng lúc · Reset filter · ProductFilterContext giữ state khi quay lại |
| Favourites | Thêm, bỏ, toggle 2 lần, persist sau reload/login lại, hiển thị grid, empty state |
| Cart | Thêm SP; thêm cùng SP khác màu/size → item riêng (`cartItemKey`); thêm trùng → cộng dồn; stepper +/−; giảm về 0/xoá; không vượt stock; chọn/bỏ chọn item; tổng tiền chỉ tính item được chọn; cart rỗng; persist; merge guest → user |
| Voucher | Không tồn tại; hết hạn; chưa đủ minOrder; % có cap; số tiền cố định; freeship; vượt usageLimit; huỷ áp dụng |
| **Checkout / placeOrder** | Chọn địa chỉ, thanh toán, vận chuyển · tính đúng subtotal/ship/freeOver/discount/tax 8%/total (so sánh với `computeCartTotals`) · đặt hàng thành công → order trong DB đúng dữ liệu, stock giảm, soldCount tăng, voucher usedCount tăng, cart xoá item đã mua, notification được tạo, điều hướng checkout-success · Lỗi: hết hàng, SP bị xoá, thiếu địa chỉ, chưa đăng nhập, mạng lỗi, double-tap (chỉ 1 order), giá client bị sửa (server dùng giá DB) · Đặt 2 đơn đồng thời tranh stock cuối cùng (transaction đúng) |
| Orders | Danh sách theo user (sắp xếp mới nhất), lọc theo tab trạng thái, chi tiết + timeline · Huỷ (pending: ok + hoàn stock; delivered: bị chặn; thiếu lý do: bị chặn) · Reorder (thêm vào cart; SP hết hàng/ngừng bán) · user A không đọc được đơn user B |
| Địa chỉ (CRUD) | Thêm (validate), sửa, xoá, đặt mặc định (chỉ 1 default), xoá default → tự gán, danh sách rỗng |
| Thanh toán (CRUD) | Thêm thẻ (validate Luhn/expiry/CVV — chỉ lưu last4), xoá, đặt mặc định, COD |
| Notifications | List, đánh dấu đã đọc, đọc tất cả, badge số chưa đọc, tạo sau đặt/huỷ đơn |
| Settings | Đọc/ghi từng setting, persist |
| Help / Support | FAQ group + faq, tìm FAQ (nếu có), tạo ticket (validate), danh sách ticket theo user |
| Bảo mật | Rules: không đọc/ghi dữ liệu user khác; không ghi catalog; không sửa order ngoài luồng huỷ |
| Kỹ thuật | `npm run typecheck` 0 lỗi · `npx expo export --platform android` và `--platform web` thành công · không còn `TODO/FIXME/console.log` thừa · không còn import mock ở runtime |

**Vòng lặp TEST → FIX:** chạy `test:all` → với mỗi test fail: xác định nguyên nhân gốc (code app sai hay test sai — **không được sửa test để che bug**) → sửa (tự sửa hoặc gửi DeepSeek kèm stack trace) → chạy lại toàn bộ. Lặp đến khi 100% pass, 3 lần liên tiếp ổn định (không flaky).

---

## 6. PHASE 4 — SẴN SÀNG DEPLOY

1. `app.json`: thêm `android.package`, `ios.bundleIdentifier` (vd `com.n13.ecommercemarket`), `version`, `runtimeVersion` hợp lý; kiểm tra icon/splash tồn tại.
2. Tạo `eas.json` (profiles `development`, `preview` (apk), `production`) — **không** chạy `eas build` nếu chưa đăng nhập Expo; chỉ đảm bảo cấu hình đúng và `expo export` thành công.
3. Xử lý offline/lỗi mạng thân thiện, không crash khi Firestore trả lỗi.
4. Viết `ECommerceApp/README.md`: cài đặt, biến môi trường, seed, chạy emulator, chạy test, build/deploy, deploy rules.
5. Dọn dẹp: không xoá các script cũ trong `scripts/` của người dùng; chỉ xoá file tạm do chính bạn tạo.

---

## 7. STRICT CONSTRAINTS

- Giữ kiến trúc phân tầng: **Screen → Context/Hook → Service → Firebase**. Screen không gọi Firestore trực tiếp.
- Giữ chữ ký public của service và types; nếu buộc phải mở rộng type → chỉ thêm field optional, cập nhật mọi nơi dùng.
- Không thêm thư viện runtime ngoài: `@react-native-async-storage/async-storage` (nếu cần cho auth persistence). DevDependencies cho test được phép: `firebase-tools`, `@firebase/rules-unit-testing`, `playwright`/`@playwright/test`. Cài package Expo bằng `npx expo install`.
- Message lỗi hiển thị cho người dùng bằng **tiếng Việt**, file lưu **UTF-8** (không để lỗi mã hoá ký tự tiếng Việt — kiểm tra lại các file hiện có bị mojibake và sửa nếu thấy trong UI).
- Mọi thao tác tiền tệ làm tròn nhất quán với `utils/pricing.ts`; không tin dữ liệu giá từ client.
- Không `// TODO`, không code giả, không stub, không `any` tràn lan, không bỏ trống catch.
- Không in/commit secret. Không vượt qua cơ chế xác thực/quyền truy cập; nếu bị chặn vì thiếu quyền/đăng nhập → ghi rõ trong báo cáo và tiếp tục phần còn lại.
- Không chạy lệnh phá huỷ ngoài phạm vi project (không xoá thư mục ngoài workspace, không `git push --force`, không reset lịch sử).

---

## 8. OUTPUT FORMAT (yêu cầu với DeepSeek mỗi lần gọi)

DeepSeek phải trả về từng file theo mẫu, **code đầy đủ 100%**, không rút gọn:

````
### FILE: ECommerceApp/src/services/order.service.ts
```ts
<toàn bộ nội dung file>
```
````

Bạn parse theo `### FILE:` để ghi file (ghi đè có backup vào `Plans/progress/backup_<timestamp>/`), sau đó typecheck + test ngay.

---

## 9. DEFINITION OF DONE

- [ ] Services 100% dùng Firebase Auth + Firestore; không import mock ở runtime.
- [ ] `08_usecase_matrix.md` đầy đủ, mọi UC có test tương ứng và trạng thái PASS.
- [ ] `npm run typecheck` 0 lỗi; `npm run test:all` 100% pass, ổn định 3 lần liên tiếp.
- [ ] `expo export` android + web thành công.
- [ ] Rules, indexes, seed, `.env.example`, `eas.json`, README, `docs/DATABASE.md` hoàn chỉnh.
- [ ] Báo cáo cuối `Plans/progress/09_bao_cao_production.md` gồm: tóm tắt thay đổi theo file, bảng kết quả test theo UC (tổng/pass/fail/skip + lý do skip), bug đã phát hiện & cách fix, token/usage DeepSeek, các việc **người dùng cần tự làm** (bật provider Auth, deploy rules, đăng nhập EAS...).
- [ ] Commit cuối `release: production-ready firebase build` trên nhánh `feat/production-firebase` (không push nếu chưa được yêu cầu).

---

## 10. KẾT THÚC — TẮT MÁY

Chỉ khi **toàn bộ** mục 9 đã xong **hoặc** bạn đã bị chặn hoàn toàn không thể tiến thêm (khi đó ghi lý do vào báo cáo):
1. Đảm bảo mọi file đã ghi, đã commit, báo cáo đã lưu.
2. Dừng mọi tiến trình nền do bạn khởi chạy (expo dev server, emulator, playwright).
3. Chạy lệnh tắt máy có hẹn giờ 5 phút để người dùng còn huỷ được:
   ```powershell
   shutdown /s /t 300 /c "ECommerceApp: hoan tat production pass. Bao cao: Plans/progress/09_bao_cao_production.md. Huy bang: shutdown /a"
   ```
4. In ra dòng cuối: đường dẫn báo cáo + "Máy sẽ tắt sau 5 phút. Huỷ bằng `shutdown /a`."

**BẮT ĐẦU NGAY TỪ PHASE 0. Không hỏi lại, không dừng giữa chừng.**
