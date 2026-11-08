// Thư viện dùng chung gọi DeepSeek `deepseek-v4-pro` (streaming, thinking, không giới hạn token thực tế).
// API key đọc từ ECommerceApp/.env (DEEPSEEK_API_KEY) và KHÔNG bao giờ được in ra log.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const APP_ROOT = path.resolve(__dirname, '..', '..');
export const PLANS_PROGRESS = path.resolve(APP_ROOT, '..', 'Plans', 'progress');
export const MODEL = 'deepseek-v4-pro';
const MAX_TOKENS = 384000; // trần của v4-pro: gồm cả token suy luận

export function loadApiKey() {
  const envPath = path.join(APP_ROOT, '.env');
  if (!fs.existsSync(envPath)) throw new Error(`Không thấy file .env tại ${envPath}`);
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (t.startsWith('DEEPSEEK_API_KEY=')) {
      const key = t.slice('DEEPSEEK_API_KEY='.length).trim().replace(/^["']|["']$/g, '');
      if (key && key !== 'your_deepseek_api_key_here') return key;
    }
  }
  throw new Error('DEEPSEEK_API_KEY không hợp lệ trong .env');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Gọi chat/completions dạng stream. Trả về { content, reasoning, usage, finish }.
 * Tự retry khi lỗi mạng / 429 / 5xx.
 */
export async function chat({ system, user, effort = 'high', thinking = true, label = 'call', retries = 4 }) {
  const apiKey = loadApiKey();
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: user });

  const body = {
    model: MODEL,
    messages,
    stream: true,
    stream_options: { include_usage: true },
    max_tokens: MAX_TOKENS,
    thinking: { type: thinking ? 'enabled' : 'disabled' },
  };
  if (thinking) body.reasoning_effort = effort;

  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const t0 = Date.now();
      log(`[${label}] gửi request (${Math.round(user.length / 1024)} KB prompt, attempt ${attempt})...`);
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text();
        const e = new Error(`API ${res.status}: ${txt.slice(0, 500)}`);
        e.status = res.status;
        throw e;
      }

      let content = '';
      let reasoning = '';
      let usage = null;
      let finish = null;
      let lastTick = Date.now();
      const decoder = new TextDecoder();
      let buf = '';
      for await (const chunk of res.body) {
        buf += decoder.decode(chunk, { stream: true });
        let idx;
        while ((idx = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') continue;
          let j;
          try { j = JSON.parse(data); } catch { continue; }
          if (j.usage) usage = j.usage;
          const ch = j.choices?.[0];
          if (!ch) continue;
          if (ch.delta?.content) content += ch.delta.content;
          if (ch.delta?.reasoning_content) reasoning += ch.delta.reasoning_content;
          if (ch.finish_reason) finish = ch.finish_reason;
        }
        if (Date.now() - lastTick > 30000) {
          lastTick = Date.now();
          log(`[${label}] ... đang sinh: reasoning ${Math.round(reasoning.length / 1024)} KB, output ${Math.round(content.length / 1024)} KB`);
        }
      }
      log(`[${label}] xong sau ${Math.round((Date.now() - t0) / 1000)}s | finish=${finish} | output ${Math.round(content.length / 1024)} KB | usage=${JSON.stringify(usage)}`);
      if (!content.trim()) throw new Error('Output rỗng');
      return { content, reasoning, usage, finish };
    } catch (err) {
      lastErr = err;
      const retriable = !err.status || err.status === 429 || err.status >= 500;
      log(`[${label}] LỖI: ${String(err.message).slice(0, 300)}${retriable ? ' -> thử lại' : ''}`);
      if (!retriable || attempt === retries) break;
      await sleep(5000 * attempt);
    }
  }
  throw lastErr;
}

export function log(msg) {
  const line = `${new Date().toISOString()} ${msg}`;
  console.log(line);
  try {
    fs.mkdirSync(PLANS_PROGRESS, { recursive: true });
    fs.appendFileSync(path.join(PLANS_PROGRESS, 'deepseek_run.log'), line + '\n');
  } catch { /* ignore */ }
}

