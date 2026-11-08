import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_DIR = path.resolve(__dirname, '..');
const ENV_PATH = path.join(APP_DIR, '.env');
const STATE_PATH = path.join(__dirname, 'batch_state.json');
const PROMPTS_DIR = path.join(__dirname, 'prompts');

function loadApiKey() {
  if (!fs.existsSync(ENV_PATH)) {
    throw new Error(`File .env not found at ${ENV_PATH}`);
  }
  const content = fs.readFileSync(ENV_PATH, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DEEPSEEK_API_KEY=')) {
      return trimmed.substring('DEEPSEEK_API_KEY='.length).trim().replace(/^["']|["']$/g, '');
    }
  }
  throw new Error('DEEPSEEK_API_KEY not defined in .env');
}

function loadState() {
  if (fs.existsSync(STATE_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    } catch {}
  }
  return { completed: [], failed: [], tokensUsed: { prompt: 0, completion: 0, total: 0 } };
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

async function callDeepSeek(apiKey, { prompt, systemPrompt, model }) {
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      stream: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    const error = new Error(`HTTP ${res.status}: ${text}`);
    error.status = res.status;
    error.body = text;
    throw error;
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content || '';
  const usage = json.usage || {};
  return { content, usage };
}

function extractCode(raw) {
  const match = raw.match(/```(?:tsx|typescript|jsx|javascript)?\n([\s\S]*?)```/);
  return match ? match[1].trim() : raw.trim();
}

export async function generateScreen({ taskKey, promptFile, outputFile, model = 'deepseek-flash' }) {
  const apiKey = loadApiKey();
  const state = loadState();

  if (state.completed.includes(taskKey)) {
    console.log(`[SKIP] Screen ${taskKey} already generated.`);
    return { skipped: true };
  }

  const contextPath = path.join(PROMPTS_DIR, '_context.md');
  const contextContent = fs.existsSync(contextPath) ? fs.readFileSync(contextPath, 'utf8') : '';
  const promptPath = path.isAbsolute(promptFile) ? promptFile : path.join(PROMPTS_DIR, promptFile);
  const promptContent = fs.readFileSync(promptPath, 'utf8');

  const fullPrompt = `${contextContent}\n\n---\n\n${promptContent}`;
  const systemPrompt = `You are a Senior React Native & Expo developer. Return ONLY valid TypeScript/TSX code inside a single \`\`\`tsx codeblock. No explanations, no markdown outside the block. Strictly follow the layout, tokens, icons, and safe area requirements.`;

  console.log(`[START] Generating ${taskKey} with model ${model}...`);
  try {
    const { content, usage } = await callDeepSeek(apiKey, {
      prompt: fullPrompt,
      systemPrompt,
      model,
    });

    const code = extractCode(content);
    const dest = path.isAbsolute(outputFile) ? outputFile : path.join(APP_DIR, outputFile);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, code, 'utf8');

    state.completed.push(taskKey);
    state.tokensUsed.prompt += usage.prompt_tokens || 0;
    state.tokensUsed.completion += usage.completion_tokens || 0;
    state.tokensUsed.total += usage.total_tokens || 0;
    saveState(state);

    console.log(`[SUCCESS] Saved ${taskKey} -> ${outputFile} (tokens: ${usage.total_tokens || 0})`);
    return { success: true, tokens: usage.total_tokens || 0 };
  } catch (err) {
    console.error(`[ERROR] Task ${taskKey} failed:`, err.message);
    if (err.status === 402 || (err.body && (err.body.includes('insufficient_balance') || err.body.includes('balance')))) {
      console.error('[STOP] Hết tiền/tokens tài khoản DeepSeek. Lưu trạng thái dừng.');
      state.failed.push({ taskKey, reason: 'insufficient_balance', time: new Date().toISOString() });
      saveState(state);
      process.exit(402);
    }
    throw err;
  }
}

// Single task run if called via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [,, taskKey, promptFile, outputFile, modelArg] = process.argv;
  if (!taskKey || !promptFile || !outputFile) {
    console.log('Usage: node batch_generator.mjs <taskKey> <promptFile> <outputFile> [model]');
    process.exit(1);
  }
  generateScreen({
    taskKey,
    promptFile,
    outputFile,
    model: modelArg || 'deepseek-flash',
  }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
