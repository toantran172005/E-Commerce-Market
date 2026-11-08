import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Load .env manually if needed
const envPath = path.resolve('.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  });
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCPkVyg1V7erOSe2KWUvp9pDfO5EgVsJs4",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "e-commerce-market-e2875.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "e-commerce-market-e2875",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "e-commerce-market-e2875.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "794360087185",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:794360087185:web:ee816e20e5d8d6d1cb3530",
};

console.log('[Check-Firebase] Connecting to project:', firebaseConfig.projectId);

async function main() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const snap = await getDocs(collection(db, 'categories'));
    console.log(`[Check-Firebase] SUCCESS: Connected to Firestore. Found ${snap.docs.length} categories.`);
    snap.docs.forEach(d => {
      console.log(`  - [${d.id}]:`, d.data().name);
    });
    process.exit(0);
  } catch (err) {
    console.error('[Check-Firebase] FAILED:', err.code, err.message);
    process.exit(1);
  }
}

main();