/** Thu thập source để đính kèm vào prompt. */
export function collectSource({ include = ['app', 'src'], extraFiles = ['package.json', 'app.json', 'tsconfig.json'] } = {}) {
  const files = [];
  const skipName = /^(firebaseConfig\.ts|\.env.*)$/;
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.(tsx?|json|md)$/.test(e.name) && !skipName.test(e.name)) files.push(full);
    }
  };
  for (const d of include) if (fs.existsSync(path.join(APP_ROOT, d))) walk(path.join(APP_ROOT, d));
  for (const f of extraFiles) if (fs.existsSync(path.join(APP_ROOT, f))) files.push(path.join(APP_ROOT, f));
  return files.map((f) => ({
    rel: path.relative(APP_ROOT, f).split(path.sep).join('/'),
    text: fs.readFileSync(f, 'utf8'),
  }));
}

export function bundle(files) {
  return files.map((f) => `=== FILE: ${f.rel} ===\n${f.text}\n=== END FILE ===`).join('\n\n');
}

/** Tách các khối `=== FILE: path === ... === END FILE ===` từ output của model. */
export function parseFiles(output) {
  const out = [];
  const re = /=== FILE: (.+?) ===\r?\n([\s\S]*?)\r?\n=== END FILE ===/g;
  let m;
  while ((m = re.exec(output))) {
    let code = m[2];
    const fence = code.match(/^\s*```[a-zA-Z]*\r?\n([\s\S]*?)\r?\n```\s*$/);
    if (fence) code = fence[1];
    out.push({ rel: m[1].trim().replace(/\\/g, '/'), text: code.replace(/\s+$/, '') + '\n' });
  }
  return out;
}

const ALLOWED_PREFIX = ['app/', 'src/'];
export function writeFiles(files) {
  const written = [];
  for (const f of files) {
    if (!ALLOWED_PREFIX.some((p) => f.rel.startsWith(p)) || f.rel.includes('..')) {
      log(`Bỏ qua đường dẫn không hợp lệ: ${f.rel}`);
      continue;
    }
    if (/firebaseConfig|\.env/.test(f.rel)) continue;
    const full = path.join(APP_ROOT, f.rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, f.text, 'utf8');
    written.push(f.rel);
  }
  return written;
}

export function saveRun(name, text) {
  const dir = path.join(PLANS_PROGRESS, 'deepseek_runs');
  fs.mkdirSync(dir, { recursive: true });
  const p = path.join(dir, name);
  fs.writeFileSync(p, text, 'utf8');
  return p;
}

export const SYSTEM_BASE = `Bạn là Staff Mobile Engineer + QA Lead, chuyên React Native 0.88, Expo ~58, expo-router ~58, React 19, TypeScript strict.
Ứng dụng là bản DEMO E-Commerce Marketplace (UI tiếng Việt, tiền hiển thị bằng $). Không có Admin. Mọi dữ liệu là MOCK, lưu trong bộ nhớ.
Chỉ được dùng thư viện đã có: react, react-native, expo-router, @expo/vector-icons (Ionicons), react-native-safe-area-context, expo-status-bar, expo-constants, expo-linking.
QUY TẮC CODE ĐƠN GIẢN (rất quan trọng, người đọc là sinh viên): viết code NGẮN GỌN, DỄ ĐỌC, ĐÚNG; chỉ dùng useState/useContext/useMemo cơ bản (KHÔNG useReducer, KHÔNG generic phức tạp, KHÔNG abstraction thừa, KHÔNG pattern cầu kỳ); hàm nhỏ tên rõ nghĩa; comment tiếng Việt ngắn ở chỗ khó; không lặp code thừa; ưu tiên chính xác hơn "thông minh".
Không được import firebase trong UI. Không dùng NativeWind/styled-components/reanimated. Trả lời chính xác, đầy đủ, không rút gọn, không để TODO hay "...".`;
