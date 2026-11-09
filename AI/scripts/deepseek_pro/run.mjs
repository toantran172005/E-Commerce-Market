// Pipeline: review -> foundation (mock layer) -> screens -> check/repair -> summary
// Dùng:  node scripts/deepseek_pro/run.mjs [--stage review|foundation|screens|check|summary|all] [--force] [--concurrency 3]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  APP_ROOT, PLANS_PROGRESS, MODEL, chat, log, collectSource, bundle, parseFiles, writeFiles, saveRun, SYSTEM_BASE,
} from './lib.mjs';

const args = process.argv.slice(2);
const getArg = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const STAGE = getArg('stage', 'all');
const FORCE = args.includes('--force');
const CONCURRENCY = Number(getArg('concurrency', '2'));

const PROMPT_FILE = path.join(PLANS_PROGRESS, '01_prompt_danh_gia_kiem_thu_frontend.md');
const REPORT_FILE = path.join(PLANS_PROGRESS, '02_bao_cao_danh_gia_frontend.md');
const SUMMARY_FILE = path.join(PLANS_PROGRESS, '03_tom_tat_sau_khi_sua.md');
const STATE_FILE = path.join(PLANS_PROGRESS, 'deepseek_runs', 'state.json');
const BACKUP_DIR = path.join(PLANS_PROGRESS, 'backup_truoc_khi_sua');

const state = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : { foundation: false, screens: {}, check: null };
const saveState = () => { fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true }); fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); };

const want = (s) => STAGE === 'all' || STAGE === s;

function backupOnce() {
  if (fs.existsSync(BACKUP_DIR)) return;
  for (const d of ['app', 'src']) fs.cpSync(path.join(APP_ROOT, d), path.join(BACKUP_DIR, d), { recursive: true });
  log(`Đã backup app/ và src/ -> ${BACKUP_DIR}`);
}

