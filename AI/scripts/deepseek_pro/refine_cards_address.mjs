// scripts/deepseek_pro/refine_cards_address.mjs
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

const PROMPT_FILE = path.join(PLANS_PROGRESS, '05_prompt_sua_dia_chi_va_anh_the.md');

function sh(cmd, timeoutMs = 900000) {
  const r = spawnSync(cmd, { cwd: APP_ROOT, shell: true, encoding: 'utf8', timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 });
  return { code: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

async function main() {
  log(`=== BẮT ĐẦU SỬA ĐỊA CHỈ & ẢNH THẺ (model=${MODEL}) ===`);
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
    system: `${SYSTEM_BASE}\nĐảm bảo code ngắn gọn, chính xác, không thừa thãi. Đảm bảo 100% không lỗi cú pháp.`,
    user,
    effort: 'high',
    label: 'cards-address',
  });

  saveRun('cards_address_output.txt', r.content);
  saveRun('cards_address_reasoning.txt', r.reasoning);

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
  const expoCheck = sh(`npx expo export --platform android --output-dir "${path.join(process.env.TEMP ?? APP_ROOT, 'expo_export_cards')}"`);
  if (expoCheck.code !== 0) {
    log(`CẢNH BÁO: expo export lỗi:\n${expoCheck.out}`);
  } else {
    log('expo export: 100% PASS!');
  }

  log('=== HOÀN TẤT CẬP NHẬT ĐỊA CHỈ & ẢNH THẺ ===');
}

main().catch((err) => {
  log(`LỖI: ${err.message}`);
  process.exit(1);
});
