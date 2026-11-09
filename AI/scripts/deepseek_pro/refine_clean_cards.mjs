// scripts/deepseek_pro/refine_clean_cards.mjs
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

const PROMPT_FILE = path.join(PLANS_PROGRESS, '06_prompt_sua_the_va_dia_chi.md');

function sh(cmd, timeoutMs = 900000) {
  const r = spawnSync(cmd, { cwd: APP_ROOT, shell: true, encoding: 'utf8', timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 });
  return { code: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

async function main() {
  log(`=== BẮT ĐẦU SỬA THẺ THANH TOÁN & SỬA ĐỊA CHỈ (model=${MODEL}) ===`);
  const md = fs.readFileSync(PROMPT_FILE, 'utf8');
  const prompt = md.split('---PROMPT-START---')[1].split('---PROMPT-END---')[0].trim();

  const relevantPaths = [
    'src/types/index.ts',
    'src/constants/theme.ts',
    'app/shipping-address.tsx',
    'app/payment-method.tsx',
  ];

  const all = collectSource();
  const contextFiles = all.filter((f) => relevantPaths.includes(f.rel));
  const srcBundle = bundle(contextFiles);

  const user = `${prompt}\n\n# SOURCE HIỆN TẠI CỦA CÁC FILE LIÊN QUAN\n${srcBundle}`;

  log('Đang gửi yêu cầu tới DeepSeek Pro...');
  const r = await chat({
    system: `${SYSTEM_BASE}\nĐảm bảo code chuẩn xác, súc tích, hoàn toàn không có ảnh bên ngoài cho thẻ, và chức năng sửa địa chỉ hoạt động 100%.`,
    user,
    effort: 'high',
    label: 'clean-cards',
  });

  saveRun('clean_cards_output.txt', r.content);
  saveRun('clean_cards_reasoning.txt', r.reasoning);

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
  const expoCheck = sh(`npx expo export --platform android --output-dir "${path.join(process.env.TEMP ?? APP_ROOT, 'expo_export_clean')}"`);
  if (expoCheck.code !== 0) {
    log(`CẢNH BÁO: expo export lỗi:\n${expoCheck.out}`);
  } else {
    log('expo export: 100% PASS!');
  }

  log('=== HOÀN TẤT TINH CHỈNH THẺ & ĐỊA CHỈ ===');
}

main().catch((err) => {
  log(`LỖI: ${err.message}`);
  process.exit(1);
});