function sh(cmd, timeoutMs = 900000) {
  const r = spawnSync(cmd, { cwd: APP_ROOT, shell: true, encoding: 'utf8', timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 });
  return { code: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

/* ------------------------------ 1. REVIEW ------------------------------ */
async function stageReview() {
  if (fs.existsSync(REPORT_FILE) && !FORCE) { log('review: đã có báo cáo, bỏ qua (dùng --force để chạy lại)'); return; }
  const md = fs.readFileSync(PROMPT_FILE, 'utf8');
  const prompt = md.split('---PROMPT-START---')[1].split('---PROMPT-END---')[0].trim();
  const src = bundle(collectSource());
  const user = `${prompt}\n\n# SOURCE ĐÍNH KÈM\n\n${src}`;
  const r = await chat({ system: SYSTEM_BASE, user, effort: 'max', label: 'review' });
  fs.writeFileSync(REPORT_FILE, r.content, 'utf8');
  saveRun('review_reasoning.txt', r.reasoning);
  log(`review: đã ghi ${REPORT_FILE}`);
}

/* ---------------------------- 2. FOUNDATION ---------------------------- */
const FOUNDATION_SPEC = `
# NHIỆM VỤ: XÂY DỰNG "FOUNDATION" – TẦNG MOCK DATA + STATE + SERVICES + COMPONENT DÙNG CHUNG
Dựa vào BÁO CÁO ĐÁNH GIÁ và SOURCE hiện tại, hãy sinh ra các file nền tảng để biến app thành một ứng dụng hoàn chỉnh chạy bằng mock data. Sau này dev chỉ cần thay tầng \`src/services\` bằng gọi API thật.

## Yêu cầu bắt buộc
1. GIẢ LẬP TẤT CẢ MOCK DATA, cho TẤT CẢ tính năng của app người dùng (KHÔNG làm Admin). Dữ liệu phong phú, thực tế, tiếng Việt:
   - users (≥ 3, 1 user demo đăng nhập được: email \`demo@shop.vn\` / mật khẩu \`123456\`), profile.
   - categories (≥ 8), brands (≥ 10).
   - products (≥ 48, đa dạng danh mục/thương hiệu; mỗi sản phẩm: nhiều ảnh https Unsplash/picsum, biến thể màu/dung lượng, stock (có sản phẩm hết hàng), rating, reviewCount, giá gốc/giá giảm, mô tả, thông số, tag, badge sale/new).
   - reviews (≥ 80, gắn theo sản phẩm).
   - vouchers/promo codes (≥ 6: hợp lệ, hết hạn, đơn tối thiểu, % và số tiền, miễn phí ship).
   - orders (≥ 14 phủ ĐỦ trạng thái pending/processing/shipped/delivered/cancelled, có timeline, lý do huỷ, mã vận đơn).
   - notifications (≥ 20, nhiều loại: order, promo, system, review…; đọc/chưa đọc).
   - addresses (≥ 4, có mặc định), paymentMethods (≥ 4: thẻ, ví, COD… số thẻ che bớt), faqs (≥ 12, có nhóm), supportTickets, appSettings (ngôn ngữ, tiền tệ, thông báo, giao diện, v.v.), searchHistory/popularSearches, shippingMethods.
   - Tất cả có id ổn định, liên kết chéo đúng (order → product/address/payment; review → product/user…). Tạo bằng code TS tĩnh (không random mỗi lần chạy) hoặc seeded để kết quả lặp lại.
2. SERVICES (\`src/services/*.ts\`): mỗi service mô phỏng REST bằng hàm async trả Promise với độ trễ giả (\`delay\` 150–600ms, có thể bật tắt qua hằng \`MOCK_LATENCY\`), có thể ném lỗi có kiểu \`ApiError {code, message}\` (ví dụ sai mật khẩu, hết hàng, voucher sai). Mỗi hàm có JSDoc ghi rõ endpoint REST giả định (ví dụ \`GET /products?category=&q=&sort=&page=\`). Có phân trang/lọc/sắp xếp cho sản phẩm.
3. CONTEXTS (\`src/context/*.tsx\`) dùng React Context + useState ĐƠN GIẢN (không useReducer), dữ liệu trong bộ nhớ, gọi services: Auth, Cart, Favourites, Orders, Addresses, PaymentMethods, Notifications, Settings, ProductFilter (trạng thái lọc Home/Filter), Checkout (draft đơn đang đặt) và \`AppProviders.tsx\` gộp tất cả. Mỗi context export hook \`useXxx()\` ném lỗi rõ ràng nếu dùng ngoài Provider. Phải có: tổng tiền/giảm giá/ship/ tổng cộng của giỏ; đặt hàng tạo Order thật vào OrdersContext, xoá item đã mua khỏi giỏ, sinh thông báo; huỷ đơn; mua lại; đánh dấu thông báo đã đọc; logout reset state người dùng.
4. HOOKS (\`src/hooks/*.ts\`): tiện ích dùng chung (ví dụ \`useAsync\`, \`useDebounce\`, \`useProductSearch\`…) khi cần.
5. COMPONENTS (\`src/components/*.tsx\`): gom các UI lặp lại giữa các màn: ScreenHeader, PrimaryButton/SecondaryButton, ProductCard, SectionHeader, Chip, RatingStars, QuantityStepper, EmptyState, LoadingView, ErrorView, Badge, FormField (TextInput có nhãn/lỗi), ListItemRow, ConfirmSheet/Toast đơn giản (không thư viện ngoài)… Bám design tokens: primary #FF5722, primaryDark #D9400F, primarySoft #FFEDE6, dark #1A1A1A, background #F8F9FB, card #FFFFFF, border #ECEEF1, radius 8/12/16/24, card viền 1px, không shadow nặng. Có accessibilityLabel/Role.
6. TYPES (\`src/types/index.ts\`): GIỮ NGUYÊN các export hiện có (Product, CartItem, UserProfile, OrderItem, Order) nhưng mở rộng tương thích (thêm field optional) và bổ sung type cho mọi thực thể mới. THEME (\`src/constants/theme.ts\`): GIỮ NGUYÊN mọi export hiện có (colors, Colors, COLORS, radius, spacing), được thêm token mới.
7. \`src/utils/format.ts\` (formatMoney, formatDate, formatPhone, validators: email, mật khẩu, số điện thoại VN…).
8. \`app/_layout.tsx\`: bọc \`AppProviders\`, giữ nguyên danh sách Stack.Screen hiện có, thêm route guard chuyển tới \`/(auth)/login\` khi chưa đăng nhập (và về \`/(tabs)/home\` khi đã đăng nhập mà đang ở auth), có màn splash/loading ngắn khi khởi tạo. Không dùng API không tồn tại trong expo-router ~58 (dùng \`useSegments\`, \`useRouter\`, \`Redirect\`, \`Slot/Stack\`).
9. \`src/mock/README.md\`: tài liệu tiếng Việt liệt kê TẤT CẢ thực thể, schema, quan hệ, endpoint REST giả định tương ứng với từng service, và hướng dẫn thay mock bằng API thật.
10. Chia mock data thành nhiều file nhỏ theo thực thể trong \`src/mock/\` + \`src/mock/index.ts\`.
11. TypeScript strict, KHÔNG dùng \`any\`, không import firebase. Mọi import dùng đường dẫn tương đối chính xác. Code phải biên dịch được với \`tsc --noEmit\` và bundle được bởi Metro.
12. KHÔNG sinh file trong \`app/\` ngoại trừ \`app/_layout.tsx\` (các màn hình sẽ được sửa ở bước sau dựa trên foundation của bạn). Đặt tên hàm/hook/service rõ ràng vì bước sau sẽ đọc lại nguyên các file bạn sinh.

10. QUY TẮC ĐƠN GIẢN, NGẮN GỌN & CHÍNH XÁC (CONCISE & ACCURACY):
    - Người đọc là sinh viên: code phải rõ ràng, trực diện, dễ hiểu, tránh abstraction rườm rà.
    - Dùng trực tiếp các hook từ context (useAuth, useCart, useFavourites, useOrders, useAddresses, usePaymentMethods, useNotifications, useSettings, useProductFilter).
    - Code súc tích, tránh lặp lại; comment tiếng Việt ngắn ở các luồng chính.

## Định dạng đầu ra (BẮT BUỘC)
Trả về DUY NHẤT một chuỗi các khối, không giải thích bên ngoài, không bọc cả khối bằng markdown fence:
=== FILE: đường/dẫn/tương/đối/từ/ECommerceApp.ext ===
<toàn bộ nội dung file, đầy đủ>
=== END FILE ===
Các file gồm cả file mới và file sửa (\`src/types/index.ts\`, \`src/constants/theme.ts\`, \`app/_layout.tsx\`).
`;

async function stageFoundation() {
  if (state.foundation && !FORCE) { log('foundation: đã xong, bỏ qua'); return; }
  backupOnce();
  const report = fs.readFileSync(REPORT_FILE, 'utf8');
  const src = bundle(collectSource());
  const user = `${FOUNDATION_SPEC}\n\n# BÁO CÁO ĐÁNH GIÁ\n${report}\n\n# SOURCE HIỆN TẠI\n${src}`;
  const r = await chat({ system: SYSTEM_BASE, user, effort: 'max', label: 'foundation' });
  saveRun('foundation_output.txt', r.content);
  if (r.finish === 'length') log('CẢNH BÁO: foundation bị cắt do giới hạn token');
  const files = parseFiles(r.content);
  if (!files.length) throw new Error('foundation: không parse được file nào');
  const written = writeFiles(files);
  log(`foundation: ghi ${written.length} file:\n  ${written.join('\n  ')}`);
  state.foundation = written;
  saveState();
}

/* ------------------------------ 3. SCREENS ------------------------------ */
const SCREEN_SPEC = (rel, routes) => `
# NHIỆM VỤ: VIẾT LẠI MÀN HÌNH \`${rel}\`
Sửa toàn bộ lỗi liên quan đến file này trong BÁO CÁO ĐÁNH GIÁ, và nâng cấp để dùng foundation (contexts/services/components/mock) ĐÃ CÓ trong SOURCE foundation bên dưới.

## Yêu cầu
1. Xoá toàn bộ mock data/hằng số dữ liệu inline; lấy dữ liệu qua hooks/context/service của foundation. KHÔNG tự bịa API không tồn tại: chỉ import những export CÓ THẬT trong các file foundation (kiểm tra tên export, chữ ký hàm, đường dẫn tương đối chính xác từ \`${rel}\`).
2. Giữ nguyên bố cục/phong cách thị giác hiện tại (design tokens) trừ khi báo cáo nêu lỗi UI; dùng \`colors/radius/spacing\` từ theme thay vì hardcode màu; dùng các component dùng chung khi phù hợp.
3. Hoạt động ĐẦY ĐỦ: mọi nút/chip/tab/toggle/link đều có hành vi thật; điều hướng đúng route (danh sách route: ${routes.join(', ')}); params có kiểu; xử lý id không tồn tại; có trạng thái loading/empty/error; validate form (thông báo lỗi tiếng Việt, trim, chống submit đúp); luồng dữ liệu liên thông giữa các màn (giỏ, yêu thích, đơn, địa chỉ, thanh toán, thông báo, hồ sơ, cài đặt, bộ lọc).
4. Tính tiền đúng, định dạng tiền nhất quán qua \`formatMoney\`.
5. Accessibility: accessibilityLabel/Role/State cho phần tử tương tác; touch target ≥ 44.
6. Hiệu năng: dùng FlatList cho danh sách dài, keyExtractor, useMemo/useCallback hợp lý.
7. TypeScript strict, không \`any\`, không import thư viện ngoài danh sách cho phép, sửa luôn lỗi encoding/chính tả tiếng Việt trong chuỗi.
8. Code ĐẦY ĐỦ, chạy ngay, \`export default\` đúng như file gốc (giữ tên route/file), không "...", không TODO.
9. Không sửa file khác. Nếu thực sự cần một hàm/field chưa tồn tại trong foundation, hãy tự cài đặt cục bộ trong file này bằng dữ liệu đã có thay vì giả định.

10. QUY TẮC ĐƠN GIẢN, NGẮN GỌN & CHÍNH XÁC (CONCISE & ACCURACY):
    - Người đọc là sinh viên: code phải rõ ràng, trực diện, dễ hiểu, tránh abstraction rườm rà.
    - Dùng trực tiếp các hook từ context (useAuth, useCart, useFavourites, useOrders, useAddresses, usePaymentMethods, useNotifications, useSettings, useProductFilter).
    - Code súc tích, tránh lặp lại; comment tiếng Việt ngắn ở các luồng chính.

## Định dạng đầu ra (BẮT BUỘC)
Chỉ MỘT khối duy nhất, không giải thích:
=== FILE: ${rel} ===
<toàn bộ nội dung file>
=== END FILE ===
`;

async function stageScreens() {
  const report = fs.readFileSync(REPORT_FILE, 'utf8');
  const all = collectSource();
  const screens = all
    .filter((f) => f.rel.startsWith('app/') && !/^app\/(_layout|index)\.tsx$/.test(f.rel) && !/\/index\.tsx$/.test(f.rel))
    .map((f) => f.rel);
  const routes = all.filter((f) => f.rel.startsWith('app/')).map((f) => '/' + f.rel.replace(/^app\//, '').replace(/\.tsx$/, '').replace(/\/index$/, ''));
  const todo = screens.filter((s) => FORCE || state.screens[s] !== 'done');
  log(`screens: ${todo.length}/${screens.length} màn cần xử lý`);

  const queue = [...todo];
  async function worker(id) {
    while (queue.length) {
      const rel = queue.shift();
      try {
        // đọc lại foundation mới nhất mỗi lần để có context đầy đủ (bỏ mock raw data để tiết kiệm token)
        const cur = collectSource();
        const foundation = bundle(cur.filter((f) => (f.rel.startsWith('src/') && !f.rel.startsWith('src/mock/')) || f.rel === 'app/_layout.tsx'));
        const original = cur.find((f) => f.rel === rel);
        const user = `${SCREEN_SPEC(rel, routes)}\n\n# BÁO CÁO ĐÁNH GIÁ\n${report}\n\n# SOURCE FOUNDATION (src/** và app/_layout.tsx)\n${foundation}\n\n# FILE GỐC CẦN VIẾT LẠI\n=== FILE: ${rel} ===\n${original.text}\n=== END FILE ===`;
        const r = await chat({ system: SYSTEM_BASE, user, effort: 'high', label: `screen:${rel}` });
        saveRun(`screen_${rel.replace(/[\\/\[\]()]/g, '_')}.txt`, r.content);
        const files = parseFiles(r.content).filter((f) => f.rel === rel);
        if (!files.length || r.finish === 'length') throw new Error('output không hợp lệ / bị cắt');
        writeFiles(files);
        state.screens[rel] = 'done';
      } catch (e) {
        log(`screens: ${rel} THẤT BẠI: ${e.message}`);
        state.screens[rel] = 'failed';
      }
      saveState();
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i)));
}

/* ------------------------------ 3b. SIMPLIFY ------------------------------ */
// Rút gọn code cho dễ đọc, giữ nguyên hành vi. Chạy trước bước check để tsc bắt lỗi nếu lỡ làm hỏng.
async function stageSimplify() {
  const all = collectSource().filter((f) => /\.tsx?$/.test(f.rel) && f.rel.startsWith('app/') && !/(_layout|index)\.tsx$/.test(f.rel) && f.text.length > 15000);
  const todo = all.filter((f) => FORCE || state.simplified?.[f.rel] !== 'done');
  state.simplified ??= {};
  log(`simplify: ${todo.length}/${all.length} file`);
  const queue = [...todo];
  const worker = async () => {
    while (queue.length) {
      const f = queue.shift();
      try {
        const cur = collectSource();
        const others = bundle(cur.filter((x) => (x.rel.startsWith('src/') && !x.rel.startsWith('src/mock/')) && x.rel !== f.rel));
        const user = `# NHIỆM VỤ: ĐƠN GIẢN HOÁ CODE \`${f.rel}\`\nViết lại file cho NGẮN GỌN, DỄ ĐỌC với người mới học (sinh viên), nhưng GIỮ NGUYÊN 100% hành vi, giao diện, tên export, props, và chữ ký hàm mà file khác đang dùng (xem các file khác bên dưới, không được làm vỡ import của chúng).\nCách làm: bỏ code thừa/chết/import không dùng; gộp đoạn lặp thành hàm nhỏ; bỏ abstraction, generic, type phức tạp không cần thiết; đặt tên rõ nghĩa; thay useReducer bằng useState nếu đổi được mà không đổi hành vi; chia nhỏ hàm quá dài; thêm comment tiếng Việt ngắn ở chỗ khó. KHÔNG thêm tính năng, KHÔNG xoá tính năng, KHÔNG đổi logic tính tiền/điều hướng/validate.\n\n## CÁC FILE src KHÁC (chỉ để tham chiếu)\n${others}\n\n## FILE CẦN ĐƠN GIẢN HOÁ\n=== FILE: ${f.rel} ===\n${f.text}\n=== END FILE ===\n\n## Định dạng đầu ra\nChỉ một khối:\n=== FILE: ${f.rel} ===\n<toàn bộ file>\n=== END FILE ===`;
        const r = await chat({ system: SYSTEM_BASE, user, effort: 'high', label: `simplify:${f.rel}` });
        const out = parseFiles(r.content).filter((x) => x.rel === f.rel);
        if (!out.length || r.finish === 'length') throw new Error('output không hợp lệ / bị cắt');
        writeFiles(out);
        state.simplified[f.rel] = 'done';
      } catch (e) {
        log(`simplify: ${f.rel} THẤT BẠI (giữ bản cũ): ${e.message}`);
        state.simplified[f.rel] = 'failed';
      }
      saveState();
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}

/* ---------------------------- 4. CHECK & REPAIR ---------------------------- */
function parseTscErrors(out) {
  const byFile = {};
  for (const line of out.split(/\r?\n/)) {
    const m = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/);
    if (m) (byFile[m[1].replace(/\\/g, '/')] ??= []).push(line);
  }
  return byFile;
}

async function stageCheck() {
  const result = { rounds: [], tscOk: false, exportOk: false };
  for (let round = 1; round <= 4; round++) {
    const t = sh('npx tsc --noEmit');
    const errs = parseTscErrors(t.out);
    const files = Object.keys(errs);
    log(`check: vòng ${round}: tsc ${t.code === 0 ? 'OK' : `${files.length} file lỗi`}`);
    result.rounds.push({ round, tscErrorFiles: files.length, tscErrors: Object.values(errs).flat().length });
    saveRun(`tsc_round_${round}.txt`, t.out);
    if (t.code === 0) { result.tscOk = true; break; }
    if (round === 4) break;

    const cur = collectSource();
    const foundation = bundle(cur.filter((f) => (f.rel.startsWith('src/') && !f.rel.startsWith('src/mock/')) || f.rel === 'app/_layout.tsx'));
    for (const rel of files) {
      const file = cur.find((f) => f.rel === rel);
      if (!file) continue;
      const user = `# NHIỆM VỤ: SỬA LỖI BIÊN DỊCH TypeScript\nFile \`${rel}\` có lỗi \`tsc --noEmit\` sau. Sửa MỌI lỗi, giữ nguyên hành vi và giao diện. Chỉ dùng các export CÓ THẬT trong SOURCE foundation bên dưới (nếu import sai tên/đường dẫn, sửa lại cho khớp; nếu thiếu thì cài cục bộ). Nếu lỗi nằm do foundation thiếu/ sai thì vẫn chỉ sửa file này để khớp foundation.\n\n## Lỗi\n${errs[rel].join('\n')}\n\n## SOURCE foundation\n${foundation}\n\n## FILE CẦN SỬA\n=== FILE: ${rel} ===\n${file.text}\n=== END FILE ===\n\n## Định dạng đầu ra\nChỉ một khối:\n=== FILE: ${rel} ===\n<toàn bộ file>\n=== END FILE ===`;
      try {
        const r = await chat({ system: SYSTEM_BASE, user, effort: 'high', label: `fix:${rel}` });
        const out = parseFiles(r.content).filter((f) => f.rel === rel);
        if (out.length) writeFiles(out);
      } catch (e) { log(`fix ${rel} lỗi: ${e.message}`); }
    }
  }

  const ex = sh(`npx expo export --platform android --output-dir "${path.join(process.env.TEMP ?? APP_ROOT, 'expo_export_check')}"`, 1200000);
  result.exportOk = ex.code === 0;
  saveRun('expo_export.txt', ex.out);
  log(`check: expo export (Metro bundle) ${result.exportOk ? 'OK' : 'LỖI'}`);
  state.check = result;
  saveState();
}

/* ------------------------------ 5. SUMMARY ------------------------------ */
async function stageSummary() {
  const report = fs.existsSync(REPORT_FILE) ? fs.readFileSync(REPORT_FILE, 'utf8') : '';
  const screens = Object.entries(state.screens).map(([k, v]) => `- ${k}: ${v}`).join('\n');
  const user = `Viết bản TÓM TẮT tiếng Việt (markdown) về đợt sửa lỗi & nâng cấp frontend ECommerceApp bằng ${MODEL}, để ghi vào thư mục progress. Gồm: (1) Mục tiêu; (2) Các lỗi chính đã phát hiện (rút từ báo cáo); (3) Những gì đã làm: foundation (mock data, services, contexts, components), các màn đã viết lại; (4) Kết quả kiểm tra tự động; (5) Việc còn tồn đọng / cần người kiểm tra tay; (6) Cách chạy app và đăng nhập demo, cách thay mock bằng backend thật. Ngắn gọn, trung thực, KHÔNG bịa kết quả ngoài dữ liệu cho sẵn.\n\n## Trạng thái các màn\n${screens}\n\n## File foundation đã ghi\n${(state.foundation || []).join('\n')}\n\n## Kết quả check\n${JSON.stringify(state.check, null, 2)}\n\n## Báo cáo đánh giá (đầu)\n${report.slice(0, 40000)}`;
  const r = await chat({ system: SYSTEM_BASE, user, effort: 'high', label: 'summary', thinking: false });
  fs.writeFileSync(SUMMARY_FILE, r.content, 'utf8');
  log(`summary: đã ghi ${SUMMARY_FILE}`);
}

/* --------------------------------- MAIN --------------------------------- */
(async () => {
  log(`=== BẮT ĐẦU stage=${STAGE} model=${MODEL} ===`);
  try {
    if (want('review')) await stageReview();
    if (want('foundation')) await stageFoundation();
    if (want('screens')) await stageScreens();
    if (want('simplify')) await stageSimplify();
    if (want('check')) await stageCheck();
    if (want('summary')) await stageSummary();
    log('=== HOÀN TẤT ===');
  } catch (e) {
    log(`=== LỖI NGHIÊM TRỌNG: ${e.stack || e.message} ===`);
    process.exit(1);
  }
})();
