import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đọc key từ file .env
function loadApiKey() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('Lỗi: Không tìm thấy file .env tại', envPath);
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DEEPSEEK_API_KEY=')) {
      const key = trimmed.substring('DEEPSEEK_API_KEY='.length).trim().replace(/^["']|["']$/g, '');
      if (key && key !== 'your_deepseek_api_key_here') {
        return key;
      }
    }
  }
  console.error('Lỗi: Chưa điền DEEPSEEK_API_KEY hợp lệ trong file .env');
  process.exit(1);
}

async function callDeepSeek({ prompt, systemPrompt, model = 'deepseek-chat' }) {
  const apiKey = loadApiKey();
  console.log(`[DeepSeek] Đang gửi yêu cầu tới model: ${model}...`);
  
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;
  return message?.content || '';
}

// CLI handler
async function main() {
  const args = process.argv.slice(2);
  let promptFilePath = null;
  let outputPath = null;
  let model = 'deepseek-chat'; // hoặc deepseek-reasoner

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--prompt-file' && args[i + 1]) {
      promptFilePath = args[++i];
    } else if (args[i] === '--out' && args[i + 1]) {
      outputPath = args[++i];
    } else if (args[i] === '--model' && args[i + 1]) {
      model = args[++i];
    }
  }

  if (!promptFilePath) {
    console.log('Cách dùng: node call_deepseek.mjs --prompt-file <path> [--out <output_path>] [--model <deepseek-chat|deepseek-reasoner>]');
    process.exit(1);
  }

  const promptContent = fs.readFileSync(path.resolve(process.cwd(), promptFilePath), 'utf8');
  
  const systemPrompt = `Bạn là một lập trình viên React Native & Expo Router chuyên nghiệp.
Nhiệm vụ của bạn là viết code UI hoàn chỉnh, không rút gọn, dùng TypeScript, đúng cấu trúc Expo Router và phong cách sạch sẽ.
Sử dụng @expo/vector-icons (Ionicons, Feather, MaterialIcons,...), SafeAreaView từ react-native-safe-area-context, và StyleSheet chuẩn.`;

  try {
    const result = await callDeepSeek({ prompt: promptContent, systemPrompt, model });
    
    // Tách code block nếu có
    let extractedCode = result;
    const codeBlockMatch = result.match(/```(?:tsx|typescript|jsx|javascript)?\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      extractedCode = codeBlockMatch[1];
    }

    if (outputPath) {
      const fullOut = path.resolve(process.cwd(), outputPath);
      fs.mkdirSync(path.dirname(fullOut), { recursive: true });
      fs.writeFileSync(fullOut, extractedCode, 'utf8');
      console.log(`[Thành công] Đã lưu code vào: ${outputPath}`);
    } else {
      console.log('\n--- KẾT QUẢ TỪ DEEPSEEK ---\n');
      console.log(result);
    }
  } catch (err) {
    console.error('Lỗi khi gọi DeepSeek API:', err.message);
    process.exit(1);
  }
}

main();
