// scripts/deepseek_pro/refine.mjs
// Tinh chỉnh 5 khu vực giao diện theo yêu cầu mới bằng DeepSeek Pro (deepseek-v4-pro)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  APP_ROOT,
  PLANS_PROGRESS,
  MODEL,
  chat,
  log,
  collectSource,
  bundle,
  parseFiles,
  writeFiles,
  saveRun,
  SYSTEM_BASE,
} from './lib.mjs';

const PROMPT_FILE = path.join(PLANS_PROGRESS, '04_prompt_chinh_sua_tinh_chinh.md');

function sh(cmd, timeoutMs = 900000) {
  const r = spawnSync(cmd, { cwd: APP_ROOT, shell: true, encoding: 'utf8', timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 });
  return { code: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

async function main() {
  log(`=== BẮT ĐẦU TINH CHỈNH GIAO DIỆN (model=${MODEL}) ===`);
  const md = fs.readFileSync(PROMPT_FILE, 'utf8');
  const prompt = md.split('---PROMPT-START---')[1].split('---PROMPT-END---')[0].trim();

  // Thu thập các file liên quan để làm ngữ cảnh chuẩn xác
  const relevantPaths = [
    'src/types/index.ts',
    'src/constants/theme.ts',
    'src/mock/paymentMethods.ts',
    'src/context/PaymentMethodsContext.tsx',
    'src/context/SettingsContext.tsx',
    'app/(tabs)/home.tsx',
    'app/notification.tsx',
    'app/(tabs)/account.tsx',
    'app/payment-method.tsx',
    'app/checkout.tsx',
    'app/app-settings.tsx',
  ];

  const all = collectSource();
  const contextFiles = all.filter((f) => relevantPaths.includes(f.rel));
  const srcBundle = bundle(contextFiles);

  const user = `${prompt}\n\n# SOURCE HIỆN TẠI CỦA CÁC FILE LIÊN QUAN\n${srcBundle}`;

  log('Đang gửi yêu cầu tinh chỉnh tới DeepSeek Pro...');
  const r = await chat({
    system: `${SYSTEM_BASE}\nƯu tiên cao nhất: Viết code súc tích, ngắn gọn, dễ hiểu cho sinh viên, không viết code thừa. Đảm bảo 100% không lỗi cú pháp và chạy ngay được.`,
    user,
    effort: 'high',
    label: 'refine',
  });

  saveRun('refine_output.txt', r.content);
  saveRun('refine_reasoning.txt', r.reasoning);

  const files = parseFiles(r.content);
  if (!files.length) {
    throw new Error('Không phân tích được file nào từ kết quả trả về của DeepSeek!');
  }

  const written = writeFiles(files);
  log(`Đã cập nhật ${written.length} files:\n  ${written.join('\n  ')}`);

  // Kiểm tra TypeScript
  log('Kiểm tra TypeScript (npx tsc --noEmit)...');
  const tsc = sh('npx tsc --noEmit');
  if (tsc.code !== 0) {
    log(`CẢNH BÁO: tsc có lỗi:\n${tsc.out}`);
  } else {
    log('tsc: 100% PASS (0 lỗi)!');
  }

  // Kiểm tra bundle Expo
  log('Kiểm tra Expo Metro Bundler (npx expo export)...');
  const expoCheck = sh(`npx expo export --platform android --output-dir "${path.join(process.env.TEMP ?? APP_ROOT, 'expo_export_refine')}"`);
  if (expoCheck.code !== 0) {
    log(`CẢNH BÁO: expo export lỗi:\n${expoCheck.out}`);
  } else {
    log('expo export: 100% PASS!');
  }

  log('=== HOÀN TẤT TINH CHỈNH ===');
}

main().catch((err) => {
  log(`LỖI: ${err.message}`);
  process.exit(1);
});
